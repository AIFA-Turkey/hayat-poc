import clsx from 'clsx';
import { motion } from 'framer-motion';

export const Card = ({ children, title, subtitle, className, action, bodyClassName, onHeaderClick }) => {
    const HeaderTag = onHeaderClick ? 'button' : 'div';
    const headerClasses = clsx(
        'px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50',
        onHeaderClick && 'w-full text-left'
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={clsx('bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden', className)}
        >
            {title && (
                <HeaderTag className={headerClasses} onClick={onHeaderClick} type={onHeaderClick ? 'button' : undefined}>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </HeaderTag>
            )}
            <div className={clsx('p-6', bodyClassName)}>
                {children}
            </div>
        </motion.div>
    );
};
