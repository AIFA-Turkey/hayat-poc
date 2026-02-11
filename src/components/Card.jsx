import clsx from 'clsx';
import { motion } from 'framer-motion';

export const Card = ({ children, title, className, action }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={clsx('bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden', className)}
        >
            {title && (
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </motion.div>
    );
};
