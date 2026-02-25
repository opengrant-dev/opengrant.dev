import React from 'react';
import { motion } from 'framer-motion';

/**
 * DeveloperSeal - A premium animated badge that serves as a 
 * "Developer Signature" for the lead architect.
 */
const DeveloperSeal = () => {
    return (
        <motion.div
            className="fixed bottom-6 right-6 z-50 pointer-events-none select-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 1 }}
        >
            <div className="relative group pointer-events-auto cursor-help" title="Lead Architect: Chiranjib">
                {/* Glowing ring */}
                <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-xl group-hover:bg-sky-500/40 transition-all duration-500" />

                {/* Inner seal */}
                <div className="relative flex items-center gap-3 bg-slate-950/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl overflow-hidden">
                    {/* Animated scanline */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

                    <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">
                            Architect
                        </span>
                        <span className="text-xs font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent tracking-widest uppercase">
                            Chiranjib
                        </span>
                    </div>

                    {/* Status dot */}
                    <div className="flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DeveloperSeal;
