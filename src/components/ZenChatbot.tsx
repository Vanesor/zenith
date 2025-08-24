"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  content: string;
  sender: "user" | "zen";
  timestamp: Date;
}

export default function ZenChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi! I'm Zen, your Zenith forum assistant. How can I help you navigate the forum or answer questions about our clubs?",
      sender: "zen",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get current page context
      const currentPath = window.location.pathname;
      const pageContent = document.body.innerText.substring(0, 2000); // Get page content for context

      const response = await fetch("/api/chatbot/zen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          history: messages.slice(-5), // Send last 5 messages for context
          currentPage: currentPath,
          pageContent: pageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const zenMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: "zen",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, zenMessage]);
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, I'm having trouble connecting right now. Please try again later!",
        sender: "zen",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickReplies = [
    "Tell me about Ascend club",
    "What events are coming up?",
    "Summarize this page",
    "How do I join a club?",
    "Show me navigation help",
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 ${
          isOpen ? "hidden" : "flex"
        } items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-primary rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      >
        <MessageCircle size={24} className="group-hover:animate-pulse" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
          <Bot size={12} className="text-primary" />
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed z-40 bg-card border border-custom dark:border-gray-600 rounded-2xl shadow-2xl ${
              isMinimized
                ? "bottom-6 right-6 w-80 h-16"
                : "bottom-6 right-6 w-96 h-[600px]"
            } transition-all duration-300 flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-custom dark:border-gray-600 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-card/20 rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-primary font-semibold">Zen Assistant</h3>
                  <p className="text-primary/80 text-xs">
                    Here to help with Zenith Forum
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-primary/80 hover:text-primary hover:bg-card/20 rounded-lg transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 size={16} />
                  ) : (
                    <Minimize2 size={16} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-primary/80 hover:text-primary hover:bg-card/20 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          message.sender === "user"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-primary rounded-br-none"
                            : "bg-zenith-section dark:bg-gray-700 text-primary rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zenith-section dark:bg-gray-700 p-4 rounded-2xl rounded-bl-none">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-zenith-primary rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-zenith-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-zenith-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                {/* <div className="px-4 pb-2 flex-shrink-0">
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => setInputMessage(reply)}
                        className="px-3 py-1 text-xs bg-zenith-section dark:bg-gray-700 text-zenith-secondary dark:text-gray-300 rounded-full hover:bg-zenith-hover dark:hover:bg-blue-900/30 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* Input */}
                <div className="p-4 border-t border-custom dark:border-gray-600 flex-shrink-0">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask Zen about Zenith..."
                      className="flex-1 p-3 border border-custom dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenith-primary text-sm bg-card dark:bg-gray-700 text-primary placeholder-gray-500 dark:placeholder-gray-400"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-primary rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
