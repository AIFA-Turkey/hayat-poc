import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Database, Play, Loader2, FileJson, Upload } from 'lucide-react';
import { uploadToBlob } from '../services/blobUpload';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { startFlowRun, getFlowRunStatus, interpretFlowStatus, FLOW_IDS } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';

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
    const { token, apiKey, blobStorageConfig, kbChatConfig, sessionId } = useAppContext();
    const { t } = useI18n();
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
            setUploadError(t('common.uploadExcelOnly'));
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
            setUploadError(t('common.selectExcelFile'));
            return;
        }
        if (!connectionString || !containerName) {
            setUploadError(t('common.blobConfigMissing'));
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
            const message = err?.message || t('common.uploadFailed');
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
            setError(t('excelToDb.validationError'));
            return;
        }

        stopPolling();
        setLoading(true);
        setError('');
        setResult(null);
        setStatusMessage(t('common.starting'));

        const payload = {
            input_value: "hello world!",
            output_type: "text",
            input_type: "text",
            sessionid: sessionId,
            tweaks: {
                [import.meta.env.VITE_TWEAK_EXCEL_2_DB_REGISTRAR_ID]: {
                    "vendor_db_name": formData.vendor_db_name,
                    "workspace_id": kbChatConfig.workspaceid
                },
                [import.meta.env.VITE_TWEAK_EXCEL_2_DB_BLOB_DOWNLOAD_ID]: {
                    "blob_url": resolvedBlobUrl,
                    "connection_string": connectionString
                },
                [import.meta.env.VITE_TWEAK_EXCEL_2_DB_POSTGRES]: {
                    "table_name": formData.vendor_db_name,
                }
            }
        };

        try {
            const startResponse = await startFlowRun(FLOW_IDS.EXCEL_2_DB, payload, token, apiKey);
            const data = startResponse?.data ?? null;
            const handle = startResponse?.handle ?? null;
            const statusInfo = interpretFlowStatus(data || {});

            if (statusInfo.isError) {
                setError(statusInfo.error || t('common.flowStartError'));
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
                setError(t('common.flowNoHandle'));
                setLoading(false);
                setStatusMessage('');
                return;
            }

            activeHandleRef.current = handle;
            pollStartedAtRef.current = Date.now();
            setStatusMessage(statusInfo.status ? t('common.processingWithStatus', { status: statusInfo.status }) : t('common.processing'));

            const poll = async () => {
                if (!activeHandleRef.current || pollingInFlightRef.current) return;
                if (pollStartedAtRef.current && Date.now() - pollStartedAtRef.current > MAX_POLL_DURATION_MS) {
                    setError(t('common.flowTimeout'));
                    setLoading(false);
                    stopPolling();
                    return;
                }

                pollingInFlightRef.current = true;
                try {
                    const statusData = await getFlowRunStatus(activeHandleRef.current, token, apiKey);
                    const nextStatus = interpretFlowStatus(statusData || {});

                    if (nextStatus.isError) {
                        setError(nextStatus.error || t('common.flowRunError'));
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

                    setStatusMessage(nextStatus.status ? t('common.processingWithStatus', { status: nextStatus.status }) : t('common.processing'));
                } catch (err) {
                    setError(err.message || t('common.flowStatusError'));
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
                    <h1 className="text-2xl font-bold text-slate-900">{t('excelToDb.title')}</h1>
                    <p className="text-slate-500">{t('excelToDb.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <Card title={t('common.fileUpload')} className="h-fit">
                    <div className="space-y-4">
                        <Input
                            label={t('common.excelFile')}
                            type="file"
                            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            onChange={handleFileChange}
                        />
                        <Input
                            label={t('common.blobName')}
                            name="blob_name"
                            value={formData.blob_name}
                            onChange={handleChange}
                            placeholder={t('common.exampleFileName')}
                        />
                        <Button
                            type="button"
                            className="w-full py-2.5 text-sm shadow-sm bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500"
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile}
                        >
                            {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={16} />}
                            {uploading ? t('common.uploading') : t('common.uploadFile')}
                        </Button>
                        <p className="text-xs text-slate-500">
                            {t('common.fileUploadHint')}
                        </p>
                        {uploadError && (
                            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                {uploadError}
                            </div>
                        )}
                        {uploadedBlobUrl && (
                            <div className="text-xs text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-md px-3 py-2 break-all">
                                {t('common.uploadCompleted', { url: uploadedBlobUrl })}
                            </div>
                        )}
                    </div>
                </Card>

                <Card title={t('common.configuration')} className="h-fit">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h4 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t('common.registrationConfig')}</h4>
                            <Input label={t('common.vendorDbName')} name="vendor_db_name" value={formData.vendor_db_name} onChange={handleChange} />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full py-3 text-base shadow-md bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                                {loading ? t('common.processing') : t('common.runFlow')}
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="sticky top-6">
                    <Card title={t('common.statusOutput')} className="min-h-[400px]">
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                                <div className="font-semibold mb-1">{t('common.errorOccurred')}</div>
                                {error}
                            </motion.div>
                        )}

                        {!result && !error && !loading && (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                <FileJson size={48} className="mb-4 opacity-50" />
                                <p>{t('common.outputPlaceholder')}</p>
                            </div>
                        )}

                        {loading && (
                            <div className="h-64 flex flex-col items-center justify-center text-cyan-600">
                                <Loader2 size={48} className="animate-spin mb-4" />
                                <p className="text-slate-600 font-medium">{statusMessage || t('excelToDb.waitingResponse')}</p>
                            </div>
                        )}

                        {result && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                                    <div className="font-semibold">{t('common.flowSuccess')}</div>
                                </div>

                                <h4 className="font-medium text-slate-700 text-sm">{t('common.rawResponse')}</h4>
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
