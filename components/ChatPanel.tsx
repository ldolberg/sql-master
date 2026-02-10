
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Loader2, Eraser, Quote } from 'lucide-react';
import { ChatMessage, SqlDialect } from '../types';
import { sendChatMessage, initializeChat } from '../services/geminiService';

interface ChatPanelProps {
  currentSql: string;
  dialect: SqlDialect;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ currentSql, dialect }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (overrideMessage?: string) => {
    const textToSend = overrideMessage || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await sendChatMessage(textToSend, currentSql);
      let modelText = '';
      
      const modelMsgPlaceholder: ChatMessage = { role: 'model', text: '', timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsgPlaceholder]);

      for await (const chunk of result) {
        modelText += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = modelText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error processing your request.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    initializeChat(dialect);
  };

  const quickActions = [
    { label: 'Explain Snippet', prompt: 'Explain exactly what this SQL snippet does in simple terms.' },
    { label: 'Optimize Query', prompt: 'How can I make this SQL query more performant or efficient?' },
    { label: 'Refactor Style', prompt: 'Refactor this query to follow best practices and consistent formatting.' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#252526] overflow-hidden">
      <div className="p-4 border-b border-[#333333] flex items-center justify-between bg-[#2d2d2d]">
        <h2 className="text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center">
          <Sparkles size={14} className="mr-2 text-blue-400" /> AI Assistant
        </h2>
        <button 
          onClick={clearChat}
          className="p-1 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-white"
          title="Clear Conversation"
        >
          <Eraser size={14} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#cccccc]">How can I help with your SQL?</p>
              <p className="text-[10px] text-[#858585] mt-1">I can explain logic, suggest optimizations, or generate dbt models.</p>
            </div>
            <div className="w-full grid grid-cols-1 gap-2">
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  className="w-full p-2 bg-[#2a2d2e] border border-[#333333] hover:border-[#007acc] rounded text-[10px] text-left text-[#cccccc] transition-colors flex items-center group"
                >
                  <Quote size={10} className="mr-2 text-[#858585] group-hover:text-blue-400" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#007acc] text-white' 
                : 'bg-[#1e1e1e] border border-[#333333] text-[#cccccc]'
            }`}>
              <div className="flex items-center space-x-2 mb-1 opacity-50 text-[9px]">
                {msg.role === 'user' ? <User size={10} /> : <Sparkles size={10} />}
                <span>{msg.role === 'user' ? 'You' : 'Gemini'}</span>
              </div>
              <div className="whitespace-pre-wrap font-sans">
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {isTyping && messages[messages.length-1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg px-3 py-2">
              <Loader2 size={14} className="animate-spin text-blue-400" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#2d2d2d] border-t border-[#333333]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about this SQL..."
            className="w-full bg-[#3c3c3c] text-xs py-2 pl-3 pr-10 rounded border border-transparent focus:border-[#007acc] outline-none resize-none h-20"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-2 p-1.5 bg-[#007acc] hover:bg-[#118ad4] disabled:opacity-50 text-white rounded transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[9px] text-[#858585] mt-2 text-center">
          Gemini 3 Flash provides real-time insights on your active workspace.
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
