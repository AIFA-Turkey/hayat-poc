import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Play, Loader2, FileJson } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { runFlow, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

export const ExcelToKB = () => {
    const { token, apiKey } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title_column: 'Başlık',
        url_column: 'URL',
        doc_intel_api_key: '',
        doc_intel_endpoint: '',
        blob_name: '',
        blob_connection_string: '',
        kb_name: '',
        kb_workspace_id: '',
        fetcher_workspace_id: '',
        download_blob_url: '',
        download_connection_string: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.download_blob_url || !formData.doc_intel_api_key || !formData.kb_workspace_id) {
            setError("Lütfen çalıştırmadan önce gerekli alanları doldurun (Blob URL, Doc Intel API Key ve Workspace ID).");
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
                "PatentDataPrepComponent-LIu3z": {
                    "title_column": formData.title_column,
                    "url_column": formData.url_column
                },
                "AzureDocIntel-pdrEa": {
                    "api_key": formData.doc_intel_api_key,
                    "endpoint": formData.doc_intel_endpoint
                },
                "AzureBlobUploadComponent-QHW8r": {
                    "blob_name": formData.blob_name,
                    "connection_string": formData.blob_connection_string
                },
                "CerebroKBBuilderComponent-fV4VM": {
                    "knowledgebase_name": formData.kb_name,
                    "workspace_id": formData.kb_workspace_id
                },
                "CerebroComponentFetcherComponent-i1UfK": {
                    "workspace_id": formData.fetcher_workspace_id
                },
                "AzureBlobDownloadComponent-x5HdI": {
                    "blob_url": formData.download_blob_url,
                    "connection_string": formData.download_connection_string
                }
            }
        };

        try {
            const response = await runFlow(FLOW_IDS.EXCEL_2_KB, payload, token, apiKey);
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
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                    <Upload size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Excel'den KB'ye</h1>
                    <p className="text-slate-500">Excel dosyalarını işleyip Patent GPT Bilgi Bankası oluşturun</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card title="Yapılandırma" className="h-fit">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Azure Blob İndirme</h4>
                            <Input label="Blob URL" name="download_blob_url" value={formData.download_blob_url} onChange={handleChange} placeholder="https://..." />
                            <Input label="Bağlantı Dizesi" name="download_connection_string" value={formData.download_connection_string} onChange={handleChange} type="password" />
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Veri Hazırlama</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Başlık Sütunu" name="title_column" value={formData.title_column} onChange={handleChange} />
                                <Input label="URL Sütunu" name="url_column" value={formData.url_column} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Azure Doküman Zekası</h4>
                            <Input label="API Anahtarı" name="doc_intel_api_key" value={formData.doc_intel_api_key} onChange={handleChange} type="password" />
                            <Input label="Uç Nokta" name="doc_intel_endpoint" value={formData.doc_intel_endpoint} onChange={handleChange} />
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">KB Oluşturucu</h4>
                            <Input label="KB Adı" name="kb_name" value={formData.kb_name} onChange={handleChange} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Workspace ID" name="kb_workspace_id" value={formData.kb_workspace_id} onChange={handleChange} />
                                <Input label="Fetcher Workspace ID" name="fetcher_workspace_id" value={formData.fetcher_workspace_id} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Azure Blob Yükleme</h4>
                            <Input label="Blob Adı" name="blob_name" value={formData.blob_name} onChange={handleChange} />
                            <Input label="Bağlantı Dizesi" name="blob_connection_string" value={formData.blob_connection_string} onChange={handleChange} type="password" />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full py-3 text-base shadow-md" disabled={loading}>
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
                            <div className="h-64 flex flex-col items-center justify-center text-indigo-600">
                                <Loader2 size={48} className="animate-spin mb-4" />
                                <p className="text-slate-600 font-medium">Cerebro yanıtı bekleniyor...</p>
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
