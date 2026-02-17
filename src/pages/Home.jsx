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
import { useI18n } from '../contexts/I18nContext';

const buildChatTypes = (t) => ([
    {
        id: 'kb',
        title: t('home.chatTypes.kb.title'),
        description: t('home.chatTypes.kb.description'),
        icon: MessageSquare,
        tone: 'indigo',
        flowId: FLOW_IDS.KB_CHAT,
        tweakKey: import.meta.env.VITE_TWEAK_KB_CHAT_ID || 'CerebroKBChatComponent-uMCSg',
        getConfig: (ctx) => ({
            knowledgebase_id: ctx.kbChatConfig.knowledgebase_id,
            lmapiid: ctx.kbChatConfig.lmapiid,
            workspaceid: ctx.kbChatConfig.workspaceid
        }),
        validate: (ctx) => {
            if (!ctx.kbChatConfig.knowledgebase_id || !ctx.kbChatConfig.lmapiid || !ctx.kbChatConfig.workspaceid) {
                return t('chat.validation.kb');
            }
            return null;
        },
        greeting: t('home.chatTypes.kb.greeting')
    },
    {
        id: 't2d',
        title: t('home.chatTypes.t2d.title'),
        description: t('home.chatTypes.t2d.description'),
        icon: Database,
        tone: 'cyan',
        flowId: FLOW_IDS.T2D_CHAT,
        tweakKey: import.meta.env.VITE_TWEAK_T2D_CHAT_ID || 'CerebroT2DChatComponent-10UsX',
        getConfig: (ctx) => ({
            db_vendor_account_id: ctx.t2dChatConfig.db_vendor_account_id,
            lmapiid: ctx.t2dChatConfig.lmapiid
        }),
        validate: (ctx) => {
            if (!ctx.t2dChatConfig.db_vendor_account_id || !ctx.t2dChatConfig.lmapiid) {
                return t('chat.validation.t2d');
            }
            return null;
        },
        greeting: t('home.chatTypes.t2d.greeting')
    },
    {
        id: 'agent',
        title: t('home.chatTypes.agent.title'),
        description: t('home.chatTypes.agent.description'),
        icon: Bot,
        tone: 'pink',
        flowId: FLOW_IDS.AGENT_CHAT,
        tweakKey: import.meta.env.VITE_TWEAK_AGENT_CHAT_ID || 'Agent-enbXU',
        getConfig: (ctx) => ({
            system_prompt: ctx.agentChatConfig.system_prompt
        }),
        validate: () => null,
        greeting: t('home.chatTypes.agent.greeting')
    }
]);

const buildWorkflowCards = (t) => ([
    {
        id: 'kb',
        title: t('home.workflows.kb.title'),
        description: t('home.workflows.kb.description'),
        icon: Upload,
        tone: 'emerald'
    },
    {
        id: 'db',
        title: t('home.workflows.db.title'),
        description: t('home.workflows.db.description'),
        icon: Database,
        tone: 'cyan'
    }
]);

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
    const { t } = useI18n();
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
        setStatusMessage(t('common.starting'));

        try {
            const payload = buildPayload();
            const startResponse = await startFlowRun(flowId, payload, token, apiKey);
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
    }, [buildPayload, flowId, apiKey, token, stopPolling, validate, t]);

    return { loading, result, error, statusMessage, run };
};

const ACCENT_TEXT = {
    emerald: 'text-emerald-600',
    cyan: 'text-cyan-600',
    indigo: 'text-indigo-600'
};

const FlowOutput = ({ loading, error, result, statusMessage, accent = 'indigo', idleLabel }) => {
    const { t } = useI18n();
    const accentClass = ACCENT_TEXT[accent] || ACCENT_TEXT.indigo;
    const resolvedIdleLabel = idleLabel || t('common.outputPlaceholder');

    return (
        <>
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4"
                >
                    <div className="font-semibold mb-1">{t('common.errorOccurred')}</div>
                    {error}
                </motion.div>
            )}

            {!result && !error && !loading && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <FileJson size={48} className="mb-4 opacity-50" />
                    <p>{resolvedIdleLabel}</p>
                </div>
            )}

            {loading && (
                <div className={clsx('h-64 flex flex-col items-center justify-center', accentClass)}>
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">{statusMessage || t('common.waitingResponse')}</p>
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
        </>
    );
};

