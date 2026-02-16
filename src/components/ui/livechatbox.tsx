"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";



// Chat Widget Component
export function ChatWidget({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: "bot", 
      content: "👋 Hi there! How can I help you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    setChatMessages(prev => [
      ...prev, 
      { sender: "user", content: message, timestamp: new Date().toISOString() }
    ]);
    setMessage("");
    
    // Simulate bot typing and response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: "bot", 
          content: "Thanks for your message! Our team will be with you shortly. In the meantime, is there anything specific you'd like to know about our services?", 
          timestamp: new Date().toISOString() 
        }
      ]);
    }, 1500);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-6 right-6 w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Chat header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center mr-3">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Shotlin Support</h3>
            <div className="flex items-center text-white/80 text-xs">
              <span className="h-1.5 w-1.5 bg-green-400 rounded-full mr-1.5"></span>
              Online • Usually responds in minutes
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
      
      {/* Chat messages */}
      <div className="h-80 overflow-y-auto p-4 bg-zinc-900/90 flex flex-col space-y-4">
        <AnimatePresence initial={false}>
          {chatMessages.map((msg, index) => (
            <motion.div
              key={`${msg.timestamp}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex-shrink-0 flex items-center justify-center mr-2">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                </div>
              )}
              
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none'
                  : 'bg-zinc-800 text-white rounded-bl-none'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing indicator - appears when needed */}
        {chatMessages[chatMessages.length - 1]?.sender === 'user' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center mr-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="bg-zinc-800 px-4 py-3 rounded-xl rounded-bl-none">
              <div className="flex space-x-1.5">
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Chat input */}
      <div className="p-3 border-t border-zinc-800/80 flex items-center">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-28 py-3 px-4 pr-10 bg-zinc-800 border-zinc-700/50 focus:border-indigo-500/50 focus:ring-0 text-white placeholder:text-zinc-500 resize-none rounded-xl overflow-hidden"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center disabled:opacity-50 disabled:grayscale"
          >
            <Send className="h-3.5 w-3.5 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

