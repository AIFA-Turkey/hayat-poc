import { useState, useMemo } from 'react';
import { MessageSquare, Database, Sparkles, Terminal, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { ChatBubble, ChatInput } from '../components/Chat';
import { runFlow, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

/**
 * T2D Specific Message Renderer
 * Parses [REPHRASED], [SQL], [RESULT] sections
 */
const T2DMessage = ({ text, isBot }) => {
    const [isRephrasedExpanded, setIsRephrasedExpanded] = useState(false);
    const [isSqlExpanded, setIsSqlExpanded] = useState(false);
    const parsed = useMemo(() => {
        if (!isBot) return null;

        const sections = {};
        const rephrasedMatch = text.match(/\[REPHRASED\]:\s*(.*?)(?=\s*\[SQL\]|\s*\[RESULT\]|$)/s);
        const sqlMatch = text.match(/\[SQL\]:\s*(.*?)(?=\s*\[REPHRASED\]|\s*\[RESULT\]|$)/s);
        const resultMatch = text.match(/\[RESULT\]:\s*(.*?)(?=\s*\[REPHRASED\]|\s*\[SQL\]|$)/s);

        if (rephrasedMatch) sections.rephrased = rephrasedMatch[1].trim();
        if (sqlMatch) sections.sql = sqlMatch[1].trim();
        if (resultMatch) sections.result = resultMatch[1].trim();

        // If at least result or sql is found, we treat it as structured
        if (sections.result || sections.sql || sections.rephrased) {
            return sections;
        }
        return null;
    }, [text, isBot]);

    if (!parsed) {
        return <ChatBubble message={text} isBot={isBot} />;
    }

    return (
        <ChatBubble isBot={isBot} message={
            <div className="space-y-4">
                {parsed.rephrased && (
                    <div className="bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <button
                            onClick={() => setIsRephrasedExpanded(prev => !prev)}
                            className="w-full flex items-center gap-2 p-3 text-left cursor-pointer hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                            {isRephrasedExpanded ? <ChevronDown size={14} className="text-indigo-500 shrink-0" /> : <ChevronRight size={14} className="text-indigo-500 shrink-0" />}
                            <Info size={14} className="text-indigo-600 shrink-0" />
                            <span className="text-[10px] uppercase font-bold text-indigo-500">Yeniden İfade Edilen Soru</span>
                        </button>
                        {isRephrasedExpanded && (
                            <div className="px-3 pb-3 pl-10 text-slate-700 italic">{parsed.rephrased}</div>
                        )}
                    </div>
                )}

                {parsed.sql && (
                    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                        <button
                            onClick={() => setIsSqlExpanded(prev => !prev)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-800 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                            {isSqlExpanded ? <ChevronDown size={12} className="text-emerald-400 shrink-0" /> : <ChevronRight size={12} className="text-emerald-400 shrink-0" />}
                            <Terminal size={12} className="text-emerald-400" />
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Oluşturulan SQL</span>
                        </button>
                        {isSqlExpanded && (
                            <pre className="p-3 text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                                {parsed.sql}
                            </pre>
                        )}
                    </div>
                )}

                {parsed.result && (
                    <div className="text-slate-800 whitespace-pre-wrap">
                        {parsed.result}
                    </div>
                )}
            </div>
        } />
    );
};

export const T2DChat = () => {
    const { token, apiKey, t2dChatConfig } = useAppContext();
    const [messages, setMessages] = useState([{ text: 'Merhaba! Patent Veritabanınızı sorgulamanıza yardımcı olabilirim. Ne öğrenmek istersiniz?', isBot: true }]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        // Basic validation for required IDs
        if (!t2dChatConfig.db_vendor_account_id || !t2dChatConfig.lmapiid) {
            setMessages(prev => [...prev, {
                text: 'Hata: Lütfen önce Yapılandırma Ayarları  sayfasında Vendor Account ID ve LM API ID değerlerini yapılandırın.',
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
                "CerebroT2DChatComponent-10UsX": {
                    "db_vendor_account_id": t2dChatConfig.db_vendor_account_id,
                    "lmapiid": t2dChatConfig.lmapiid
                }
            }
        };

        try {
            const response = await runFlow(FLOW_IDS.T2D_CHAT, payload, token, apiKey);

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
        <div className="flex h-full">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600 border border-cyan-100">
                        <MessageSquare size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">T2D Sohbeti</h1>
                        <p className="text-slate-500">Metinden Veritabanına Sorgu Arayüzü</p>
                    </div>
                </div>

                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, idx) => (
                            <T2DMessage key={idx} text={msg.text} isBot={msg.isBot} />
                        ))}
                        {loading && (
                            <div className="flex gap-4 mr-auto">
                                <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                                    <Database size={16} className="animate-pulse" />
                                </div>
                                <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-100 text-slate-500 text-sm">
                                    Veritabanı sorgulanıyor...
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
