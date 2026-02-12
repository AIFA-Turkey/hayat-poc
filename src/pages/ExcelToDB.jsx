import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Play, Loader2, FileJson } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { runFlow, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

export const ExcelToDB = () => {
    const { token, apiKey } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        blob_url: '',
        blob_connection_string: '',
        vendor_db_name: '',
        workspace_id: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.blob_url || !formData.vendor_db_name || !formData.workspace_id) {
            setError("Lütfen çalıştırmadan önce gerekli alanları doldurun (Blob URL, Vendor DB Adı ve Workspace ID).");
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        const payload = {
            input_value: "hello world!",
            output_type: "text",
            input_type: "text",
            sessionid: "user_1",
            tweaks: {
                "CerebroConverseRegistrarComponent-tL6ob": {
                    "vendor_db_name": formData.vendor_db_name,
                    "workspace_id": formData.workspace_id
                },
                "AzureBlobDownloadComponent-HVqgf": {
                    "blob_url": formData.blob_url,
                    "connection_string": formData.blob_connection_string
                }
            }
        };

        try {
            const response = await runFlow(FLOW_IDS.EXCEL_2_DB, payload, token, apiKey);
            setResult(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600 border border-cyan-100">
                    <Database size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Excel'den DB'ye</h1>
                    <p className="text-slate-500">Excel dosyalarını işleyip Patent GPT Veritabanına kaydedin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card title="Yapılandırma" className="h-fit">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h4 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-3">Azure Blob İndirme</h4>
                            <Input label="Blob URL" name="blob_url" value={formData.blob_url} onChange={handleChange} placeholder="https://..." />
                            <Input label="Bağlantı Dizesi" name="blob_connection_string" value={formData.blob_connection_string} onChange={handleChange} type="password" />
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-3">Kayıt Yapılandırması</h4>
                            <Input label="Vendor DB Name" name="vendor_db_name" value={formData.vendor_db_name} onChange={handleChange} />
                            <Input label="Workspace ID" name="workspace_id" value={formData.workspace_id} onChange={handleChange} />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full py-3 text-base shadow-md bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                                {loading ? 'İşleniyor...' : 'Akışı Çalıştır'}
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="sticky top-6">
                    <Card title="Durum ve Çıktı" className="min-h-[400px]">
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                                <div className="font-semibold mb-1">Hata Oluştu</div>
                                {error}
                            </motion.div>
                        )}

                        {!result && !error && !loading && (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                <FileJson size={48} className="mb-4 opacity-50" />
                                <p>Çıktı burada görünecek</p>
                            </div>
                        )}

                        {loading && (
                            <div className="h-64 flex flex-col items-center justify-center text-cyan-600">
                                <Loader2 size={48} className="animate-spin mb-4" />
                                <p className="text-slate-600 font-medium">Patent GPT yanıtı bekleniyor...</p>
                            </div>
                        )}

                        {result && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                                    <div className="font-semibold">Akış başarıyla tamamlandı</div>
                                </div>

                                <h4 className="font-medium text-slate-700 text-sm">İşlenmemiş Yanıt:</h4>
                                <div className="relative">
                                    <pre className="p-4 rounded-lg bg-slate-50 border border-slate-200 overflow-x-auto text-xs text-slate-600 font-mono">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            </motion.div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
