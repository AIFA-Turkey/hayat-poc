import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';
import hayatLogo from '../assets/hayat-logo-zeminli.png';

export const ApiKeyModal = () => {
    const { apiKeyConfirmed, confirmApiKey, login, isAuthenticated } = useAppContext();
    const { t } = useI18n();

    if (apiKeyConfirmed && isAuthenticated) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        confirmApiKey();
        if (!isAuthenticated) {
            login();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-indigo-600 px-8 py-6 flex flex-col items-center text-center">
                    <img
                        src={hayatLogo}
                        alt="Hayat logo"
                        className="h-28 w-auto object-contain mb-1"
                    />
                    <h2 className="text-2xl font-bold text-white tracking-tight">{t('apiKey.welcomeTitle')}</h2>
                    <p className="text-indigo-100 mt-1">{t('apiKey.welcomeSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98]"
                    >
                        {t('apiKey.submit')}
                    </button>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-bold">
                            {t('apiKey.tagline')}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
