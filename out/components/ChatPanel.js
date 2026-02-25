import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Loader2, Eraser, Quote } from 'lucide-react';
import { sendChatMessage, initializeChat } from '../services/geminiService';
const ChatPanel = ({ currentSql, dialect }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);
    const handleSend = async (overrideMessage) => {
        const textToSend = overrideMessage || input;
        if (!textToSend.trim() || isTyping)
            return;
        const userMsg = { role: 'user', text: textToSend, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        try {
            const result = await sendChatMessage(textToSend, currentSql);
            let modelText = '';
            const modelMsgPlaceholder = { role: 'model', text: '', timestamp: Date.now() };
            setMessages(prev => [...prev, modelMsgPlaceholder]);
            for await (const chunk of result) {
                modelText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelText;
                    return newMessages;
                });
            }
        }
        catch (error) {
            console.error("Chat failed", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error processing your request.", timestamp: Date.now() }]);
        }
        finally {
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
    return (_jsxs("div", { className: "flex-1 flex flex-col h-full bg-[#252526] overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-[#333333] flex items-center justify-between bg-[#2d2d2d]", children: [_jsxs("h2", { className: "text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center", children: [_jsx(Sparkles, { size: 14, className: "mr-2 text-blue-400" }), " AI Assistant"] }), _jsx("button", { onClick: clearChat, className: "p-1 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-white", title: "Clear Conversation", children: _jsx(Eraser, { size: 14 }) })] }), _jsxs("div", { ref: scrollRef, className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center space-y-4 px-4", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400", children: _jsx(Sparkles, { size: 24 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[#cccccc]", children: "How can I help with your SQL?" }), _jsx("p", { className: "text-[10px] text-[#858585] mt-1", children: "I can explain logic, suggest optimizations, or generate dbt models." })] }), _jsx("div", { className: "w-full grid grid-cols-1 gap-2", children: quickActions.map(action => (_jsxs("button", { onClick: () => handleSend(action.prompt), className: "w-full p-2 bg-[#2a2d2e] border border-[#333333] hover:border-[#007acc] rounded text-[10px] text-left text-[#cccccc] transition-colors flex items-center group", children: [_jsx(Quote, { size: 10, className: "mr-2 text-[#858585] group-hover:text-blue-400" }), action.label] }, action.label))) })] })), messages.map((msg, i) => (_jsx("div", { className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
                                ? 'bg-[#007acc] text-white'
                                : 'bg-[#1e1e1e] border border-[#333333] text-[#cccccc]'}`, children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1 opacity-50 text-[9px]", children: [msg.role === 'user' ? _jsx(User, { size: 10 }) : _jsx(Sparkles, { size: 10 }), _jsx("span", { children: msg.role === 'user' ? 'You' : 'Gemini' })] }), _jsx("div", { className: "whitespace-pre-wrap font-sans", children: msg.text })] }) }, i))), isTyping && messages[messages.length - 1]?.role === 'user' && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-[#1e1e1e] border border-[#333333] rounded-lg px-3 py-2", children: _jsx(Loader2, { size: 14, className: "animate-spin text-blue-400" }) }) }))] }), _jsxs("div", { className: "p-4 bg-[#2d2d2d] border-t border-[#333333]", children: [_jsxs("div", { className: "relative", children: [_jsx("textarea", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }, placeholder: "Ask a question about this SQL...", className: "w-full bg-[#3c3c3c] text-xs py-2 pl-3 pr-10 rounded border border-transparent focus:border-[#007acc] outline-none resize-none h-20" }), _jsx("button", { onClick: () => handleSend(), disabled: !input.trim() || isTyping, className: "absolute right-2 bottom-2 p-1.5 bg-[#007acc] hover:bg-[#118ad4] disabled:opacity-50 text-white rounded transition-colors", children: _jsx(Send, { size: 14 }) })] }), _jsx("p", { className: "text-[9px] text-[#858585] mt-2 text-center", children: "Gemini 3 Flash provides real-time insights on your active workspace." })] })] }));
};
export default ChatPanel;
