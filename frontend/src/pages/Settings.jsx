import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as FiSettings, Save as FiSave, Zap as FiZap, Check as FiCheck, AlertTriangle as FiAlertTriangle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useToast } from '../components/Toast';

const API_BASE = "";

export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetch(`${API_BASE}/api/settings`)
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to load settings", "error");
            });
    }, []);

    const handleUpdate = async (provider, configUpdates = null) => {
        setSaving(true);
        try {
            const resp = await fetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: provider,
                    config: configUpdates
                })
            });
            const data = await resp.json();
            if (data.status === 'success') {
                showToast(`Switched to ${provider.toUpperCase()}`, "success");
                setSettings(prev => ({ ...prev, provider }));
            }
        } catch (err) {
            showToast("Update failed", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-2">
                    <FiSettings className="text-sky-400 text-2xl" />
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
                </div>
                <p className="text-slate-400">Configure your AI providers and API keys for the OpenGrant engine.</p>
            </motion.div>

            <div className="grid gap-6">
                {Object.entries(settings.providers).map(([id, config]) => (
                    <GlassCard key={id} className={`p-6 border-l-4 ${settings.provider === id ? 'border-sky-400 bg-sky-400/5' : 'border-transparent'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">{id}</h3>
                                    {settings.provider === id && (
                                        <span className="bg-sky-400/20 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mb-4">{config.model}</p>

                                <div className="relative max-w-md">
                                    <input
                                        type="password"
                                        placeholder="Enter API Key"
                                        defaultValue={config.api_key}
                                        onBlur={(e) => handleUpdate(id, { api_key: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:border-sky-400 outline-none transition-all"
                                    />
                                    <div className="absolute right-3 top-2.5 text-slate-600">
                                        <FiZap size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleUpdate(id)}
                                    disabled={settings.provider === id || saving}
                                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${settings.provider === id
                                        ? 'bg-sky-400 text-black cursor-default'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {settings.provider === id ? 'SELECTED' : 'SELECT PROVIDER'}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 p-6 rounded-2xl bg-amber-400/5 border border-amber-400/10"
            >
                <div className="flex gap-4">
                    <FiAlertTriangle className="text-amber-400 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-400 mb-1">Local LLM Info</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            To use **Ollama**, ensure the Ollama server is running on `localhost:11434`.
                            This allows you to run OpenGrant 100% privately without any external API keys or rate limits.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
