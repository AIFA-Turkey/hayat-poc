import { useState } from 'react';
import { MessageSquare, Settings, Sparkles } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { ChatBubble, ChatInput } from '../components/Chat';
import { runFlow, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

export const KBChat = () => {
    const { token, apiKey } = useAppContext();
    const [messages, setMessages] = useState([{ text: 'Merhaba! Bugün Patent araştırmalarınızda nasıl yardımcı olabilirim?', isBot: true }]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const [config, setConfig] = useState({
        knowledgebase_id: '',
        lmapiid: '',
        workspaceid: ''
    });

    const handleConfigChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        // Basic validation for required IDs
        if (!config.knowledgebase_id || !config.lmapiid || !config.workspaceid) {
            setMessages(prev => [...prev, {
                text: 'Hata: Lütfen önce Ayarlar yan panelinde Knowledge Base ID, LMap IID ve Workspace ID değerlerini yapılandırın.',
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
            sessionid: "user_1",
            tweaks: {
                "CerebroKBChatComponent-uMCSg": {
                    "knowledgebase_id": config.knowledgebase_id,
                    "lmapiid": config.lmapiid,
                    "workspaceid": config.workspaceid
                }
            }
        };

        try {
            const response = await runFlow(FLOW_IDS.KB_CHAT, payload, token, apiKey);

            let botText = "Sunucudan yanıt alındı.";
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
            setMessages(prev => [...prev, { text: `Hata: ${err.message}`, isBot: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full gap-6">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                        <MessageSquare size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Patent Sohbeti</h1>
                        <p className="text-slate-500">Patent Bilgi Bankanızla sohbet edin</p>
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
                                    Düşünüyor...
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
                <Card title="Ayarlar" className="h-full">
                    <div className="space-y-4">
                        <Input label="Knowledge Base ID" name="knowledgebase_id" value={config.knowledgebase_id} onChange={handleConfigChange} />
                        <Input label="LMap IID" name="lmapiid" value={config.lmapiid} onChange={handleConfigChange} />
                        <Input label="Workspace ID" name="workspaceid" value={config.workspaceid} onChange={handleConfigChange} />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                        <h4 className="text-indigo-700 text-xs font-bold uppercase mb-2">Bağlam Bilgisi</h4>
                        <p className="text-indigo-600/80 text-xs leading-relaxed">
                            Belirli bilgi bankası bağlamına bağlanmak için ID'leri yapılandırın. Bu, sohbetin doğru veri kaynağını kullanmasını sağlar.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
