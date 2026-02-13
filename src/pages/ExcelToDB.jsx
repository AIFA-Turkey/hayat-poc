import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Database, Play, Loader2, FileJson, Upload } from 'lucide-react';
import { uploadToBlob } from '../services/blobUpload';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { startFlowRun, getFlowRunStatus, interpretFlowStatus, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

const ALLOWED_EXCEL_TYPES = new Set([
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

const hasExcelExtension = (filename = '') => {
    const lower = filename.toLowerCase();
    return lower.endsWith('.xls') || lower.endsWith('.xlsx');
};

const isExcelFile = (file) => {
    if (!file) return false;
    return ALLOWED_EXCEL_TYPES.has(file.type) || hasExcelExtension(file.name);
};

export const ExcelToDB = () => {
    const { token, apiKey, blobStorageConfig, kbChatConfig } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadedBlobUrl, setUploadedBlobUrl] = useState('');
    const pollIntervalRef = useRef(null);
    const pollStartedAtRef = useRef(null);
    const pollingInFlightRef = useRef(false);
    const activeHandleRef = useRef(null);

    const POLL_INTERVAL_MS = 5000;
    const MAX_POLL_DURATION_MS = 30 * 60 * 1000;

    const [formData, setFormData] = useState({
        blob_name: '',
        vendor_db_name: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }
        if (!isExcelFile(file)) {
            setUploadError('Sadece Excel dosyaları yüklenebilir (.xls, .xlsx).');
            setSelectedFile(null);
            event.target.value = '';
            return;
        }
        setUploadError('');
        setUploadedBlobUrl('');
        setSelectedFile(file);
        setFormData((prev) => ({
            ...prev,
            blob_name: prev.blob_name || file.name
        }));
    };

    const handleUpload = async () => {
        const connectionString = blobStorageConfig.connection_string?.trim();
        const containerName = blobStorageConfig.container_name?.trim();

        if (!selectedFile) {
            setUploadError('Lütfen önce bir Excel dosyası seçin.');
            return;
        }
        if (!connectionString || !containerName) {
            setUploadError('Blob Storage bağlantı dizesi ve container adını Yapılandırma Ayarları sayfasında tanımlayın.');
            return;
        }

        const rawBlobName = formData.blob_name?.trim();
        const resolvedBlobName = rawBlobName || selectedFile.name;
        if (!rawBlobName) {
            setFormData((prev) => ({ ...prev, blob_name: resolvedBlobName }));
        }
        const finalBlobName = resolvedBlobName;

        setUploading(true);
        setUploadError('');
        setUploadedBlobUrl('');

        try {
            const blobUrl = await uploadToBlob(connectionString, containerName, finalBlobName, selectedFile);
            setUploadedBlobUrl(blobUrl);
        } catch (err) {
            const message = err?.message || 'Dosya yüklenemedi. Lütfen bağlantı bilgilerini kontrol edin.';
            setUploadError(message);
        } finally {
            setUploading(false);
        }
    };

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        pollingInFlightRef.current = false;
        activeHandleRef.current = null;
        pollStartedAtRef.current = null;
    }, []);

    useEffect(() => () => stopPolling(), [stopPolling]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const connectionString = blobStorageConfig.connection_string?.trim();
        const resolvedBlobUrl = uploadedBlobUrl;
        const hasFileUrl = Boolean(resolvedBlobUrl);

        // Basic validation
        if (!hasFileUrl || !formData.vendor_db_name || !kbChatConfig.workspaceid) {
            setError("Lütfen çalıştırmadan önce Excel dosyasını yükleyin ve Vendor DB Adı girin (Workspace ID Yapılandırma Ayarlarından alınır).");
            return;
        }

        stopPolling();
        setLoading(true);
        setError('');
        setResult(null);
        setStatusMessage('İşlem başlatılıyor...');

        const payload = {
            input_value: "hello world!",
            output_type: "text",
            input_type: "text",
            sessionid: "user_1",
            tweaks: {
                "CerebroConverseRegistrarComponent-tL6ob": {
                    "vendor_db_name": formData.vendor_db_name,
                    "workspace_id": kbChatConfig.workspaceid
                },
                "AzureBlobDownloadComponent-HVqgf": {
                    "blob_url": resolvedBlobUrl,
                    "connection_string": connectionString
                }
            }
        };

        try {
            const startResponse = await startFlowRun(FLOW_IDS.EXCEL_2_DB, payload, token, apiKey);
            const data = startResponse?.data ?? null;
            const handle = startResponse?.handle ?? null;
            const statusInfo = interpretFlowStatus(data || {});

            if (statusInfo.isError) {
                setError(statusInfo.error || 'İşlem başlatılırken hata oluştu.');
                setLoading(false);
                setStatusMessage('');
                return;
            }

            if (statusInfo.isSuccess) {
                setResult(statusInfo.result ?? data);
                setLoading(false);
                setStatusMessage('');
                return;
            }

            if (!handle || (!handle.statusUrl && !handle.taskId && !handle.runId && !handle.jobId)) {
                setError('İşlem başlatıldı ancak durum takibi için bir kimlik alınamadı.');
                setLoading(false);
                setStatusMessage('');
                return;
            }

            activeHandleRef.current = handle;
            pollStartedAtRef.current = Date.now();
            setStatusMessage(statusInfo.status ? `İşleniyor (${statusInfo.status})...` : 'İşleniyor...');

            const poll = async () => {
                if (!activeHandleRef.current || pollingInFlightRef.current) return;
                if (pollStartedAtRef.current && Date.now() - pollStartedAtRef.current > MAX_POLL_DURATION_MS) {
                    setError('İşlem zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.');
                    setLoading(false);
                    stopPolling();
                    return;
                }

                pollingInFlightRef.current = true;
                try {
                    const statusData = await getFlowRunStatus(activeHandleRef.current, token, apiKey);
                    const nextStatus = interpretFlowStatus(statusData || {});

                    if (nextStatus.isError) {
                        setError(nextStatus.error || 'İşlem sırasında hata oluştu.');
                        setLoading(false);
                        stopPolling();
                        return;
                    }

                    if (nextStatus.isSuccess) {
                        setResult(nextStatus.result ?? statusData);
                        setLoading(false);
                        setStatusMessage('');
                        stopPolling();
                        return;
                    }

                    setStatusMessage(nextStatus.status ? `İşleniyor (${nextStatus.status})...` : 'İşleniyor...');
                } catch (err) {
                    setError(err.message || 'Durum kontrolü sırasında hata oluştu.');
                    setLoading(false);
                    stopPolling();
                } finally {
                    pollingInFlightRef.current = false;
                }
            };

            await poll();
            if (!activeHandleRef.current) {
                return;
            }
            pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
        } catch (err) {
            setError(err.message);
            setLoading(false);
            setStatusMessage('');
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <Card title="Dosya Yükleme" className="h-fit">
                    <div className="space-y-4">
                        <Input
                            label="Excel Dosyası"
                            type="file"
                            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            onChange={handleFileChange}
                        />
                        <Input
                            label="Blob Adı"
                            name="blob_name"
                            value={formData.blob_name}
                            onChange={handleChange}
                            placeholder="ornek.xlsx"
                        />
                        <Button
                            type="button"
                            className="w-full py-2.5 text-sm shadow-sm bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500"
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile}
                        >
                            {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={16} />}
                            {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
                        </Button>
                        <p className="text-xs text-slate-500">
                            Bağlantı dizesi ve container adı Yapılandırma Ayarları sayfasından alınır.
                        </p>
                        {uploadError && (
                            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                {uploadError}
                            </div>
                        )}
                        {uploadedBlobUrl && (
                            <div className="text-xs text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-md px-3 py-2 break-all">
                                Yükleme tamamlandı: {uploadedBlobUrl}
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Yapılandırma" className="h-fit">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h4 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-3">Kayıt Yapılandırması</h4>
                            <Input label="Vendor DB Name" name="vendor_db_name" value={formData.vendor_db_name} onChange={handleChange} />
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
                                <p className="text-slate-600 font-medium">{statusMessage || 'Patent GPT yanıtı bekleniyor...'}</p>
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
