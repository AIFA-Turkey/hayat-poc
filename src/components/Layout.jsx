import { NavLink, Outlet } from 'react-router-dom';
import { Home, LayoutDashboard, Database, MessageSquare, Bot, Settings, Key } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';
import hayatLogo from '../assets/hayat-logo-zeminli.png';

const NavItem = ({ to, icon: Icon, label, end = false }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )
        }
    >
        {({ isActive }) => (
            <>
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                <span>{label}</span>
            </>
        )}
    </NavLink>
);

export const Layout = () => {
    const { resetApiKey } = useAppContext();
    const { locale, setLocale, t } = useI18n();
    const isTurkish = locale === 'tr';

    const toggleLocale = () => {
        setLocale(isTurkish ? 'en' : 'tr');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <img
                        src={hayatLogo}
                        alt="Hayat logo"
                        className="h-10 w-auto object-contain"
                    />
                    <span className="font-bold text-lg text-slate-900 tracking-tight">Patent POC</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <NavItem to="/" icon={Home} label={t('nav.home')} end />

                    <div className="px-3 pb-2 pt-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('nav.communication')}</span>
                    </div>
                    <NavItem to="/patent-chat" icon={MessageSquare} label={t('nav.patentChat')} />
                    <NavItem to="/excel-chat" icon={Database} label={t('nav.excelChat')} />
                    <NavItem to="/agent-chat" icon={Bot} label={t('nav.agentChat')} />

                    <div className="px-3 pb-2 pt-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('nav.fileManagement')}</span>
                    </div>
                    <NavItem to="/excel-kb" icon={LayoutDashboard} label={t('nav.excelToKb')} />
                    <NavItem to="/excel-db" icon={Database} label={t('nav.excelToDb')} />

                    <div className="px-3 pb-2 pt-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('nav.configuration')}</span>
                    </div>
                    <NavItem to="/settings" icon={Settings} label={t('nav.settings')} />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={resetApiKey}
                        className="flex items-center gap-2 px-3 py-2 w-full text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Key size={16} />
                        <span>{t('nav.resetApiKey')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
                    <h2 className="text-sm font-medium text-slate-500">{t('header.dashboard')}</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {t('header.online')}
                        </div>
                        <button
                            type="button"
                            onClick={toggleLocale}
                            aria-label={t('header.languageSwitch')}
                            className="flex items-center gap-1 p-1 rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            <span className={clsx('px-2 py-0.5 rounded-full', isTurkish ? 'bg-slate-900 text-white' : 'text-slate-500')}>TR</span>
                            <span className={clsx('px-2 py-0.5 rounded-full', !isTurkish ? 'bg-slate-900 text-white' : 'text-slate-500')}>EN</span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-semibold">
                            U1
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