export const Home = () => {
    const { t } = useI18n();
    const appContext = useAppContext();
    const { token, apiKey, blobStorageConfig, docIntelConfig, kbChatConfig, sessionId } = appContext;
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

    const chatTypes = useMemo(() => buildChatTypes(t), [t]);
    const workflowCards = useMemo(() => buildWorkflowCards(t), [t]);

    const initialMessages = useMemo(() => {
        return chatTypes.reduce((acc, chat) => {
            acc[chat.id] = [{ text: chat.greeting, isBot: true }];
            return acc;
        }, {});
    }, [chatTypes]);

    const [messagesByType, setMessagesByType] = useState(initialMessages);

    useEffect(() => {
        setMessagesByType((prev) => {
            let hasChanges = false;
            const next = { ...prev };

            chatTypes.forEach((chat) => {
                const existing = prev[chat.id];
                if (!existing || existing.length === 0) {
                    next[chat.id] = [{ text: chat.greeting, isBot: true }];
                    hasChanges = true;
                    return;
                }
                if (existing.length === 1 && existing[0]?.isBot) {
                    if (existing[0].text !== chat.greeting) {
                        next[chat.id] = [{ ...existing[0], text: chat.greeting }];
                        hasChanges = true;
                    }
                }
            });

            return hasChanges ? next : prev;
        });
    }, [chatTypes]);

    const activeChat = chatTypes.find((chat) => chat.id === selectedType);
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
            setUploadError(t('common.uploadExcelOnly'));
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
            setUploadError(t('common.selectExcelFile'));
            return;
        }
        if (!connectionString || !containerName) {
            setUploadError(t('common.blobConfigMissing'));
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
            const message = err?.message || t('common.uploadFailed');
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
            return t('home.errors.uploadInProgress');
        }
        if (!hasUploadedFile) {
            return t('home.errors.uploadMissing');
        }
        if (!connectionString || !docIntelApiKey || !workspaceId) {
            return t('home.errors.kbConfigMissing');
        }
        return null;
    }, [uploading, hasUploadedFile, connectionString, docIntelApiKey, workspaceId, t]);

    const validateDbFlow = useCallback(() => {
        if (uploading) {
            return t('home.errors.uploadInProgress');
        }
        if (!hasUploadedFile) {
            return t('home.errors.uploadMissing');
        }
        if (!dbForm.vendor_db_name?.trim()) {
            return t('home.errors.vendorDbNameMissing');
        }
        if (!connectionString || !workspaceId) {
            return t('home.errors.dbConfigMissing');
        }
        return null;
    }, [uploading, hasUploadedFile, dbForm.vendor_db_name, connectionString, workspaceId, t]);

    const buildKbPayload = useCallback(() => {
        const resolvedBlobName = blobName?.trim() || selectedFile?.name || '';
        return {
            input_value: 'hello world!',
            output_type: 'text',
            input_type: 'text',
            sessionid: sessionId,
            tweaks: {
                [import.meta.env.VITE_TWEAK_EXCEL_2_KB_DATA_PREP_ID || 'PatentDataPrepComponent-LIu3z']: {
                    title_column: kbForm.title_column,
                    url_column: kbForm.url_column
                },
                [import.meta.env.VITE_TWEAK_EXCEL_2_KB_DOC_INTEL_ID || 'AzureDocIntel-pdrEa']: {
                    api_key: docIntelApiKey,
                    endpoint: docIntelEndpoint
                },
                [import.meta.env.VITE_TWEAK_EXCEL_2_KB_BLOB_UPLOAD_ID || 'AzureBlobUploadComponent-QHW8r']: {
                    blob_name: resolvedBlobName,
                    connection_string: connectionString
                },
                [import.meta.env.VITE_TWEAK_EXCEL_2_KB_KB_BUILDER_ID || 'CerebroKBBuilderComponent-fV4VM']: {
                    knowledgebase_name: kbForm.kb_name,
                    workspace_id: workspaceId
                },
                [import.meta.env.VITE_TWEAK_EXCEL_2_KB_FETCHER_ID || 'CerebroComponentFetcherComponent-i1UfK']: {
                    workspace_id: workspaceId
                },
                [import.meta.env.VITE_TWEAK_EXCEL_2_KB_BLOB_DOWNLOAD_ID || 'AzureBlobDownloadComponent-x5HdI']: {
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
        sessionid: sessionId,
        tweaks: {
            [import.meta.env.VITE_TWEAK_EXCEL_2_DB_REGISTRAR_ID || 'CerebroConverseRegistrarComponent-tL6ob']: {
                vendor_db_name: dbForm.vendor_db_name,
                workspace_id: workspaceId
            },
            [import.meta.env.VITE_TWEAK_EXCEL_2_DB_BLOB_DOWNLOAD_ID || 'AzureBlobDownloadComponent-HVqgf']: {
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
            sessionid: sessionId,
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
                [chat.id]: [...(prev[chat.id] || []), { text: t('common.errorPrefix', { message: err.message }), isBot: true }]
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
                    <h1 className="text-2xl font-bold text-slate-900">{t('home.title')}</h1>
                    <p className="text-slate-500">{t('home.subtitle')}</p>
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
                            <h2 className="text-lg font-semibold text-slate-900">{t('home.resourceTitle')}</h2>
                            <p className="text-sm text-slate-500">{t('home.resourceSubtitle')}</p>
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
                            title={t('common.fileUpload')}
                            subtitle={t('home.fileUploadSubtitle')}
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
                                            label={t('common.excelFile')}
                                            type="file"
                                            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                            onChange={handleFileChange}
                                        />
                                        <Input
                                            label={t('common.blobName')}
                                            name="blob_name"
                                            value={blobName}
                                            onChange={handleBlobNameChange}
                                            placeholder={t('common.exampleFileName')}
                                        />
                                        <Button
                                            type="button"
                                            className="w-full py-2.5 text-sm shadow-sm bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
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
                                            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 break-all">
                                                {t('common.uploadCompleted', { url: uploadedBlobUrl })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {workflowCards.map((flow) => {
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
                                            <Card title={t('home.kbConfigTitle')} className="h-fit">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">{t('common.dataPrep')}</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <Input label={t('common.titleColumn')} name="title_column" value={kbForm.title_column} onChange={handleKbChange} />
                                                            <Input label={t('common.urlColumn')} name="url_column" value={kbForm.url_column} onChange={handleKbChange} />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">{t('common.kbBuilder')}</h4>
                                                        <Input label={t('common.kbName')} name="kb_name" value={kbForm.kb_name} onChange={handleKbChange} />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        className="w-full py-3 text-base shadow-md bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                                                        onClick={kbFlow.run}
                                                        disabled={kbFlow.loading || uploading}
                                                    >
                                                        {kbFlow.loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                                                        {kbFlow.loading ? t('common.processing') : t('common.runFlow')}
                                                    </Button>
                                                </div>
                                            </Card>

                                            <Card title={t('home.kbStatusTitle')} className="min-h-[400px]">
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
                                            <Card title={t('home.dbConfigTitle')} className="h-fit">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t('common.registrationConfig')}</h4>
                                                        <Input label={t('common.vendorDbName')} name="vendor_db_name" value={dbForm.vendor_db_name} onChange={handleDbChange} />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        className="w-full py-3 text-base shadow-md bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500"
                                                        onClick={dbFlow.run}
                                                        disabled={dbFlow.loading || uploading}
                                                    >
                                                        {dbFlow.loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                                                        {dbFlow.loading ? t('common.processing') : t('common.runFlow')}
                                                    </Button>
                                                </div>
                                            </Card>

                                            <Card title={t('home.dbStatusTitle')} className="min-h-[400px]">
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
                        <h2 className="text-lg font-semibold text-slate-900">{t('home.chatSectionTitle')}</h2>
                        <p className="text-sm text-slate-500">{t('home.chatSectionSubtitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {chatTypes.map((chat) => {
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
                                    {t('chat.responsePreparing')}
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
