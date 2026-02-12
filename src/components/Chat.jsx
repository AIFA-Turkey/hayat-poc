import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';

export const ChatBubble = ({ message, isBot }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={clsx(
                'flex gap-4 max-w-[85%]',
                isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
            )}
        >
            <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm',
                isBot ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-600'
            )}>
                {isBot ? <Bot size={18} /> : <User size={18} />}
            </div>

            <div className={clsx(
                'p-4 rounded-2xl text-sm leading-relaxed shadow-sm',
                isBot
                    ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                    : 'bg-indigo-600 text-white rounded-tr-none'
            )}>
                {message}
            </div>
        </motion.div>
    );
};

export const ChatInput = ({ value, onChange, onSend, disabled }) => {
    const textareaRef = useRef(null);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [value]);

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder="Bir mesaj yazın..."
                rows={1}
                className="w-full pr-12 pl-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900 placeholder-slate-400 resize-none overflow-hidden shadow-sm"
            />
            <button
                onClick={onSend}
                disabled={!value.trim() || disabled}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <Send size={16} />
            </button>
        </div>
    );
};
