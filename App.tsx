
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { MenuIcon, SparkleIcon } from './components/Icon';
import { ChatSession, Message, Attachment } from './types';
import { sendMessageStream } from './services/geminiService';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a default session if none exists
  useEffect(() => {
    // Basic local storage persistence logic could go here
    const savedSessions = localStorage.getItem('gemini_clone_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      } else {
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini_clone_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, isLoading]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!currentSessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      attachments: attachments,
      timestamp: Date.now(),
    };

    // Update UI immediately with user message
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Generate title if it's the first message
        let title = session.title;
        if (session.messages.length === 0) {
            title = text.length > 0 ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : "Image Analysis";
        }
        
        return {
          ...session,
          title,
          messages: [...session.messages, userMsg]
        };
      }
      return session;
    }));

    setIsLoading(true);

    // Placeholder for bot message
    const botMsgId = (Date.now() + 1).toString();
    const botMsgPlaceholder: Message = {
      id: botMsgId,
      role: 'model',
      text: '', // Empty initially
      timestamp: Date.now(),
      isStreaming: true
    };

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return { ...session, messages: [...session.messages, botMsgPlaceholder] };
      }
      return session;
    }));

    try {
        const currentSession = sessions.find(s => s.id === currentSessionId);
        const history = currentSession ? currentSession.messages : [];
        
        // Exclude the message we just added (User) and the placeholder (Bot) 
        // because we are passing the new content explicitly to sendMessageStream
        
        const responseStream = sendMessageStream(text, attachments, currentSessionId, history);

        let accumulatedText = "";
        let accumulatedMetadata = null;

        for await (const chunk of responseStream) {
            accumulatedText += chunk.text;
            if (chunk.groundingMetadata) {
                accumulatedMetadata = chunk.groundingMetadata;
            }
            
            // Update the bot message in real-time
            setSessions(prev => prev.map(session => {
                if (session.id === currentSessionId) {
                    const newMessages = [...session.messages];
                    const lastMsgIndex = newMessages.findIndex(m => m.id === botMsgId);
                    if (lastMsgIndex !== -1) {
                        newMessages[lastMsgIndex] = {
                            ...newMessages[lastMsgIndex],
                            text: accumulatedText,
                            groundingMetadata: accumulatedMetadata || undefined
                        };
                    }
                    return { ...session, messages: newMessages };
                }
                return session;
            }));
        }

    } catch (error) {
        console.error("Failed to generate response", error);
        setSessions(prev => prev.map(session => {
            if (session.id === currentSessionId) {
                const newMessages = [...session.messages];
                const lastMsgIndex = newMessages.findIndex(m => m.id === botMsgId);
                if (lastMsgIndex !== -1) {
                    newMessages[lastMsgIndex] = {
                        ...newMessages[lastMsgIndex],
                        text: "Sorry, I encountered an error processing your request. Please check your connection, API key, or file format.",
                        isStreaming: false
                    };
                }
                return { ...session, messages: newMessages };
            }
            return session;
        }));
    } finally {
        setIsLoading(false);
        setSessions(prev => prev.map(session => {
            if (session.id === currentSessionId) {
                const newMessages = [...session.messages];
                const lastMsgIndex = newMessages.findIndex(m => m.id === botMsgId);
                if (lastMsgIndex !== -1) {
                    newMessages[lastMsgIndex] = {
                        ...newMessages[lastMsgIndex],
                        isStreaming: false
                    };
                }
                return { ...session, messages: newMessages };
            }
            return session;
        }));
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-screen bg-gemini-bg text-gemini-text overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
      />

      <main className="flex-1 flex flex-col h-full relative w-full">
        {/* Top Header (Mobile/Desktop) */}
        <div className="flex items-center justify-between p-4 sticky top-0 z-10 bg-gemini-bg/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
               <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gemini-surface rounded-full text-gemini-text/80 transition-colors"
               >
                 <MenuIcon />
               </button>
            )}
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gemini-surface py-1 px-2 rounded-lg transition-colors">
               <span className="text-xl font-medium text-gray-200">Gemini</span>
               <span className="text-xs text-blue-300 border border-blue-900 bg-blue-900/30 px-1.5 py-0.5 rounded">3.0 Pro</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-gemini-bg hover:ring-blue-500">
             U
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center pb-20 fade-in duration-500 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
              <div className="mb-6 rounded-full bg-gemini-surface/50 p-4 inline-block">
                <SparkleIcon className="w-12 h-12" />
              </div>
              <h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent pb-2">
                Hello, User
              </h1>
              <p className="text-2xl text-gray-500 mt-2">How can I help you today?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 w-full max-w-2xl px-4">
                 {[
                   "Analyze this sales data for trends",
                   "Summarize recent news about AI",
                   "Help me debug this Python code",
                   "Plan a travel itinerary for Japan"
                 ].map((suggestion, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSendMessage(suggestion)}
                      className="bg-[#1E1F20] hover:bg-[#2D2E30] text-left p-4 rounded-xl transition-all border border-transparent hover:border-gray-600"
                    >
                      <p className="text-sm text-gray-200">{suggestion}</p>
                    </button>
                 ))}
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-4">
              {currentSession.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default App;