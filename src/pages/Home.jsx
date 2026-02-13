import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { MessageSquare, Database, Bot, Sparkles, Upload, FileJson, Play, Loader2, ChevronDown } from 'lucide-react';
import { ChatBubble, ChatInput } from '../components/Chat';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { uploadToBlob } from '../services/blobUpload';
import { runFlow, startFlowRun, getFlowRunStatus, interpretFlowStatus, FLOW_IDS } from '../services/api';
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

const WORKFLOW_CARDS = [
    {
        id: 'kb',
        title: "Excel'den Bilgi Bankasına",
        description: 'Patent Bilgi Bankası oluşturun.',
        icon: Upload,
        tone: 'emerald'
    },
    {
        id: 'db',
        title: "Excel'den Veritabanına",
        description: 'Patent Veritabanı oluşturun.',
        icon: Database,
        tone: 'cyan'
    }
];

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

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 30 * 60 * 1000;

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

const useFlowRunner = ({ flowId, token, apiKey, buildPayload, validate }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const pollIntervalRef = useRef(null);
    const pollStartedAtRef = useRef(null);
    const pollingInFlightRef = useRef(false);
    const activeHandleRef = useRef(null);

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

    const run = useCallback(async () => {
        const validationError = validate?.();
        if (validationError) {
            setError(validationError);
            return;
        }

        stopPolling();
        setLoading(true);
        setError('');
        setResult(null);
        setStatusMessage('İşlem başlatılıyor...');

        try {
            const payload = buildPayload();
            const startResponse = await startFlowRun(flowId, payload, token, apiKey);
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
    }, [buildPayload, flowId, apiKey, token, stopPolling, validate]);

    return { loading, result, error, statusMessage, run };
};

const ACCENT_TEXT = {
    emerald: 'text-emerald-600',
    cyan: 'text-cyan-600',
    indigo: 'text-indigo-600'
};

const FlowOutput = ({ loading, error, result, statusMessage, accent = 'indigo', idleLabel = 'Çıktı burada görünecek' }) => {
    const accentClass = ACCENT_TEXT[accent] || ACCENT_TEXT.indigo;

    return (
        <>
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4"
                >
                    <div className="font-semibold mb-1">Hata Oluştu</div>
                    {error}
                </motion.div>
            )}

            {!result && !error && !loading && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <FileJson size={48} className="mb-4 opacity-50" />
                    <p>{idleLabel}</p>
                </div>
            )}

            {loading && (
                <div className={clsx('h-64 flex flex-col items-center justify-center', accentClass)}>
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">{statusMessage || 'Yanıt bekleniyor...'}</p>
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
        </>
    );
};

