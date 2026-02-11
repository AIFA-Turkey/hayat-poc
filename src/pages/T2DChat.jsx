import { useState, useMemo } from 'react';
import { MessageSquare, Database, Sparkles, Code, Terminal, Info } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { ChatBubble, ChatInput } from '../components/Chat';
import { runFlow, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

/**
 * T2D Specific Message Renderer
 * Parses [REPHRASED], [SQL], [RESULT] sections
 */
const T2DMessage = ({ text, isBot }) => {
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
                    <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex gap-3">
                        <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[10px] uppercase font-bold text-indigo-500 mb-1">Rephrased Question</div>
                            <div className="text-slate-700 italic">{parsed.rephrased}</div>
                        </div>
                    </div>
                )}

                {parsed.sql && (
                    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border-b border-slate-700">
                            <Terminal size={12} className="text-emerald-400" />
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Generated SQL</span>
                        </div>
                        <pre className="p-3 text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                            {parsed.sql}
                        </pre>
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
    const { token, apiKey } = useAppContext();
    const [messages, setMessages] = useState([{ text: 'Hello! I can help you query your database. What would you like to know?', isBot: true }]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const [config, setConfig] = useState({
        db_vendor_account_id: '',
        lmapiid: ''
    });

    const handleConfigChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        // Basic validation for required IDs
        if (!config.db_vendor_account_id || !config.lmapiid) {
            setMessages(prev => [...prev, {
                text: 'Error: Please configure Vendor Account ID and LMap IID in the Settings sidebar first.',
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
                    "db_vendor_account_id": config.db_vendor_account_id,
                    "lmapiid": config.lmapiid
                }
            }
        };

        try {
            const response = await runFlow(FLOW_IDS.T2D_CHAT, payload, token, apiKey);

            let botText = "Received response from server.";
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
            setMessages(prev => [...prev, { text: `Error: ${err.message}`, isBot: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full gap-6">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600 border border-cyan-100">
                        <MessageSquare size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">T2D Chat</h1>
                        <p className="text-slate-500">Text-to-Database Query Interface</p>
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
                                    Querying database...
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
                <Card title="Settings" className="h-full">
                    <div className="space-y-4">
                        <Input label="Vendor Account ID" name="db_vendor_account_id" value={config.db_vendor_account_id} onChange={handleConfigChange} />
                        <Input label="LMap IID" name="lmapiid" value={config.lmapiid} onChange={handleConfigChange} />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-cyan-50 border border-cyan-100">
                        <h4 className="text-cyan-700 text-xs font-bold uppercase mb-2">DB Context</h4>
                        <p className="text-cyan-600/80 text-xs leading-relaxed">
                            Ensure the Vendor Account ID matches your database registration to execute valid queries.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
