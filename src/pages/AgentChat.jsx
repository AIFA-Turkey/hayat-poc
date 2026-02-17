import { useEffect, useState } from 'react';
import { Bot, Terminal, Sparkles } from 'lucide-react';
import { Card } from '../components/Card';
import { TextArea } from '../components/Input';
import { ChatBubble, ChatInput } from '../components/Chat';
import { runFlow, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';

export const AgentChat = () => {
    const { token, apiKey, agentChatConfig, setAgentChatConfig, sessionId } = useAppContext();
    const { t } = useI18n();
    const [messages, setMessages] = useState(() => ([
        { text: t('home.chatTypes.agent.greeting'), isBot: true }
    ]));
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMessages((prev) => {
            if (!prev || prev.length === 0) {
                return [{ text: t('home.chatTypes.agent.greeting'), isBot: true }];
            }
            if (prev.length === 1 && prev[0]?.isBot) {
                const nextText = t('home.chatTypes.agent.greeting');
                if (prev[0].text === nextText) return prev;
                return [{ ...prev[0], text: nextText }];
            }
            return prev;
        });
    }, [t]);

    const [config, setConfig] = useState({
        system_prompt: agentChatConfig.system_prompt || ''
    });

    // Sync local state with global state when component mounts or global state changes
    useEffect(() => {
        setConfig(prev => ({ ...prev, system_prompt: agentChatConfig.system_prompt || '' }));
    }, [agentChatConfig.system_prompt]);

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig({ ...config, [name]: value });
        if (name === 'system_prompt') {
            setAgentChatConfig(prev => ({ ...prev, system_prompt: value }));
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

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
                [import.meta.env.VITE_TWEAK_AGENT_CHAT_ID || "Agent-enbXU"]: {
                    "system_prompt": config.system_prompt
                }
            }
        };

        try {
            const response = await runFlow(FLOW_IDS.AGENT_CHAT, payload, token, apiKey);

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
        <div className="flex h-full gap-6">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-pink-50 rounded-xl text-pink-600 border border-pink-100">
                        <Bot size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('agentChat.title')}</h1>
                        <p className="text-slate-500">{t('agentChat.subtitle')}</p>
                    </div>
                </div>

                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, idx) => (
                            <ChatBubble key={idx} message={msg.text} isBot={msg.isBot} />
                        ))}
                        {loading && (
                            <div className="flex gap-4 mr-auto">
                                <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                                    <Sparkles size={16} className="animate-bounce" />
                                </div>
                                <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-100 text-slate-500 text-sm">
                                    {t('chat.agentWorking')}
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

            <div className="w-80 shrink-0">
                <Card title={t('agentChat.configTitle')} className="h-full">
                    <div className="space-y-4">
                        <TextArea
                            label={t('settings.labels.systemPrompt')}
                            name="system_prompt"
                            value={config.system_prompt}
                            onChange={handleConfigChange}
                            placeholder={t('agentChat.systemPromptPlaceholder')}
                            className="h-64"
                            rows={10}
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-pink-50 border border-pink-100">
                        <h4 className="text-pink-700 text-xs font-bold uppercase mb-2">{t('agentChat.promptHintTitle')}</h4>
                        <p className="text-pink-600/80 text-xs leading-relaxed">
                            {t('agentChat.promptHintText')}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
