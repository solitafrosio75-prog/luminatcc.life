/**
 * EmotionalChatInterface - Demo component showcasing the Emotional Connection System
 * Provides a chat interface with real-time emotion detection and empathetic responses
 */

import React, { useState, useRef, useEffect } from 'react';
import { useEmotionalConnection } from '../hooks/useEmotionalConnection';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { Send, Heart, Brain, User, MessageCircle } from 'lucide-react';
import { EmotionalDemoNavigation } from './EmotionalDemoNavigation';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
  emotionalProfile?: any;
  empatheticResponse?: any;
}

export const EmotionalChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    session,
    isInitialized,
    isLoading,
    error,
    sendMessage,
    initializeSession,
    trustLevel,
    interactionCount,
    currentEmotionalState
  } = useEmotionalConnection({
    userId: 'demo-user',
    autoInitialize: true,
    enableFirstImpressionOptimization: true,
    enableEmotionDetection: true,
    enableTrustBuilding: true,
    enablePersonalization: true
  });

  const {
    dominantEmotion,
    emotionalIntensity,
    valence,
    emotionalTrends,
    getEmotionalSummary
  } = useEmotionalState(currentEmotionalState);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeSession('demo-user');
    }
  }, [isInitialized, isLoading, initializeSession]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await sendMessage(inputText, 'chat_interaction');
      
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.empatheticResponse.message,
        sender: 'system',
        timestamp: new Date(),
        emotionalProfile: currentEmotionalState,
        empatheticResponse: response.empatheticResponse
      };

      setMessages(prev => [...prev, systemMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getEmotionColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      joy: 'text-yellow-500',
      sadness: 'text-blue-500',
      anger: 'text-red-500',
      fear: 'text-purple-500',
      disgust: 'text-green-500',
      surprise: 'text-orange-500',
      trust: 'text-teal-500',
      anticipation: 'text-pink-500'
    };
    return colors[emotion] || 'text-gray-500';
  };

  const getValenceColor = (valence: number): string => {
    if (valence > 0.3) return 'bg-green-100 text-green-800';
    if (valence < -0.3) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing emotional connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation */}
      <EmotionalDemoNavigation />

      {/* Header with emotional state */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              Emotional Connection Demo
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Trust Level:</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trustLevel * 100}%` }}
                  ></div>
                </div>
                <span className="text-gray-800 font-medium">{Math.round(trustLevel * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Interactions:</span>
                <span className="text-gray-800 font-medium">{interactionCount}</span>
              </div>
            </div>
          </div>
          
          {/* Emotional state indicators */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-gray-600">Current Emotion:</span>
              <span className={`font-medium ${getEmotionColor(dominantEmotion)}`}>
                {dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1)}
              </span>
              <span className="text-gray-500">({Math.round(emotionalIntensity * 100)}%)</span>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getValenceColor(valence)}`}>
              {getEmotionalSummary()}
            </div>
            {emotionalTrends.trend !== 'stable' && (
              <div className={`text-xs font-medium ${
                emotionalTrends.direction === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {emotionalTrends.trend === 'improving' ? '📈 Improving' : '📉 Declining'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
                {message.empatheticResponse && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">
                      💭 {message.empatheticResponse.validationType} response
                    </p>
                    <p className="text-xs text-gray-500">
                      Timing: {message.empatheticResponse.timing}ms
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 shadow-sm border border-gray-200 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
              Error: {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share how you're feeling..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Try expressing different emotions: "I'm feeling happy today", "This is frustrating", "I'm worried about something"
          </div>
        </div>
      </div>
    </div>
  );
};
