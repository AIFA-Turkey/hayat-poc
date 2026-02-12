import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { MessageSquare, Database, Bot, Sparkles } from 'lucide-react';
import { ChatBubble, ChatInput } from '../components/Chat';
import { runFlow, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

const CHAT_TYPES = [
    {
        id: 'kb',
        title: 'Patent Sohbeti',
        description: 'Patent bilgi bankanızla sohbet edin.',
        icon: MessageSquare,
        tone: 'indigo',
        flowId: FLOW_IDS.KB_CHAT,
        tweakKey: 'CerebroKBChatComponent-uMCSg',
        getConfig: (ctx) => ({
            knowledgebase_id: ctx.kbChatConfig.knowledgebase_id,
            lmapiid: ctx.kbChatConfig.lmapiid,
            workspaceid: ctx.kbChatConfig.workspaceid
        }),
        validate: (ctx) => {
            if (!ctx.kbChatConfig.knowledgebase_id || !ctx.kbChatConfig.lmapiid || !ctx.kbChatConfig.workspaceid) {
                return 'Hata: Lütfen önce Yapılandırma Ayarları  sayfasında Knowledge Base ID, LM API ID ve Workspace ID değerlerini yapılandırın.';
            }
            return null;
        },
        greeting: 'Merhaba! Bugün Patent araştırmalarınızda nasıl yardımcı olabilirim?'
    },
    {
        id: 't2d',
        title: 'Excel-Analitik Sohbet',
        description: 'Veritabanı sorularınızı doğal dille sorun.',
        icon: Database,
        tone: 'cyan',
        flowId: FLOW_IDS.T2D_CHAT,
        tweakKey: 'CerebroT2DChatComponent-10UsX',
        getConfig: (ctx) => ({
            db_vendor_account_id: ctx.t2dChatConfig.db_vendor_account_id,
            lmapiid: ctx.t2dChatConfig.lmapiid
        }),
        validate: (ctx) => {
            if (!ctx.t2dChatConfig.db_vendor_account_id || !ctx.t2dChatConfig.lmapiid) {
                return 'Hata: Lütfen önce Yapılandırma Ayarları  sayfasında Vendor Account ID ve LM API ID değerlerini yapılandırın.';
            }
            return null;
        },
        greeting: 'Merhaba! Patent Veritabanınızı sorgulamanıza yardımcı olabilirim. Ne öğrenmek istersiniz?'
    },
    {
        id: 'agent',
        title: 'Ajan Bazlı Sohbet',
        description: 'Yapay Zeka Ajanınız sorunuza en uygun kaynaktan cevap versin',
        icon: Bot,
        tone: 'pink',
        flowId: FLOW_IDS.AGENT_CHAT,
        tweakKey: 'Agent-enbXU',
        getConfig: (ctx) => ({
            system_prompt: ctx.agentChatConfig.system_prompt
        }),
        validate: () => null,
        greeting: 'Ben Patent Araştırma ajanınızım. Nasıl yardımcı olabilirim?'
    }
];

const buildBotMessage = (response) => {
    if (response?.outputs?.[0]?.outputs?.[0]?.results?.message?.text) {
        return response.outputs[0].outputs[0].results.message.text;
    }
    if (response?.outputs?.[0]?.results?.message?.text) {
        return response.outputs[0].results.message.text;
    }
    if (response?.result) {
        return typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
    }
    return JSON.stringify(response, null, 2);
};

export const Home = () => {
    const appContext = useAppContext();
    const { token, apiKey } = appContext;
    const [selectedType, setSelectedType] = useState('kb');
    const [inputValue, setInputValue] = useState('');
    const [loadingType, setLoadingType] = useState(null);

    const initialMessages = useMemo(() => {
        return CHAT_TYPES.reduce((acc, chat) => {
            acc[chat.id] = [{ text: chat.greeting, isBot: true }];
            return acc;
        }, {});
    }, []);

    const [messagesByType, setMessagesByType] = useState(initialMessages);

    const activeChat = CHAT_TYPES.find((chat) => chat.id === selectedType);
    const activeMessages = messagesByType[selectedType] || [];

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const chat = activeChat;
        if (!chat) return;

        const validationError = chat.validate(appContext);
        if (validationError) {
            setMessagesByType((prev) => ({
                ...prev,
                [chat.id]: [...(prev[chat.id] || []), { text: validationError, isBot: true }]
            }));
            return;
        }

        const messageText = inputValue;
        setInputValue('');
        setMessagesByType((prev) => ({
            ...prev,
            [chat.id]: [...(prev[chat.id] || []), { text: messageText, isBot: false }]
        }));
        setLoadingType(chat.id);

        const payload = {
            input_value: messageText,
            output_type: 'chat',
            input_type: 'chat',
            sessionid: 'user_1',
            tweaks: {
                [chat.tweakKey]: chat.getConfig(appContext)
            }
        };

        try {
            const response = await runFlow(chat.flowId, payload, token, apiKey);
            const botText = buildBotMessage(response);
            setMessagesByType((prev) => ({
                ...prev,
                [chat.id]: [...(prev[chat.id] || []), { text: botText, isBot: true }]
            }));
        } catch (err) {
            setMessagesByType((prev) => ({
                ...prev,
                [chat.id]: [...(prev[chat.id] || []), { text: `Hata: ${err.message}`, isBot: true }]
            }));
        } finally {
            setLoadingType(null);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                    <Sparkles size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Anasayfa</h1>
                    <p className="text-slate-500">Üç sohbet tipinden birini seçin ve hemen başlayın.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CHAT_TYPES.map((chat) => {
                    const isActive = chat.id === selectedType;
                    const Icon = chat.icon;
                    return (
                        <button
                            key={chat.id}
                            type="button"
                            onClick={() => setSelectedType(chat.id)}
                            className={clsx(
                                'text-left p-5 rounded-2xl border transition-all shadow-sm bg-white',
                                isActive
                                    ? 'border-indigo-300 ring-1 ring-indigo-200 shadow-md'
                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                            )}
                        >
                            <div className={clsx(
                                'w-11 h-11 rounded-xl flex items-center justify-center border mb-4',
                                chat.tone === 'indigo' && 'bg-indigo-50 border-indigo-100 text-indigo-600',
                                chat.tone === 'cyan' && 'bg-cyan-50 border-cyan-100 text-cyan-600',
                                chat.tone === 'pink' && 'bg-pink-50 border-pink-100 text-pink-600'
                            )}>
                                <Icon size={20} />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">{chat.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{chat.description}</p>
                        </button>
                    );
                })}
            </div>

            <div
                className={clsx(
                    'bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all flex-1 min-h-0',
                    activeMessages.length > 1 ? 'min-h-[420px]' : 'min-h-[280px]'
                )}
            >
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeMessages.map((msg, idx) => (
                        <ChatBubble key={`${selectedType}-${idx}`} message={msg.text} isBot={msg.isBot} />
                    ))}
                    {loadingType === selectedType && (
                        <div className="flex gap-4 mr-auto">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                <Sparkles size={16} className="animate-spin" />
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-100 text-slate-500 text-sm">
                                Yanıt hazırlanıyor...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                    <ChatInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={handleSend}
                        disabled={loadingType !== null}
                    />
                </div>
            </div>
        </div>
    );
};
