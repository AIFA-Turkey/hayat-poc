import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export const Select = ({ label, className, error, options = [], value, onChange, placeholder = 'Seçiniz...', ...props }) => {
    return (
        <div className={clsx('flex flex-col gap-1.5 mb-4', className)}>
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <div className="relative">
                <select
                    className={clsx(
                        'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500 appearance-none cursor-pointer',
                        error && 'border-red-300 focus:border-red-500 focus:ring-red-200',
                        !value && 'text-slate-500' // Apply placeholder styling if no value
                    )}
                    value={value || ''}
                    onChange={onChange}
                    {...props}
                >
                    <option value="" disabled className="text-slate-500">
                        {placeholder}
                    </option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="text-slate-900">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                </div>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};
