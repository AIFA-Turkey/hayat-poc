import { useEffect, useState } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { ChatBubble, ChatInput } from '../components/Chat';
import { runFlow, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';

export const KBChat = () => {
    const { token, apiKey, kbChatConfig, sessionId } = useAppContext();
    const { t } = useI18n();
    const [messages, setMessages] = useState(() => ([
        { text: t('home.chatTypes.kb.greeting'), isBot: true }
    ]));
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMessages((prev) => {
            if (!prev || prev.length === 0) {
                return [{ text: t('home.chatTypes.kb.greeting'), isBot: true }];
            }
            if (prev.length === 1 && prev[0]?.isBot) {
                const nextText = t('home.chatTypes.kb.greeting');
                if (prev[0].text === nextText) return prev;
                return [{ ...prev[0], text: nextText }];
            }
            return prev;
        });
    }, [t]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        // Basic validation for required IDs
        if (!kbChatConfig.knowledgebase_id || !kbChatConfig.lmapiid || !kbChatConfig.workspaceid) {
            setMessages(prev => [...prev, {
                text: t('chat.validation.kb'),
                isBot: true
            }]);
            return;
        }

        const userMessage = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
        setLoading(true);

        const payload = {
            input_value: userMessage,
            output_type: "chat",
            input_type: "chat",
            sessionid: sessionId,
            tweaks: {
                [import.meta.env.VITE_TWEAK_KB_CHAT_ID]: {
                    "knowledgebase_id": kbChatConfig.knowledgebase_id,
                    "lmapiid": kbChatConfig.lmapiid,
                    "workspaceid": kbChatConfig.workspaceid
                }
            }
        };

        try {
            const response = await runFlow(FLOW_IDS.KB_CHAT, payload, token, apiKey);

            let botText = t('chat.serverReply');
            if (response?.outputs?.[0]?.outputs?.[0]?.results?.message?.text) {
                botText = response.outputs[0].outputs[0].results.message.text;
            } else if (response?.outputs?.[0]?.results?.message?.text) {
                botText = response.outputs[0].results.message.text;
            } else if (response?.result) {
                botText = typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
            } else {
                botText = JSON.stringify(response, null, 2);
            }

            setMessages(prev => [...prev, { text: botText, isBot: true }]);
        } catch (err) {
            setMessages(prev => [...prev, { text: t('common.errorPrefix', { message: err.message }), isBot: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                        <MessageSquare size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('kbChat.title')}</h1>
                        <p className="text-slate-500">{t('kbChat.subtitle')}</p>
                    </div>
                </div>

                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, idx) => (
                            <ChatBubble key={idx} message={msg.text} isBot={msg.isBot} />
                        ))}
                        {loading && (
                            <div className="flex gap-4 mr-auto">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Sparkles size={16} className="animate-spin" />
                                </div>
                                <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-100 text-slate-500 text-sm">
                                    {t('chat.thinking')}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <ChatInput
                            value={inputValue}
                            onChange={setInputValue}
                            onSend={handleSend}
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
