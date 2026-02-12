import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Database, MessageSquare, Bot, Key } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../contexts/AppContext';
import hayatLogo from '../assets/hayat-logo-zeminli.png';

const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
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
    const { logout } = useAppContext();

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
                    <div className="px-3 pb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">İş Akışları</span>
                    </div>
                    <NavItem to="/" icon={LayoutDashboard} label="Excel'den KB'ye" />
                    <NavItem to="/excel-db" icon={Database} label="Excel'den DB'ye" />

                    <div className="px-3 pb-2 pt-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">İletişim</span>
                    </div>
                    <NavItem to="/patent-chat" icon={MessageSquare} label="Patent Sohbeti" />
                    <NavItem to="/excel-chat" icon={MessageSquare} label="Excel-Analitik Sohbet" />
                    <NavItem to="/agent-chat" icon={Bot} label="Ajan Bazlı Sohbet" />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-2 w-full text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Key size={16} />
                        <span>API Anahtarını Sıfırla</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
                    <h2 className="text-sm font-medium text-slate-500">Gösterge Paneli</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Çevrimiçi
                        </div>
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
