import React from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-[#0d0d0d]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center">
          {/* Left side - Text content */}
          <div className="lg:w-1/2 mb-16 lg:mb-0 lg:pr-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
                World's Most Powerful
                <span className="gradient-text block">AI Assistant</span>
                At Your Fingertips
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-lg">
                Experience the future of AI-powered conversations. Chatify AI combines cutting-edge technology with intuitive design to deliver seamless interactions.
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <a 
                  href="/chat" 
                  className="px-8 py-4 rounded-full font-semibold text-black bg-white hover:bg-gray-200 transition-colors text-lg flex items-center justify-center"

                >
                  Start Chatting Now
                  <FiArrowRight className="ml-2" />
                </a>
              </div>
            </motion.div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">5+</div>
                <div className="text-gray-500 text-sm">AI Models</div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">24/7</div>
                <div className="text-gray-500 text-sm">Support</div>
              </div>
            </div>
          </div>
          
          {/* Right side - Chat preview */}
          <div className="lg:w-1/2 relative">
            <motion.div 
              className="relative z-10 glass-effect rounded-2xl p-6 max-w-lg mx-auto lg:ml-auto border border-white/5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 rounded-full bg-gray-600 mr-2"></div>
                <div className="w-3 h-3 rounded-full bg-gray-600 mr-2"></div>
                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                <div className="ml-auto text-sm text-gray-500">Chatify AI</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#181818] border border-white/5 flex-shrink-0"></div>
                  <div className="ml-3 bg-[#111111] border border-white/5 rounded-2xl p-3 text-sm text-gray-200">
                    <p>Hello! I'm your AI assistant. How can I help you today?</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-white/5 flex-shrink-0"></div>
                  <div className="ml-3 bg-[#111111] border border-white/5 rounded-2xl p-3 text-sm text-gray-300">
                    <p>Can you help me understand how machine learning works?</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#181818] border border-white/5 flex-shrink-0"></div>
                  <div className="ml-3 bg-[#111111] border border-white/5 rounded-2xl p-3 text-sm text-gray-200">
                    <p>Absolutely! Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on building applications that learn from data and improve their accuracy over time.</p>
                  </div>
                </div>
                
                <div className="relative mt-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 bg-[#121212] border border-white/5 rounded-full text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8da0b6] focus:border-transparent"
                    placeholder="Ask me anything..."
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button className="p-2 rounded-full bg-[#1f1f1f] border border-white/5 text-gray-200 hover:border-white/20 transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
