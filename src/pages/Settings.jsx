import { useState, useEffect } from 'react';
import { Settings, MessageSquare, Database, Bot, Cloud, FileSearch, Key } from 'lucide-react';
import { Card } from '../components/Card';
import { Input, TextArea } from '../components/Input';
import { Select } from '../components/Select';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';
import {
    getWorkspaces,
    getKnowledgeBases,
    getKnowledgeBaseLlmApis,
    getDbVendorAccounts,
    getWorkspaceComponents
} from '../services/cerebro';

export const SettingsPage = () => {
    const { t } = useI18n();
    const {
        token,
        userId,
        apiKey,
        updateApiKey,
        kbChatConfig,
        setKbChatConfig,
        t2dChatConfig,
        setT2dChatConfig,
        agentChatConfig,
        setAgentChatConfig,
        blobStorageConfig,
        setBlobStorageConfig,
        docIntelConfig,
        setDocIntelConfig
    } = useAppContext();

    // Data Sources
    const [workspaces, setWorkspaces] = useState([]);
    const [knowledgeBases, setKnowledgeBases] = useState([]);
    const [kbLlmApis, setKbLlmApis] = useState([]);
    const [t2dVendorAccounts, setT2dVendorAccounts] = useState([]);
    const [t2dLlmApis, setT2dLlmApis] = useState([]);

    // Loading States
    const [loadingSettings, setLoadingSettings] = useState({
        workspaces: false,
        kbs: false,
        kbLlms: false,
        t2dVendors: false,
        t2dLlms: false
    });

    const handleChange = (setter) => (event) => {
        const { name, value } = event.target;
        setter((prev) => ({ ...prev, [name]: value }));
    };

    // 1. Fetch Workspaces on Mount
    useEffect(() => {
        if (!userId || !token) return;
        setLoadingSettings(prev => ({ ...prev, workspaces: true }));
        getWorkspaces(userId, token)
            .then(data => {
                if (Array.isArray(data)) {
                    setWorkspaces(data.map(ws => ({ label: ws.name, value: ws.id })));
                }
            })
            .catch(err => console.error("Error fetching workspaces:", err))
            .finally(() => setLoadingSettings(prev => ({ ...prev, workspaces: false })));
    }, [userId, token]);

    // 2. Patent Chat (KB) - Fetch Knowledge Bases when Workspace changes
    useEffect(() => {
        if (!kbChatConfig.workspaceid || !token) {
            return;
        }
        setLoadingSettings(prev => ({ ...prev, kbs: true }));
        getKnowledgeBases(kbChatConfig.workspaceid, token)
            .then(data => {
                if (data?.items) {
                    setKnowledgeBases(data.items.map(kb => ({ label: kb.name, value: kb.id })));
                } else {
                    setKnowledgeBases([]);
                }
            })
            .catch(err => console.error("Error fetching KBs:", err))
            .finally(() => setLoadingSettings(prev => ({ ...prev, kbs: false })));
    }, [kbChatConfig.workspaceid, token]);

    // Cleanup KB on workspace change implicitly
    useEffect(() => {
        if (!kbChatConfig.workspaceid) {
            setKnowledgeBases([]);
        }
    }, [kbChatConfig.workspaceid]);

    // 3. Patent Chat (KB) - Fetch LLM APIs when Knowledge Base changes
    useEffect(() => {
        if (!kbChatConfig.knowledgebase_id || !token) {
            return;
        }
        setLoadingSettings(prev => ({ ...prev, kbLlms: true }));
        getKnowledgeBaseLlmApis(kbChatConfig.knowledgebase_id, token)
            .then(data => {
                if (data?.lmmodeldetails) {
                    setKbLlmApis(data.lmmodeldetails.map(llm => ({ label: llm.lmmodelname, value: llm.lmapiid })));
                } else {
                    setKbLlmApis([]);
                }
            })
            .catch(err => console.error("Error fetching KB LLMs:", err))
            .finally(() => setLoadingSettings(prev => ({ ...prev, kbLlms: false })));
    }, [kbChatConfig.knowledgebase_id, token]);

    // Cleanup KB LLMs
    useEffect(() => {
        if (!kbChatConfig.knowledgebase_id) {
            setKbLlmApis([]);
        }
    }, [kbChatConfig.knowledgebase_id]);

    // 4. T2D Chat - Fetch Vendor Accounts & Workspace Components when Workspace changes
    useEffect(() => {
        if (!t2dChatConfig.workspaceid || !token) {
            return;
        }

        setLoadingSettings(prev => ({ ...prev, t2dVendors: true, t2dLlms: true }));

        Promise.all([
            getDbVendorAccounts(t2dChatConfig.workspaceid, token).catch(err => {
                console.error("Error fetching T2D Vendor Accounts:", err);
                return { items: [] };
            }),
            getWorkspaceComponents(t2dChatConfig.workspaceid, token).catch(err => {
                console.error("Error fetching T2D Components:", err);
                return { chatcompletionmodels: [] };
            })
        ]).then(([vendorData, componentData]) => {
            if (vendorData?.items) {
                setT2dVendorAccounts(vendorData.items.map(va => ({ label: va.name, value: va.id })));
            } else {
                setT2dVendorAccounts([]);
            }

            if (componentData?.chatcompletionmodels) {
                setT2dLlmApis(componentData.chatcompletionmodels.map(llm => ({ label: llm.modelname, value: llm.lmmarkertplaceapiid })));
            } else {
                setT2dLlmApis([]);
            }
        }).finally(() => {
            setLoadingSettings(prev => ({ ...prev, t2dVendors: false, t2dLlms: false }));
        });

    }, [t2dChatConfig.workspaceid, token]);

    // Cleanup T2D
    useEffect(() => {
        if (!t2dChatConfig.workspaceid) {
            setT2dVendorAccounts([]);
            setT2dLlmApis([]);
        }
    }, [t2dChatConfig.workspaceid]);


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
                    <p className="text-slate-500">{t('settings.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card
                    title={t('settings.cards.flowAi.title')}
                    action={<Key size={18} className="text-amber-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Input
                            label={t('settings.labels.flowAiApiKey')}
                            name="flow_ai_api_key"
                            value={apiKey || ''}
                            onChange={(event) => updateApiKey(event.target.value)}
                            type="password"
                            className="mb-0"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-100">
                        <h4 className="text-amber-700 text-xs font-bold uppercase mb-2">{t('settings.cards.flowAi.hintTitle')}</h4>
                        <p className="text-amber-600/80 text-xs leading-relaxed">
                            {t('settings.cards.flowAi.hintText')}
                        </p>
                    </div>
                </Card>

                <Card
                    title={t('settings.cards.kb.title')}
                    action={<MessageSquare size={18} className="text-indigo-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Select
                            label={t('settings.labels.workspaceId')}
                            name="workspaceid"
                            value={kbChatConfig.workspaceid}
                            onChange={handleChange(setKbChatConfig)}
                            options={workspaces}
                            placeholder={loadingSettings.workspaces ? "Yükleniyor..." : "Workspace Seçiniz"}
                            disabled={loadingSettings.workspaces}
                        />
                        <Select
                            label={t('settings.labels.knowledgeBaseId')}
                            name="knowledgebase_id"
                            value={kbChatConfig.knowledgebase_id}
                            onChange={handleChange(setKbChatConfig)}
                            options={knowledgeBases}
                            placeholder={loadingSettings.kbs ? "Yükleniyor..." : "Knowledge Base Seçiniz"}
                            disabled={!kbChatConfig.workspaceid || loadingSettings.kbs}
                        />
                        <Select
                            label={t('settings.labels.lmApiId')}
                            name="lmapiid"
                            value={kbChatConfig.lmapiid}
                            onChange={handleChange(setKbChatConfig)}
                            options={kbLlmApis}
                            placeholder={loadingSettings.kbLlms ? "Yükleniyor..." : "LM API Seçiniz"}
                            disabled={!kbChatConfig.knowledgebase_id || loadingSettings.kbLlms}
                            className="mb-0"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                        <h4 className="text-indigo-700 text-xs font-bold uppercase mb-2">{t('settings.cards.kb.hintTitle')}</h4>
                        <p className="text-indigo-600/80 text-xs leading-relaxed">
                            {t('settings.cards.kb.hintText')}
                        </p>
                    </div>
                </Card>

                <Card
                    title={t('settings.cards.t2d.title')}
                    action={<Database size={18} className="text-cyan-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Select
                            label={t('settings.labels.workspaceId')}
                            name="workspaceid"
                            value={t2dChatConfig.workspaceid || ''}
                            onChange={handleChange(setT2dChatConfig)}
                            options={workspaces}
                            placeholder={loadingSettings.workspaces ? "Yükleniyor..." : "Workspace Seçiniz"}
                            disabled={loadingSettings.workspaces}
                        />
                        <Select
                            label={t('settings.labels.vendorAccountId')}
                            name="db_vendor_account_id"
                            value={t2dChatConfig.db_vendor_account_id || ''}
                            onChange={handleChange(setT2dChatConfig)}
                            options={t2dVendorAccounts}
                            placeholder={loadingSettings.t2dVendors ? "Yükleniyor..." : "Vendor Account Seçiniz"}
                            disabled={!t2dChatConfig.workspaceid || loadingSettings.t2dVendors}
                        />
                        <Select
                            label={t('settings.labels.lmApiId')}
                            name="lmapiid"
                            value={t2dChatConfig.lmapiid || ''}
                            onChange={handleChange(setT2dChatConfig)}
                            options={t2dLlmApis}
                            placeholder={loadingSettings.t2dLlms ? "Yükleniyor..." : "LM API Seçiniz"}
                            disabled={!t2dChatConfig.workspaceid || loadingSettings.t2dLlms}
                            className="mb-0"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-cyan-50 border border-cyan-100">
                        <h4 className="text-cyan-700 text-xs font-bold uppercase mb-2">{t('settings.cards.t2d.hintTitle')}</h4>
                        <p className="text-cyan-600/80 text-xs leading-relaxed">
                            {t('settings.cards.t2d.hintText')}
                        </p>
                    </div>
                </Card>

                <Card
                    title={t('settings.cards.agent.title')}
                    action={<Bot size={18} className="text-pink-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <TextArea
                            label={t('settings.labels.systemPrompt')}
                            name="system_prompt"
                            value={agentChatConfig.system_prompt}
                            onChange={handleChange(setAgentChatConfig)}
                            placeholder={t('settings.placeholders.systemPrompt')}
                            className="h-64 mb-0"
                            rows={10}
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-pink-50 border border-pink-100">
                        <h4 className="text-pink-700 text-xs font-bold uppercase mb-2">{t('settings.cards.agent.hintTitle')}</h4>
                        <p className="text-pink-600/80 text-xs leading-relaxed">
                            {t('settings.cards.agent.hintText')}
                        </p>
                    </div>
                </Card>

                <Card
                    title={t('settings.cards.blob.title')}
                    action={<Cloud size={18} className="text-emerald-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Input
                            label={t('settings.labels.connectionString')}
                            name="connection_string"
                            value={blobStorageConfig.connection_string}
                            onChange={handleChange(setBlobStorageConfig)}
                            type="password"
                        />
                        <Input
                            label={t('settings.labels.containerName')}
                            name="container_name"
                            value={blobStorageConfig.container_name}
                            onChange={handleChange(setBlobStorageConfig)}
                            placeholder={t('settings.placeholders.containerName')}
                            className="mb-0"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                        <h4 className="text-emerald-700 text-xs font-bold uppercase mb-2">{t('settings.cards.blob.hintTitle')}</h4>
                        <p className="text-emerald-600/80 text-xs leading-relaxed">
                            {t('settings.cards.blob.hintText')}
                        </p>
                    </div>
                </Card>

                <Card
                    title={t('settings.cards.docIntel.title')}
                    action={<FileSearch size={18} className="text-indigo-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Input
                            label={t('settings.labels.endpoint')}
                            name="endpoint"
                            value={docIntelConfig.endpoint}
                            onChange={handleChange(setDocIntelConfig)}
                            placeholder={t('settings.placeholders.endpoint')}
                            className="mb-0"
                        />
                        <Input
                            label={t('settings.labels.apiKey')}
                            name="api_key"
                            value={docIntelConfig.api_key}
                            onChange={handleChange(setDocIntelConfig)}
                            type="password"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                        <h4 className="text-indigo-700 text-xs font-bold uppercase mb-2">{t('settings.cards.docIntel.hintTitle')}</h4>
                        <p className="text-indigo-600/80 text-xs leading-relaxed">
                            {t('settings.cards.docIntel.hintText')}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
