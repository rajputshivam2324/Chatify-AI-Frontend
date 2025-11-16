import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:4001'
    : 'https://chatify-ai-backend1.onrender.com');

const getModelEndpoint = (path) => `${API_BASE_URL}${path}`;

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('chat');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [videoUrl, setVideoUrl] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const models = [
    { value: 'chat', label: 'LLaMA 3.1 8B', endpoint: '/model/chat', supportsImages: false },
    { value: 'qwen', label: 'Qwen 2.5 Coder 32B', endpoint: '/model/qwen', supportsImages: false },
    { value: 'gemma', label: 'Gemma 2 9B', endpoint: '/model/gemma', supportsImages: false },
    { value: 'image', label: 'Stable Diffusion XL', endpoint: '/model/generate-image', supportsImages: false },
    { value: 'deepseek', label: 'Deepseek -R1', endpoint: '/model/deepseek', supportsImages: false },
    { value: 'Chrono-Edit', label: 'Chrono-Edit', endpoint: '/model/Chrono-Edit', supportsImages: true },
    { value: 'ytchatbot', label: 'YT Chatbot', endpoint: '/ytchatbot', supportsImages: false }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history when model changes
  useEffect(() => {
    const loadConversation = async () => {
      if (selectedModel === 'image' || selectedModel === 'Chrono-Edit') return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/model/${selectedModel}/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.conversationHistory && data.conversationHistory.length > 0) {
            const formattedMessages = data.conversationHistory.map(msg => ({
              id: msg.id,
              role: msg.role,
              text: msg.text,
              timestamp: msg.timestamp
            }));
            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.log('No previous conversation found');
      }
    };

    loadConversation();
  }, [selectedModel, sessionId]);

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    
    // Clear current conversation and start fresh
    setMessages([]);
    setInputText('');
    setSelectedFile(null);
    setVideoUrl('');
    
    // Generate new session ID for the new model
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    
    // For ytchatbot, require video URL
    if (selectedModel === 'ytchatbot' && !videoUrl.trim()) {
      alert('Please enter a YouTube video URL');
      return;
    }

    // For Chrono-Edit, require image
    if (selectedModel === 'Chrono-Edit' && !selectedFile) {
      alert('Please select an image to edit');
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      text: userMessage,
      timestamp: Date.now(),
      file: selectedFile
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    try {
      let response;
      const selectedModelConfig = models.find(m => m.value === selectedModel);
      
      console.log('Selected model:', selectedModel);
      
      if (selectedModel === 'ytchatbot') {
        // Handle ytchatbot requests to backend2
        const requestBody = {
          videoUrl: videoUrl.trim(),
          question: userMessage
        };
        console.log('YT Chatbot request body:', requestBody);
        
        response = await fetch('https://ytchatbot-2.onrender.com/ytchatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('YT Chatbot response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('YT Chatbot response data:', data);
          
          // Backend2 returns the answer directly as a string
          let replyText = '';
          if (typeof data === 'string') {
            replyText = data;
          } else if (data && typeof data === 'object') {
            if (data.message) {
              replyText = data.message;
            } else if (data.answer) {
              replyText = data.answer;
            } else {
              replyText = JSON.stringify(data);
            }
          } else {
            replyText = String(data);
          }
          
          const assistantMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            text: replyText,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorText = await response.text();
          throw new Error(`YT Chatbot request failed: ${response.status} - ${errorText}`);
        }
      } else if (selectedModel === 'image') {
        // Handle image generation
        const requestBody = { prompt: userMessage };
        console.log('Image request body:', requestBody);
        
        response = await fetch(getModelEndpoint(selectedModelConfig.endpoint), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Image response status:', response.status);

        if (response.ok) {
          const imageBlob = await response.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          
          const assistantMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            text: `Generated image for: "${userMessage}"`,
            timestamp: Date.now(),
            imageUrl: imageUrl
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorText = await response.text();
          throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
        }
      } else if (selectedModel === 'Chrono-Edit') {
        // Handle Chrono-Edit image editing
        if (!selectedFile) {
          throw new Error('Please select an image to edit');
        }

        const base64Image = await uploadImageToBase64(selectedFile);
        const requestBody = {
          userMessage: userMessage || "Edit this image",
          imageData: base64Image
        };
        
        console.log('Chrono-Edit request body:', {
          ...requestBody,
          imageData: '[IMAGE_DATA]'
        });
        
        response = await fetch(getModelEndpoint(selectedModelConfig.endpoint), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Chrono-Edit response status:', response.status);

        if (response.ok) {
          const imageBlob = await response.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          
          const assistantMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            text: userMessage ? `Edited image based on: "${userMessage}"` : 'Image edited successfully',
            timestamp: Date.now(),
            imageUrl: imageUrl
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorText = await response.text();
          throw new Error(`Image editing failed: ${response.status} - ${errorText}`);
        }
      } else {
        // Handle text chat models
        let requestBody = {
          sessionId: sessionId
        };

        // Handle image upload for vision models
        if (selectedFile && selectedModelConfig.supportsImages) {
          const base64Image = await uploadImageToBase64(selectedFile);
          requestBody.imageData = base64Image;
        }

        if (selectedModel === 'chat') {
          requestBody.userMessage = userMessage;
        } else if (selectedModel === 'qwen') {
          requestBody.userMessage = userMessage;
          if (selectedFile) {
            const base64Image = await uploadImageToBase64(selectedFile);
            requestBody.imageUrl = base64Image;
          }
        } else if (selectedModel === 'gemma') {
          requestBody.prompt = userMessage;
        } else if (selectedModel === 'deepseek') {
          requestBody.userMessage = userMessage;
        }

        console.log('Chat request body:', {
          ...requestBody,
          imageData: requestBody.imageData ? '[IMAGE_DATA]' : undefined,
          imageUrl: requestBody.imageUrl ? '[IMAGE_DATA]' : undefined
        });

        response = await fetch(getModelEndpoint(selectedModelConfig.endpoint), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Chat response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Chat response data:', data);
          
          // Handle different response formats
          let replyText = '';
          if (data.reply) {
            replyText = data.reply;
          } else if (data.choices && data.choices[0] && data.choices[0].message) {
            replyText = data.choices[0].message.content;
          } else if (data.message) {
            replyText = data.message;
          } else if (typeof data === 'string') {
            replyText = data;
          } else {
            replyText = 'Received response but could not parse it.';
          }
          
          console.log('Extracted reply text:', replyText);
          
          const assistantMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            text: replyText,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Request failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Full error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: `Error: ${error.message}`,
        timestamp: Date.now(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }

    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setInputText('');
    setSelectedFile(null);
    setVideoUrl('');
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentModelConfig = models.find(m => m.value === selectedModel);

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={startNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New chat
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="chat-history">
            <div className="section-title">Today</div>
            <div className="chat-item active">
              {currentModelConfig.label} - {messages.length > 0 ? 'Active Chat' : 'New Chat'}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">U</div>
            <span>User</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="chat-header">
          <div className="model-selector">
            <select 
              value={selectedModel} 
              onChange={handleModelChange}
              className="model-dropdown"
            >
              {models.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            {currentModelConfig.supportsImages}
          </div>
          {selectedModel === 'ytchatbot' && (
            <div className="video-url-input">
              <div className="video-url-meta">
                <span className="video-url-chip">YT Chatbot</span>
                <p>Paste a YouTube link to ground this chat in the video’s transcript.</p>
              </div>
              <label htmlFor="youtube-url">YouTube video URL</label>
              <div className="video-url-field">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 12a8 8 0 1116 0 8 8 0 01-16 0zm4.5 0l7-4v8l-7-4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  id="youtube-url"
                  name="youtube-url"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  autoComplete="off"
                />
                {videoUrl && (
                  <button
                    type="button"
                    className="video-url-clear"
                    onClick={() => setVideoUrl('')}
                    aria-label="Clear video URL"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <h1>What's on your mind today?</h1>
              <p>Using {currentModelConfig.label}</p>
              {currentModelConfig.supportsImages && (
                <p className="feature-note">💡 This model supports image analysis</p>
              )}
              {selectedModel === 'image' && (
                <p className="feature-note">🎨 This model generates images from text</p>
              )}
              {selectedModel === 'ytchatbot' && (
                <p className="feature-note">📺 Enter a YouTube video URL above to chat about its content</p>
              )}
              {selectedModel === 'Chrono-Edit' && (
                <p className="feature-note">🖼️ Upload an image and describe how you want to edit it</p>
              )}
            </div>
          ) : (
            <div className="messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className="message-content">
                    {message.file && (
                      <div className="message-file">
                        📷 {message.file.name} ({Math.round(message.file.size / 1024)}KB)
                      </div>
                    )}
                    {message.text && (
                      <div className={`message-text ${message.isError ? 'error' : ''}`}>
                        {message.role === 'assistant' && !message.isError ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Style headings
                              h1: ({node, ...props}) => <h1 style={{fontSize: '32px', fontWeight: 800, marginBottom: '20px', color: '#f5f5f5', letterSpacing: '-0.01em'}} {...props} />,
                              h2: ({node, ...props}) => <h2 style={{fontSize: '24px', fontWeight: 700, marginBottom: '12px', marginTop: '24px', color: '#f0f0f0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px'}} {...props} />,
                              h3: ({node, ...props}) => <h3 style={{fontSize: '20px', fontWeight: 600, marginBottom: '10px', marginTop: '20px', color: '#dcdcdc'}} {...props} />,
                              // Style paragraphs
                              p: ({node, ...props}) => <p style={{marginBottom: '16px', lineHeight: '1.7', color: '#cfcfcf'}} {...props} />,
                              // Style lists
                              ul: ({node, ...props}) => <ul style={{margin: '16px 0', paddingLeft: '24px', listStyleType: 'disc', color: '#cfcfcf'}} {...props} />, 
                              ol: ({node, ...props}) => <ol style={{margin: '16px 0', paddingLeft: '24px', listStyleType: 'decimal', color: '#cfcfcf'}} {...props} />, 
                              li: ({node, ...props}) => <li style={{marginBottom: '8px', color: '#d0d0d0', lineHeight: '1.6'}} {...props} />, 
                              // Style code blocks
                              code: ({node, inline, ...props}) => 
                                inline ? (
                                  <code style={{background: 'rgba(255, 255, 255, 0.06)', color: '#f5f5f5', padding: '3px 8px', borderRadius: '6px', fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace", fontSize: '14px', border: '1px solid rgba(255, 255, 255, 0.08)'}} {...props} />
                                ) : (
                                  <code style={{display: 'block', padding: '20px', color: '#f1f1f1', background: 'rgba(255, 255, 255, 0.03)', fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace", fontSize: '14px', lineHeight: '1.5', overflowX: 'auto', whiteSpace: 'pre', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', margin: '16px 0'}} {...props} />
                                ),
                              pre: ({node, ...props}) => <pre style={{margin: '16px 0', overflow: 'auto'}} {...props} />,
                              // Style blockquotes
                              blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '2px solid rgba(255, 255, 255, 0.15)', paddingLeft: '16px', margin: '16px 0', color: '#bdbdbd', fontStyle: 'italic'}} {...props} />,
                              // Style links
                              a: ({node, ...props}) => <a style={{color: '#f5f5f5', textDecoration: 'underline', textUnderlineOffset: '3px'}} target="_blank" rel="noopener noreferrer" {...props} />,
                              // Style strong and emphasis
                              strong: ({node, ...props}) => <strong style={{color: '#ffffff', fontWeight: 700}} {...props} />,
                              em: ({node, ...props}) => <em style={{fontStyle: 'italic', color: '#dcdcdc'}} {...props} />,
                              // Style horizontal rules
                              hr: ({node, ...props}) => <hr style={{border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '24px 0'}} {...props} />,
                              // Style tables with improved formatting
                              table: ({node, ...props}) => (
                                <div style={{overflowX: 'auto', margin: '20px 0', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)'}}>
                                  <table style={{width: '100%', borderCollapse: 'collapse', margin: 0, background: 'rgba(255, 255, 255, 0.02)'}} {...props} />
                                </div>
                              ),
                              thead: ({node, ...props}) => <thead style={{background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)'}} {...props} />,
                              tbody: ({node, ...props}) => <tbody {...props} />,
                              tr: ({node, ...props}) => <tr style={{borderBottom: '1px solid rgba(255, 255, 255, 0.08)'}} {...props} />,
                              th: ({node, ...props}) => <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#f5f5f5', borderRight: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '14px'}} {...props} />,
                              td: ({node, ...props}) => <td style={{padding: '12px 16px', color: '#d5d5d5', borderRight: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '14px', lineHeight: '1.6'}} {...props} />,
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        ) : (
                          message.text
                        )}
                      </div>
                    )}
                    {message.imageUrl && (
                      <div className="message-image">
                        <img src={message.imageUrl} alt="Generated" style={{maxWidth: '100%', borderRadius: '8px', marginTop: '12px'}} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="input-container">
            {selectedFile && (
              <div className="selected-file">
                <span>📷 {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)</span>
                <button onClick={removeFile} className="remove-file">×</button>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="input-form">
              <div className="input-wrapper">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                {/* Show attach button only for models that support images */}
                {(currentModelConfig.supportsImages || selectedModel === 'image' || selectedModel === 'Chrono-Edit') && (
                  <button
                    type="button"
                    className="attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload image"
                  >
                    📷
                  </button>
                )}

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    selectedModel === 'image' 
                      ? 'Describe your dream image in detail...' 
                      : selectedModel === 'Chrono-Edit'
                        ? 'Describe how to edit the image (optional)...'
                        : currentModelConfig.supportsImages 
                          ? 'Ask me anything or share an image...'
                          : 'Ask me anything...'
                  }
                  className="message-input"
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  className="send-btn"
                  disabled={
                    isLoading || 
                    (selectedModel === 'Chrono-Edit' ? !selectedFile : (!inputText.trim() && !selectedFile))
                  }
                  title="Send message"
                >
                  {isLoading ? (
                    <div className="loading">⏳</div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

