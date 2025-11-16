import React from 'react';
import { FiZap, FiCode, FiLock, FiMessageSquare, FiYoutube, FiGlobe } from 'react-icons/fi';

const features = [
  {
    icon: <FiZap className="w-8 h-8 text-[#a7b4c7]" />,
    title: "Lightning Fast",
    description: "Experience real-time responses with our high-performance AI models that deliver instant results."
  },
  {
    icon: <FiCode className="w-8 h-8 text-[#a7b4c7]" />,
    title: "Code Generation",
    description: "Generate code snippets in multiple programming languages with intelligent suggestions and auto-completion."
  },
  {
    icon: <FiLock className="w-8 h-8 text-[#a7b4c7]" />,
    title: "Secure & Private",
    description: "Your conversations are encrypted and private. We prioritize your data security and privacy."
  },
  {
    icon: <FiMessageSquare className="w-8 h-8 text-[#a7b4c7]" />,
    title: "Multi-turn Conversations",
    description: "Engage in natural, context-aware conversations that remember previous interactions."
  },
  {
    icon: <FiYoutube className="w-8 h-8 text-[#a7b4c7]" />,
    title: "YouTube Integration",
    description: "Paste YouTube URLs to get summaries, transcripts, and insights from video content."
  },
  {
    icon: <FiGlobe className="w-8 h-8 text-[#a7b4c7]" />,
    title: "Multi-language Support",
    description: "Communicate in multiple languages with our advanced translation capabilities."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-[#0f0f0f]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">Powerful Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Discover what makes Chatify AI the most advanced AI assistant on the market</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-effect rounded-xl p-6 hover:border-white/15 transition-colors duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-[#151515] border border-white/5 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* YouTube URL Box */}
        <div className="mt-20 glass-effect rounded-2xl p-8 max-w-4xl mx-auto border border-white/5">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">Extract Insights from YouTube Videos</h3>
            <p className="text-gray-400">Paste a YouTube URL below to get started</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiYoutube className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 bg-[#141414] border border-white/10 rounded-full text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8da0b6] focus:border-transparent"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <button className="px-6 py-2 rounded-full font-semibold text-[#0d0d0d] bg-[#f5f5f5] hover:bg-[#dfe3ea] transition-colors">
                Analyze
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="text-xs bg-[#151515] border border-white/10 text-gray-300 px-3 py-1 rounded-full">Summarize Video</span>
            <span className="text-xs bg-[#151515] border border-white/10 text-gray-300 px-3 py-1 rounded-full">Extract Transcript</span>
            <span className="text-xs bg-[#151515] border border-white/10 text-gray-300 px-3 py-1 rounded-full">Key Points</span>
            <span className="text-xs bg-[#151515] border border-white/10 text-gray-300 px-3 py-1 rounded-full">Generate Notes</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