export const Home = () => {
    const appContext = useAppContext();
    const { token, apiKey, blobStorageConfig, docIntelConfig, kbChatConfig } = appContext;
    const [selectedType, setSelectedType] = useState('kb');
    const [inputValue, setInputValue] = useState('');
    const [loadingType, setLoadingType] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [blobName, setBlobName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadedBlobUrl, setUploadedBlobUrl] = useState('');
    const [openFlows, setOpenFlows] = useState({ kb: false, db: false });
    const [openSections, setOpenSections] = useState({ workflows: false, upload: false });
    const [kbForm, setKbForm] = useState({
        title_column: 'Title',
        url_column: 'URL',
        kb_name: ''
    });
    const [dbForm, setDbForm] = useState({
        vendor_db_name: ''
    });

    const initialMessages = useMemo(() => {
        return CHAT_TYPES.reduce((acc, chat) => {
            acc[chat.id] = [{ text: chat.greeting, isBot: true }];
            return acc;
        }, {});
    }, []);

    const [messagesByType, setMessagesByType] = useState(initialMessages);

    const activeChat = CHAT_TYPES.find((chat) => chat.id === selectedType);
    const activeMessages = messagesByType[selectedType] || [];

    const connectionString = blobStorageConfig.connection_string?.trim();
    const containerName = blobStorageConfig.container_name?.trim();
    const docIntelApiKey = docIntelConfig.api_key?.trim();
    const docIntelEndpoint = docIntelConfig.endpoint?.trim();
    const workspaceId = kbChatConfig.workspaceid;
    const hasUploadedFile = Boolean(uploadedBlobUrl);

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
        setBlobName((prev) => prev || file.name);
    };

    const handleBlobNameChange = (event) => {
        const value = event.target.value;
        setBlobName(value);
        if (uploadedBlobUrl) {
            setUploadedBlobUrl('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError('Lütfen önce bir Excel dosyası seçin.');
            return;
        }
        if (!connectionString || !containerName) {
            setUploadError('Blob Storage bağlantı dizesi ve container adını Yapılandırma Ayarları sayfasında tanımlayın.');
            return;
        }

        const resolvedBlobName = blobName?.trim() || selectedFile.name;
        if (!blobName?.trim()) {
            setBlobName(resolvedBlobName);
        }

        setUploading(true);
        setUploadError('');
        setUploadedBlobUrl('');

        try {
            const blobUrl = await uploadToBlob(connectionString, containerName, resolvedBlobName, selectedFile);
            setUploadedBlobUrl(blobUrl);
        } catch (err) {
            const message = err?.message || 'Dosya yüklenemedi. Lütfen bağlantı bilgilerini kontrol edin.';
            setUploadError(message);
        } finally {
            setUploading(false);
        }
    };

    const handleKbChange = (event) => {
        setKbForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const handleDbChange = (event) => {
        setDbForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const toggleFlow = (flowId) => {
        setOpenFlows((prev) => ({ ...prev, [flowId]: !prev[flowId] }));
    };

    const toggleSection = (sectionId) => {
        setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const validateKbFlow = useCallback(() => {
        if (uploading) {
            return 'Dosya yükleme devam ediyor. Lütfen tamamlanmasını bekleyin.';
        }
        if (!hasUploadedFile) {
            return 'Lütfen önce Excel dosyasını yükleyin.';
        }
        if (!connectionString || !docIntelApiKey || !workspaceId) {
            return 'Lütfen Yapılandırma Ayarları sayfasında Blob Storage bağlantı dizesi, Doc Intel API Key ve Workspace ID bilgilerini tamamlayın.';
        }
        return null;
    }, [uploading, hasUploadedFile, connectionString, docIntelApiKey, workspaceId]);

    const validateDbFlow = useCallback(() => {
        if (uploading) {
            return 'Dosya yükleme devam ediyor. Lütfen tamamlanmasını bekleyin.';
        }
        if (!hasUploadedFile) {
            return 'Lütfen önce Excel dosyasını yükleyin.';
        }
        if (!dbForm.vendor_db_name?.trim()) {
            return 'Lütfen Vendor DB Name alanını doldurun.';
        }
        if (!connectionString || !workspaceId) {
            return 'Lütfen Yapılandırma Ayarları sayfasında Blob Storage bağlantı dizesi ve Workspace ID bilgilerini tamamlayın.';
        }
        return null;
    }, [uploading, hasUploadedFile, dbForm.vendor_db_name, connectionString, workspaceId]);

    const buildKbPayload = useCallback(() => {
        const resolvedBlobName = blobName?.trim() || selectedFile?.name || '';
        return {
            input_value: 'hello world!',
            output_type: 'text',
            input_type: 'text',
            sessionid: 'user_1',
            tweaks: {
                'PatentDataPrepComponent-LIu3z': {
                    title_column: kbForm.title_column,
                    url_column: kbForm.url_column
                },
                'AzureDocIntel-pdrEa': {
                    api_key: docIntelApiKey,
                    endpoint: docIntelEndpoint
                },
                'AzureBlobUploadComponent-QHW8r': {
                    blob_name: resolvedBlobName,
                    connection_string: connectionString
                },
                'CerebroKBBuilderComponent-fV4VM': {
                    knowledgebase_name: kbForm.kb_name,
                    workspace_id: workspaceId
                },
                'CerebroComponentFetcherComponent-i1UfK': {
                    workspace_id: workspaceId
                },
                'AzureBlobDownloadComponent-x5HdI': {
                    blob_url: uploadedBlobUrl,
                    connection_string: connectionString
                }
            }
        };
    }, [
        blobName,
        selectedFile,
        kbForm.title_column,
        kbForm.url_column,
        kbForm.kb_name,
        docIntelApiKey,
        docIntelEndpoint,
        connectionString,
        workspaceId,
        uploadedBlobUrl
    ]);

    const buildDbPayload = useCallback(() => ({
        input_value: 'hello world!',
        output_type: 'text',
        input_type: 'text',
        sessionid: 'user_1',
        tweaks: {
            'CerebroConverseRegistrarComponent-tL6ob': {
                vendor_db_name: dbForm.vendor_db_name,
                workspace_id: workspaceId
            },
            'AzureBlobDownloadComponent-HVqgf': {
                blob_url: uploadedBlobUrl,
                connection_string: connectionString
            }
        }
    }), [dbForm.vendor_db_name, workspaceId, uploadedBlobUrl, connectionString]);

    const kbFlow = useFlowRunner({
        flowId: FLOW_IDS.EXCEL_2_KB,
        token,
        apiKey,
        buildPayload: buildKbPayload,
        validate: validateKbFlow
    });

    const dbFlow = useFlowRunner({
        flowId: FLOW_IDS.EXCEL_2_DB,
        token,
        apiKey,
        buildPayload: buildDbPayload,
        validate: validateDbFlow
    });

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
                    <p className="text-slate-500">Kaynak Dosya Yönetiminı veya sohbet tipini seçip hemen başlayın.</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <button
                    type="button"
                    onClick={() => toggleSection('workflows')}
                    className="w-full flex items-center justify-between gap-4 text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                            <Upload size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Kaynak Dosya Yönetimi</h2>
                            <p className="text-sm text-slate-500">Excel dosyanızı tek sefer yükleyin, iki akışı ayrı ayrı çalıştırın.</p>
                        </div>
                    </div>
                    <ChevronDown
                        className={clsx('text-slate-400 transition-transform', openSections.workflows && 'rotate-180')}
                        size={22}
                    />
                </button>

                <div
                    className={clsx(
                        'grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out',
                        openSections.workflows ? 'grid-rows-[1fr] mt-6' : 'grid-rows-[0fr]'
                    )}
                >
                    <div className="overflow-hidden space-y-6">
                        <Card
                            title="Dosya Yükleme"
                            subtitle="Önce Excel dosyanızı aşağıdan yükleyin. Dosya yüklendikten sonra, formu doldurup akışı çalıştırabilirsiniz. Yüklenen dosyanın bağlantı bilgisi otomatik olarak formda kullanılacaktır."
                            className="h-fit"
                            bodyClassName="p-0"
                            onHeaderClick={() => toggleSection('upload')}
                            action={(
                                <span className="text-slate-400 transition-colors">
                                    <ChevronDown
                                        className={clsx('transition-transform', openSections.upload && 'rotate-180')}
                                        size={18}
                                    />
                                </span>
                            )}
                        >
                            <div
                                className={clsx(
                                    'grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out',
                                    openSections.upload ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="p-6 space-y-4">
                                        <Input
                                            label="Excel Dosyası"
                                            type="file"
                                            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                            onChange={handleFileChange}
                                        />
                                        <Input
                                            label="Blob Adı"
                                            name="blob_name"
                                            value={blobName}
                                            onChange={handleBlobNameChange}
                                            placeholder="ornek.xlsx"
                                        />
                                        <Button
                                            type="button"
                                            className="w-full py-2.5 text-sm shadow-sm bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
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
                                            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 break-all">
                                                Yükleme tamamlandı: {uploadedBlobUrl}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {WORKFLOW_CARDS.map((flow) => {
                                const isOpen = openFlows[flow.id];
                                const Icon = flow.icon;
                                return (
                                    <button
                                        key={flow.id}
                                        type="button"
                                        onClick={() => toggleFlow(flow.id)}
                                        className={clsx(
                                            'text-left p-5 rounded-2xl border transition-all shadow-sm bg-white flex items-center justify-between gap-4',
                                            isOpen
                                                ? clsx(
                                                    'shadow-md',
                                                    flow.tone === 'emerald' && 'border-emerald-300 ring-1 ring-emerald-200',
                                                    flow.tone === 'cyan' && 'border-cyan-300 ring-1 ring-cyan-200'
                                                )
                                                : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                'w-11 h-11 rounded-xl flex items-center justify-center border',
                                                flow.tone === 'emerald' && 'bg-emerald-50 border-emerald-100 text-emerald-600',
                                                flow.tone === 'cyan' && 'bg-cyan-50 border-cyan-100 text-cyan-600'
                                            )}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-slate-900">{flow.title}</h3>
                                                <p className="text-sm text-slate-500 mt-1">{flow.description}</p>
                                            </div>
                                        </div>
                                        <ChevronDown className={clsx('text-slate-400 transition-transform', isOpen && 'rotate-180')} size={20} />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-6">
                            <div
                                className={clsx(
                                    'grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out',
                                    openFlows.kb ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="pt-6 border-t border-slate-200">
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                                            <Card title="Bilgi Bankası Yapılandırma" className="h-fit">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Veri Hazırlama</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <Input label="Başlık Sütunu" name="title_column" value={kbForm.title_column} onChange={handleKbChange} />
                                                            <Input label="URL Sütunu" name="url_column" value={kbForm.url_column} onChange={handleKbChange} />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">KB Oluşturucu</h4>
                                                        <Input label="KB Adı" name="kb_name" value={kbForm.kb_name} onChange={handleKbChange} />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        className="w-full py-3 text-base shadow-md bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                                                        onClick={kbFlow.run}
                                                        disabled={kbFlow.loading || uploading}
                                                    >
                                                        {kbFlow.loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                                                        {kbFlow.loading ? 'İşleniyor...' : 'Akışı Çalıştır'}
                                                    </Button>
                                                </div>
                                            </Card>

                                            <Card title="Bilgi Bankası Durum ve Çıktı" className="min-h-[400px]">
                                                <FlowOutput
                                                    loading={kbFlow.loading}
                                                    error={kbFlow.error}
                                                    result={kbFlow.result}
                                                    statusMessage={kbFlow.statusMessage}
                                                    accent="emerald"
                                                />
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={clsx(
                                    'grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out',
                                    openFlows.db ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="pt-6 border-t border-slate-200">
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                                            <Card title="Veritabanı Yapılandırma" className="h-fit">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-3">Kayıt Yapılandırması</h4>
                                                        <Input label="Vendor DB Name" name="vendor_db_name" value={dbForm.vendor_db_name} onChange={handleDbChange} />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        className="w-full py-3 text-base shadow-md bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500"
                                                        onClick={dbFlow.run}
                                                        disabled={dbFlow.loading || uploading}
                                                    >
                                                        {dbFlow.loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                                                        {dbFlow.loading ? 'İşleniyor...' : 'Akışı Çalıştır'}
                                                    </Button>
                                                </div>
                                            </Card>

                                            <Card title="Veritabanı Durum ve Çıktı" className="min-h-[400px]">
                                                <FlowOutput
                                                    loading={dbFlow.loading}
                                                    error={dbFlow.error}
                                                    result={dbFlow.result}
                                                    statusMessage={dbFlow.statusMessage}
                                                    accent="cyan"
                                                />
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                        <MessageSquare size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Sohbetler</h2>
                        <p className="text-sm text-slate-500">Üç sohbet tipinden birini seçin ve hemen başlayın.</p>
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
                        'bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all min-h-0 flex-1',
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
