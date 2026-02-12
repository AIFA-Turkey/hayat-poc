import { Settings, MessageSquare, Database, Bot, Cloud, FileSearch } from 'lucide-react';
import { Card } from '../components/Card';
import { Input, TextArea } from '../components/Input';
import { useAppContext } from '../contexts/AppContext';

export const SettingsPage = () => {
    const {
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

    const handleChange = (setter) => (event) => {
        const { name, value } = event.target;
        setter((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Yapılandırma Ayarları</h1>
                    <p className="text-slate-500">Sohbet deneyimlerini tek noktadan yönetin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card
                    title="Patent Sohbeti Ayarları"
                    action={<MessageSquare size={18} className="text-indigo-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Input
                            label="Knowledge Base ID"
                            name="knowledgebase_id"
                            value={kbChatConfig.knowledgebase_id}
                            onChange={handleChange(setKbChatConfig)}
                        />
                        <Input
                            label="LM API ID"
                            name="lmapiid"
                            value={kbChatConfig.lmapiid}
                            onChange={handleChange(setKbChatConfig)}
                        />
                        <Input
                            label="Workspace ID"
                            name="workspaceid"
                            value={kbChatConfig.workspaceid}
                            onChange={handleChange(setKbChatConfig)}
                            className="mb-0"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                        <h4 className="text-indigo-700 text-xs font-bold uppercase mb-2">Bağlam Bilgisi</h4>
                        <p className="text-indigo-600/80 text-xs leading-relaxed">
                            Belirli bilgi bankası bağlamına bağlanmak için ID'leri yapılandırın. Bu, sohbetin doğru veri kaynağını kullanmasını sağlar.
                        </p>
                    </div>
                </Card>

                <Card
                    title="Excel-Analitik Sohbet Ayarları"
                    action={<Database size={18} className="text-cyan-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Input
                            label="Vendor Account ID"
                            name="db_vendor_account_id"
                            value={t2dChatConfig.db_vendor_account_id}
                            onChange={handleChange(setT2dChatConfig)}
                        />
                        <Input
                            label="LM API ID"
                            name="lmapiid"
                            value={t2dChatConfig.lmapiid}
                            onChange={handleChange(setT2dChatConfig)}
                            className="mb-0"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-cyan-50 border border-cyan-100">
                        <h4 className="text-cyan-700 text-xs font-bold uppercase mb-2">Veritabanı Bağlamı</h4>
                        <p className="text-cyan-600/80 text-xs leading-relaxed">
                            Geçerli sorgular çalıştırmak için Vendor Account ID'nin veritabanı kaydınızla eşleştiğinden emin olun.
                        </p>
                    </div>
                </Card>

                <Card
                    title="Ajan Bazlı Sohbet Ayarları"
                    action={<Bot size={18} className="text-pink-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <TextArea
                            label="Sistem İstemi"
                            name="system_prompt"
                            value={agentChatConfig.system_prompt}
                            onChange={handleChange(setAgentChatConfig)}
                            placeholder="Sen yardımcı bir asistansın..."
                            className="h-64 mb-0"
                            rows={10}
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-pink-50 border border-pink-100">
                        <h4 className="text-pink-700 text-xs font-bold uppercase mb-2">İstem Mühendisliği</h4>
                        <p className="text-pink-600/80 text-xs leading-relaxed">
                            Ajanın kişiliğini ve davranış kısıtlarını burada tanımlayın. Bu istem, her mesajın bağlamına eklenir.
                        </p>
                    </div>
                </Card>

                <Card
                    title="Blob Storage Ayarları"
                    action={<Cloud size={18} className="text-emerald-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Input
                            label="Bağlantı Dizesi"
                            name="connection_string"
                            value={blobStorageConfig.connection_string}
                            onChange={handleChange(setBlobStorageConfig)}
                            type="password"
                        />
                        <Input
                            label="Container İsmi"
                            name="container_name"
                            value={blobStorageConfig.container_name}
                            onChange={handleChange(setBlobStorageConfig)}
                            placeholder="ornek-container"
                            className="mb-0"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                        <h4 className="text-emerald-700 text-xs font-bold uppercase mb-2">Blob Depolama</h4>
                        <p className="text-emerald-600/80 text-xs leading-relaxed">
                            Excel yükleme ve indirme adımlarında kullanılacak bağlantı dizesi ve container bilgisini burada saklayın.
                        </p>
                    </div>
                </Card>

                <Card
                    title="Azure Document Intelligence Ayarları"
                    action={<FileSearch size={18} className="text-indigo-500" />}
                    className="h-full"
                >
                    <div className="space-y-4">
                        <Input
                            label="Endpoint"
                            name="endpoint"
                            value={docIntelConfig.endpoint}
                            onChange={handleChange(setDocIntelConfig)}
                            placeholder="https://..."
                            className="mb-0"
                        />
                        <Input
                            label="API Anahtarı"
                            name="api_key"
                            value={docIntelConfig.api_key}
                            onChange={handleChange(setDocIntelConfig)}
                            type="password"
                        />
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                        <h4 className="text-indigo-700 text-xs font-bold uppercase mb-2">Doküman Analizi</h4>
                        <p className="text-indigo-600/80 text-xs leading-relaxed">
                            Excel’den Bilgi Bankasına akışı için gerekli Azure Document Intelligence kimlik bilgilerini burada yönetin.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
