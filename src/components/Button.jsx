import clsx from 'clsx';
import { motion } from 'framer-motion';

export const Button = ({ children, variant = 'primary', className, ...props }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
                'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1',
                variant === 'primary' && 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:ring-indigo-500',
                variant === 'ghost' && 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                variant === 'outline' && 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
                variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500',
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
};
