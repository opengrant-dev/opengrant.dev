import React from 'react';
import { motion } from 'framer-motion';

/**
 * GlassCard - A premium frosted glass container component.
 * Used for sections and cards throughout the OpenGrant dashboard.
 */
const GlassCard = ({ children, className = "", initial = { opacity: 0, y: 10 }, animate = { opacity: 1, y: 0 }, ...props }) => {
    return (
        <motion.div
            initial={initial}
            animate={animate}
            className={`glass-card overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
