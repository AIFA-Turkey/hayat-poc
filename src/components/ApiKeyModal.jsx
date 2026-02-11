import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

export const ApiKeyModal = () => {
    const { apiKey, login } = useAppContext();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    if (apiKey) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) {
            setError('API Key is required');
            return;
        }
        login(inputValue.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-indigo-600 px-8 py-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to Cerebro</h2>
                    <p className="text-indigo-100 mt-1">Please enter your API key to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-1">
                                Cerebro API Key
                            </label>
                            <input
                                id="apiKey"
                                type="password"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="sk-..."
                                className={`w-full px-4 py-3 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none`}
                            />
                            {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98]"
                        >
                            Access Dashboard
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-bold">
                            Enterprise AI Solutions
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
