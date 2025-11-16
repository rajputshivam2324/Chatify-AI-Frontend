import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';
import './index.css';
import LandingPage from './pages/LandingPage';

// Main Chat Component
const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('chat');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [videoUrl, setVideoUrl] = useState('');
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const models = [
    { value: 'chat', label: 'LLaMA 3.1 8B', endpoint: '/model/chat', supportsImages: false },
    { value: 'qwen', label: 'Qwen 2.5 Coder 32B', endpoint: '/model/qwen', supportsImages: false }, // Temporarily disabled images
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
      if (selectedModel === 'image' || selectedModel === 'Chrono-Edit') return; // No conversation for image generation/editing
      
      try {
        const response = await fetch(`http://localhost:4001/model/${selectedModel}/${sessionId}`);
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
        
        response = await fetch('http://localhost:3005/ytchatbot', {
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
          // res.json() will JSON-encode the string, so when parsed it's still a string
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
        
        response = await fetch(`http://localhost:4001${selectedModelConfig.endpoint}`, {
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
        
        response = await fetch(`http://localhost:4001${selectedModelConfig.endpoint}`, {
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
          // Gemma doesn't support images in your current setup
        } else if (selectedModel === 'deepseek') {
          requestBody.userMessage = userMessage;
        }

        console.log('Chat request body:', {
          ...requestBody,
          imageData: requestBody.imageData ? '[IMAGE_DATA]' : undefined,
          imageUrl: requestBody.imageUrl ? '[IMAGE_DATA]' : undefined
        });

        response = await fetch(`http://localhost:4001${selectedModelConfig.endpoint}`, {
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
            {currentModelConfig.supportsImages && (
              <span className="model-feature">📷 Vision Enabled</span>
            )}
          </div>
          {selectedModel === 'ytchatbot' && (
            <div className="video-url-input">
              <label>YouTube Video URL:</label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
              />
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
                              h1: ({node, ...props}) => <h1 style={{fontSize: '32px', fontWeight: 800, marginBottom: '20px', color: '#ffffff', background: 'linear-gradient(135deg, #4a90e2 0%, #805ad5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}} {...props} />,
                              h2: ({node, ...props}) => <h2 style={{fontSize: '28px', fontWeight: 700, marginBottom: '16px', marginTop: '24px', color: '#ffffff', borderBottom: '2px solid rgba(74, 144, 226, 0.3)', paddingBottom: '8px'}} {...props} />,
                              h3: ({node, ...props}) => <h3 style={{fontSize: '24px', fontWeight: 600, marginBottom: '12px', marginTop: '20px', color: '#e5e5e5'}} {...props} />,
                              // Style paragraphs
                              p: ({node, ...props}) => <p style={{marginBottom: '16px', lineHeight: '1.7', color: '#d5d5d5'}} {...props} />,
                              // Style lists
                              ul: ({node, ...props}) => <ul style={{margin: '16px 0', paddingLeft: '24px', listStyleType: 'disc'}} {...props} />,
                              ol: ({node, ...props}) => <ol style={{margin: '16px 0', paddingLeft: '24px', listStyleType: 'decimal'}} {...props} />,
                              li: ({node, ...props}) => <li style={{marginBottom: '8px', color: '#d5d5d5', lineHeight: '1.6'}} {...props} />,
                              // Style code blocks
                              code: ({node, inline, ...props}) => 
                                inline ? (
                                  <code style={{background: 'rgba(74, 144, 226, 0.2)', color: '#4a90e2', padding: '3px 8px', borderRadius: '6px', fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace", fontSize: '14px', border: '1px solid rgba(74, 144, 226, 0.3)'}} {...props} />
                                ) : (
                                  <code style={{display: 'block', padding: '20px', color: '#e5e5e5', background: 'rgba(0, 0, 0, 0.6)', fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace", fontSize: '14px', lineHeight: '1.5', overflowX: 'auto', whiteSpace: 'pre', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', margin: '16px 0'}} {...props} />
                                ),
                              pre: ({node, ...props}) => <pre style={{margin: '16px 0', overflow: 'auto'}} {...props} />,
                              // Style blockquotes
                              blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid rgba(74, 144, 226, 0.5)', paddingLeft: '16px', margin: '16px 0', color: '#b5b5b5', fontStyle: 'italic'}} {...props} />,
                              // Style links
                              a: ({node, ...props}) => <a style={{color: '#4a90e2', textDecoration: 'underline', textUnderlineOffset: '2px'}} target="_blank" rel="noopener noreferrer" {...props} />,
                              // Style strong and emphasis
                              strong: ({node, ...props}) => <strong style={{color: '#ffffff', fontWeight: 700}} {...props} />,
                              em: ({node, ...props}) => <em style={{fontStyle: 'italic', color: '#e5e5e5'}} {...props} />,
                              // Style horizontal rules
                              hr: ({node, ...props}) => <hr style={{border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '24px 0'}} {...props} />,
                              // Style tables with improved formatting
                              table: ({node, ...props}) => (
                                <div style={{overflowX: 'auto', margin: '20px 0', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)'}}>
                                  <table style={{width: '100%', borderCollapse: 'collapse', margin: 0, background: 'rgba(0, 0, 0, 0.3)'}} {...props} />
                                </div>
                              ),
                              thead: ({node, ...props}) => <thead style={{background: 'rgba(74, 144, 226, 0.15)', borderBottom: '2px solid rgba(74, 144, 226, 0.4)'}} {...props} />,
                              tbody: ({node, ...props}) => <tbody {...props} />,
                              tr: ({node, ...props}) => <tr style={{borderBottom: '1px solid rgba(255, 255, 255, 0.1)'}} {...props} />,
                              th: ({node, ...props}) => <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#ffffff', borderRight: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '14px'}} {...props} />,
                              td: ({node, ...props}) => <td style={{padding: '12px 16px', color: '#d5d5d5', borderRight: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '14px', lineHeight: '1.6'}} {...props} />,
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
                </div>
              </div>
            </div>

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
              {(currentModelConfig.supportsImages || selectedModel === 'image') && (
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

// Main App Component with Routing
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;