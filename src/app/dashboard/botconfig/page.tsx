"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    ToggleLeft,
    ToggleRight,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Info,
} from "lucide-react";

interface BotIntent {
    id: string;
    name: string;
    patterns: string[];
    response: string;
    quickReplies: string[];
    priority: number;
    enabled: boolean;
}

interface Toast {
    id: number;
    type: "success" | "error" | "info";
    message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
    return (
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none px-4 sm:px-0">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 80, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 80, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={`pointer-events-auto flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl min-w-0 sm:min-w-[320px] max-w-[calc(100vw-2rem)] sm:max-w-[420px] ${toast.type === "success"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                            : toast.type === "error"
                                ? "bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-300"
                                : "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-300"
                            }`}
                    >
                        {toast.type === "success" ? (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        ) : toast.type === "error" ? (
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <Info className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1 min-w-0 truncate">{toast.message}</span>
                        <button
                            onClick={() => onDismiss(toast.id)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function BotConfigPage() {
    const [intents, setIntents] = useState<BotIntent[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingIntent, setEditingIntent] = useState<BotIntent | null>(null);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastIdRef = useRef(0);

    const getHeaders = () => {
        return { "Content-Type": "application/json" };
    };

    const showToast = useCallback((type: Toast["type"], message: string) => {
        const id = ++toastIdRef.current;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const fetchIntents = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/bot-config`, {
                headers: getHeaders(),
                credentials: "include"
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            if (data.status === "success") {
                setIntents(data.data);
            }
        } catch (err: any) {
            showToast("error", `Failed to load intents: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchIntents();
    }, [fetchIntents]);

    // ── TOGGLE ──
    const handleToggle = async (intent: BotIntent) => {
        const newState = !intent.enabled;
        setIntents((prev) =>
            prev.map((i) => (i.id === intent.id ? { ...i, enabled: newState } : i))
        );
        try {
            const res = await fetch(`${API_URL}/bot-config/${intent.id}`, {
                method: "PUT",
                headers: getHeaders(),
                credentials: "include",
                body: JSON.stringify({ enabled: newState }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `HTTP ${res.status}`);
            }
            showToast("success", `"${intent.name}" ${newState ? "enabled" : "disabled"}`);
        } catch (err: any) {
            setIntents((prev) =>
                prev.map((i) => (i.id === intent.id ? { ...i, enabled: intent.enabled } : i))
            );
            showToast("error", `Toggle failed: ${err.message}`);
        }
    };

    // ── DELETE ──
    const handleDelete = async (intent: BotIntent) => {
        if (!confirm(`Delete "${intent.name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API_URL}/bot-config/${intent.id}`, {
                method: "DELETE",
                headers: getHeaders(),
                credentials: "include",
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `HTTP ${res.status}`);
            }
            setIntents((prev) => prev.filter((i) => i.id !== intent.id));
            showToast("success", `"${intent.name}" deleted successfully`);
        } catch (err: any) {
            showToast("error", `Delete failed: ${err.message}`);
        }
    };

    // ── SAVE ──
    const handleSave = async (formData: Partial<BotIntent>) => {
        setSaving(true);
        try {
            const url = isCreateMode
                ? `${API_URL}/bot-config`
                : `${API_URL}/bot-config/${editingIntent?.id}`;
            const method = isCreateMode ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: getHeaders(),
                credentials: "include",
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to save");
            }

            setEditingIntent(null);
            setIsCreateMode(false);
            await fetchIntents();
            showToast(
                "success",
                isCreateMode
                    ? `"${formData.name}" created successfully!`
                    : `"${formData.name}" updated successfully!`
            );
        } catch (err: any) {
            showToast("error", err.message || "Failed to save intent");
        } finally {
            setSaving(false);
        }
    };

    const openCreate = () => {
        setEditingIntent({
            id: "",
            name: "",
            patterns: [],
            response: "",
            quickReplies: [],
            priority: 50,
            enabled: true,
        });
        setIsCreateMode(true);
    };

    const openEdit = (intent: BotIntent) => {
        setEditingIntent({ ...intent });
        setIsCreateMode(false);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            {/* Header — stacks on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--accent-soft)" }}
                    >
                        <Zap className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                            Bot Configuration
                        </h1>
                        <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                            Manage chatbot responses and triggers
                        </p>
                    </div>
                </div>

                <button
                    onClick={openCreate}
                    className="flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-90 w-full sm:w-auto"
                    style={{ background: "var(--accent)" }}
                >
                    <Plus className="w-4 h-4" />
                    Add Intent
                </button>
            </div>

            {/* ── Desktop Table (hidden on mobile) ── */}
            <div
                className="hidden md:block rounded-2xl overflow-hidden backdrop-blur-sm theme-transition"
                style={{
                    border: "1px solid var(--border-primary)",
                    background: "var(--bg-surface)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div
                        className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider min-w-[800px]"
                        style={{
                            background: "var(--bg-input)",
                            borderBottom: "1px solid var(--border-subtle)",
                            color: "var(--text-muted)",
                        }}
                    >
                        <div className="col-span-2">Intent</div>
                        <div className="col-span-3">Keywords</div>
                        <div className="col-span-3">Response Preview</div>
                        <div className="col-span-2">Quick Replies</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-1 text-center">Actions</div>
                    </div>

                    {/* Table Body */}
                    {loading ? (
                        <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                            <div
                                className="inline-block w-5 h-5 border-2 rounded-full animate-spin mb-2"
                                style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent)" }}
                            />
                            <p>Loading intents...</p>
                        </div>
                    ) : intents.length === 0 ? (
                        <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                            No intents configured. Click &quot;Add Intent&quot; to get started.
                        </div>
                    ) : (
                        intents.map((intent, i) => (
                            <motion.div
                                key={intent.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors min-w-[800px]"
                                style={{
                                    borderBottom: "1px solid var(--border-subtle)",
                                    opacity: intent.enabled ? 1 : 0.5,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "var(--bg-surface-hover)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                }}
                            >
                                {/* Name + Priority */}
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent-text)" }} />
                                        <span className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                            {intent.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] mt-0.5 block" style={{ color: "var(--text-muted)" }}>
                                        Priority: {intent.priority}
                                    </span>
                                </div>

                                {/* Patterns */}
                                <div className="col-span-3">
                                    <div className="flex flex-wrap gap-1">
                                        {intent.patterns.slice(0, 4).map((p, j) => (
                                            <span
                                                key={j}
                                                className="text-[11px] px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: "var(--bg-input)",
                                                    color: "var(--text-secondary)",
                                                    border: "1px solid var(--border-subtle)",
                                                }}
                                            >
                                                {p}
                                            </span>
                                        ))}
                                        {intent.patterns.length > 4 && (
                                            <span className="text-[11px] px-2 py-0.5" style={{ color: "var(--text-muted)" }}>
                                                +{intent.patterns.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Response Preview */}
                                <div className="col-span-3">
                                    <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                        {intent.response.replace(/\*\*/g, "").substring(0, 100)}
                                        {intent.response.length > 100 ? "..." : ""}
                                    </p>
                                </div>

                                {/* Quick Replies */}
                                <div className="col-span-2">
                                    <div className="flex flex-wrap gap-1">
                                        {intent.quickReplies.slice(0, 2).map((qr, j) => (
                                            <span
                                                key={j}
                                                className="text-[10px] px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: "var(--accent-soft)",
                                                    border: "1px solid var(--accent-border)",
                                                    color: "var(--accent-text)",
                                                }}
                                            >
                                                {qr}
                                            </span>
                                        ))}
                                        {intent.quickReplies.length > 2 && (
                                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                                +{intent.quickReplies.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Toggle */}
                                <div className="col-span-1 flex justify-center">
                                    <button onClick={() => handleToggle(intent)} className="transition-colors">
                                        {intent.enabled ? (
                                            <ToggleRight className="w-6 h-6" style={{ color: "var(--success)" }} />
                                        ) : (
                                            <ToggleLeft className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
                                        )}
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex justify-center gap-1">
                                    <button
                                        onClick={() => openEdit(intent)}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: "var(--text-muted)" }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "var(--bg-surface-hover)";
                                            e.currentTarget.style.color = "var(--text-primary)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = "var(--text-muted)";
                                        }}
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(intent)}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: "var(--text-muted)" }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                                            e.currentTarget.style.color = "var(--danger)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = "var(--text-muted)";
                                        }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Mobile Card Layout (hidden on desktop) ── */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div
                            className="w-6 h-6 border-2 rounded-full animate-spin"
                            style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent)" }}
                        />
                    </div>
                ) : intents.length === 0 ? (
                    <div
                        className="rounded-2xl p-8 text-center text-sm"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-muted)" }}
                    >
                        No intents configured. Tap &quot;Add Intent&quot; to get started.
                    </div>
                ) : (
                    intents.map((intent, i) => (
                        <motion.div
                            key={intent.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="rounded-2xl p-4 theme-transition"
                            style={{
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border-primary)",
                                boxShadow: "var(--shadow-card)",
                                opacity: intent.enabled ? 1 : 0.5,
                            }}
                        >
                            {/* Card Header — Name + Actions */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: "var(--accent-soft)" }}>
                                        <MessageSquare className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                            {intent.name}
                                        </h3>
                                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                            Priority: {intent.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    <button onClick={() => handleToggle(intent)} className="p-1.5 transition-colors">
                                        {intent.enabled ? (
                                            <ToggleRight className="w-6 h-6" style={{ color: "var(--success)" }} />
                                        ) : (
                                            <ToggleLeft className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Keywords */}
                            {intent.patterns.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                                        Keywords
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {intent.patterns.slice(0, 5).map((p, j) => (
                                            <span
                                                key={j}
                                                className="text-[11px] px-2.5 py-1 rounded-full"
                                                style={{
                                                    background: "var(--bg-input)",
                                                    color: "var(--text-secondary)",
                                                    border: "1px solid var(--border-subtle)",
                                                }}
                                            >
                                                {p}
                                            </span>
                                        ))}
                                        {intent.patterns.length > 5 && (
                                            <span className="text-[11px] px-2 py-1" style={{ color: "var(--text-muted)" }}>
                                                +{intent.patterns.length - 5}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Response Preview */}
                            <div className="mb-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                                    Response
                                </p>
                                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                    {intent.response.replace(/\*\*/g, "").substring(0, 120)}
                                    {intent.response.length > 120 ? "..." : ""}
                                </p>
                            </div>

                            {/* Quick Replies */}
                            {intent.quickReplies.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                                        Quick Replies
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {intent.quickReplies.map((qr, j) => (
                                            <span
                                                key={j}
                                                className="text-[10px] px-2.5 py-1 rounded-full"
                                                style={{
                                                    background: "var(--accent-soft)",
                                                    border: "1px solid var(--accent-border)",
                                                    color: "var(--accent-text)",
                                                }}
                                            >
                                                {qr}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Card Footer — Edit/Delete */}
                            <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                <button
                                    onClick={() => openEdit(intent)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                                    style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(intent)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Edit / Create Modal */}
            <AnimatePresence>
                {editingIntent && (
                    <EditModal
                        intent={editingIntent}
                        isCreate={isCreateMode}
                        saving={saving}
                        onSave={handleSave}
                        onClose={() => {
                            setEditingIntent(null);
                            setIsCreateMode(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// EDIT MODAL — responsive
// ═══════════════════════════════════════════════════════════

function EditModal({
    intent,
    isCreate,
    saving,
    onSave,
    onClose,
}: {
    intent: BotIntent;
    isCreate: boolean;
    saving: boolean;
    onSave: (data: Partial<BotIntent>) => void;
    onClose: () => void;
}) {
    const [name, setName] = useState(intent.name);
    const [patterns, setPatterns] = useState(intent.patterns.join(", "));
    const [response, setResponse] = useState(intent.response);
    const [quickReplies, setQuickReplies] = useState(intent.quickReplies.join(", "));
    const [priority, setPriority] = useState(intent.priority);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: name.trim(),
            patterns: patterns.split(",").map((s) => s.trim()).filter(Boolean),
            response: response.trim(),
            quickReplies: quickReplies.split(",").map((s) => s.trim()).filter(Boolean),
            priority,
            enabled: intent.enabled,
        });
    };

    const inputStyle: React.CSSProperties = {
        background: "var(--bg-input)",
        border: "1px solid var(--border-primary)",
        color: "var(--text-primary)",
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                    <h2 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                        {isCreate ? "Create New Intent" : `Edit: ${intent.name}`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form — scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                            Intent Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. GREETING, PRICING, CUSTOM_FAQ"
                            required
                            className="w-full rounded-xl px-4 py-3 text-sm focus:ring-1 focus:outline-none transition-all"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                            Trigger Keywords <span style={{ color: "var(--text-placeholder)" }} className="normal-case">(comma-separated)</span>
                        </label>
                        <input
                            type="text"
                            value={patterns}
                            onChange={(e) => setPatterns(e.target.value)}
                            placeholder="e.g. hello, hi, hey, good morning"
                            required
                            className="w-full rounded-xl px-4 py-3 text-sm focus:ring-1 focus:outline-none transition-all"
                            style={inputStyle}
                        />
                        <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            When a user message contains any of these words, this response triggers.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                            Bot Response
                        </label>
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="The bot will send this message. Use **bold** for emphasis."
                            required
                            rows={5}
                            className="w-full rounded-xl px-4 py-3 text-sm focus:ring-1 focus:outline-none resize-none transition-all font-mono"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                            Quick Reply Buttons <span style={{ color: "var(--text-placeholder)" }} className="normal-case">(comma-separated)</span>
                        </label>
                        <input
                            type="text"
                            value={quickReplies}
                            onChange={(e) => setQuickReplies(e.target.value)}
                            placeholder="e.g. View Services, Get a Quote, Talk to Team"
                            className="w-full rounded-xl px-4 py-3 text-sm focus:ring-1 focus:outline-none transition-all"
                            style={inputStyle}
                        />
                        <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            These appear as clickable pill buttons below the bot response.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                            Priority <span style={{ color: "var(--text-placeholder)" }} className="normal-case">(higher = checked first, 1–100)</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={1}
                                max={100}
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value))}
                                className="flex-1 accent-indigo-500"
                            />
                            <span className="text-sm font-mono w-8 text-right" style={{ color: "var(--text-primary)" }}>
                                {priority}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm transition-colors rounded-xl text-center"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 hover:opacity-90"
                            style={{ background: "var(--accent)" }}
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : isCreate ? "Create Intent" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
