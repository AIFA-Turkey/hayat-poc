import clsx from 'clsx';

export const Input = ({ label, className, error, ...props }) => {
    return (
        <div className={clsx('flex flex-col gap-1.5 mb-4', className)}>
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <input
                className={clsx(
                    'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500',
                    error && 'border-red-300 focus:border-red-500 focus:ring-red-200'
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export const TextArea = ({ label, className, error, ...props }) => {
    return (
        <div className={clsx('flex flex-col gap-1.5 mb-4', className)}>
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <textarea
                className={clsx(
                    'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500 min-h-[100px] resize-y',
                    error && 'border-red-300 focus:border-red-500 focus:ring-red-200'
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};
