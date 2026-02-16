"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Megaphone, Plus, Edit2, Trash2, X, Eye, EyeOff, Search,
    Loader2, Sparkles, ArrowUpRight, TrendingUp, MousePointerClick,
    BarChart3, Calendar, MessageCircle, Power, ChevronDown,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Promotion {
    id: string;
    title: string;
    message: string;
    serviceId?: string;
    serviceSlug?: string;
    serviceTitle?: string;
    whatsappUrl?: string;
    ctaText: string;
    badge?: string;
    active: boolean;
    priority: number;
    startDate: string;
    endDate?: string;
    showOnPages: string[];
    impressions: number;
    clicks: number;
    createdAt: string;
    updatedAt: string;
}

interface Service {
    id: string;
    title: string;
    slug: string;
    whatsappUrl?: string;
}

const emptyForm = {
    title: "",
    message: "",
    serviceId: "",
    serviceSlug: "",
    serviceTitle: "",
    whatsappUrl: "",
    ctaText: "Get Offer",
    badge: "",
    active: true,
    priority: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    showOnPages: ["home", "services"],
};

const PAGE_OPTIONS = [
    { value: "home", label: "Homepage" },
    { value: "services", label: "Services" },
    { value: "blog", label: "Blog" },
];

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchPromotions = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/promotions`, { credentials: "include" });
            const data = await res.json();
            if (data.status === "success") setPromotions(data.data);
        } catch (e) {
            console.error("Failed to fetch promotions", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/services`, { credentials: "include" });
            const data = await res.json();
            if (data.status === "success") setServices(data.data);
        } catch (e) {
            console.error("Failed to fetch services", e);
        }
    }, []);

    useEffect(() => {
        fetchPromotions();
        fetchServices();
    }, [fetchPromotions, fetchServices]);

    const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const openEdit = (p: Promotion) => {
        setForm({
            title: p.title,
            message: p.message,
            serviceId: p.serviceId || "",
            serviceSlug: p.serviceSlug || "",
            serviceTitle: p.serviceTitle || "",
            whatsappUrl: p.whatsappUrl || "",
            ctaText: p.ctaText,
            badge: p.badge || "",
            active: p.active,
            priority: p.priority,
            startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
            endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
            showOnPages: p.showOnPages || ["home", "services"],
        });
        setEditingId(p.id);
        setShowForm(true);
    };

    const openNew = () => {
        setForm({ ...emptyForm, startDate: new Date().toISOString().split("T")[0] });
        setEditingId(null);
        setShowForm(true);
    };

    const handleServiceSelect = (serviceId: string) => {
        const svc = services.find((s) => s.id === serviceId);
        if (svc) {
            updateField("serviceId", svc.id);
            updateField("serviceSlug", svc.slug);
            updateField("serviceTitle", svc.title);
            if (svc.whatsappUrl) updateField("whatsappUrl", svc.whatsappUrl);
        } else {
            updateField("serviceId", "");
            updateField("serviceSlug", "");
            updateField("serviceTitle", "");
        }
    };

    const togglePage = (page: string) => {
        setForm(prev => ({
            ...prev,
            showOnPages: prev.showOnPages.includes(page)
                ? prev.showOnPages.filter(p => p !== page)
                : [...prev.showOnPages, page],
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editingId ? `${API_URL}/promotions/${editingId}` : `${API_URL}/promotions`;
            const method = editingId ? "PUT" : "POST";
            const body: Record<string, any> = { ...form };
            if (!body.serviceId) { delete body.serviceId; delete body.serviceSlug; delete body.serviceTitle; }
            if (!body.whatsappUrl) delete body.whatsappUrl;
            if (!body.badge) delete body.badge;
            if (!body.endDate) body.endDate = null;
            body.priority = Number(body.priority);

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                fetchPromotions();
            }
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (promo: Promotion) => {
        try {
            await fetch(`${API_URL}/promotions/${promo.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ active: !promo.active }),
            });
            fetchPromotions();
        } catch (e) {
            console.error("Toggle failed", e);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`${API_URL}/promotions/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            setDeleteConfirm(null);
            fetchPromotions();
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    // ── Analytics aggregates ──
    const totalImpressions = promotions.reduce((sum, p) => sum + p.impressions, 0);
    const totalClicks = promotions.reduce((sum, p) => sum + p.clicks, 0);
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";
    const activePromos = promotions.filter(p => p.active).length;

    const filtered = promotions.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.message.toLowerCase().includes(search.toLowerCase())
    );

    const inputClasses = "w-full px-3 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
    const labelClasses = "text-xs font-semibold uppercase tracking-wider mb-1.5 block";

    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-primary)" }}>
                        <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Promotions</h1>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage flash messages & track engagement</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openNew}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm"
                    style={{ background: "var(--accent-primary)" }}
                >
                    <Plus className="w-4 h-4" /> New Promotion
                </motion.button>
            </div>

            {/* ─── Analytics Cards ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Promos", value: activePromos, icon: Power, color: "#10b981" },
                    { label: "Impressions", value: totalImpressions.toLocaleString(), icon: Eye, color: "#6366f1" },
                    { label: "Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "#f59e0b" },
                    { label: "Avg. CTR", value: `${avgCTR}%`, icon: TrendingUp, color: "#ec4899" },
                ].map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl p-4 backdrop-blur-sm"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</span>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}15` }}>
                                <card.icon className="w-4 h-4" style={{ color: card.color }} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* ─── Search ─── */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                    type="text"
                    placeholder="Search promotions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`${inputClasses} pl-10`}
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                />
            </div>

            {/* ─── Promotions List ─── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 rounded-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}>
                    <Megaphone className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                    <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No promotions yet</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Create your first flash message to start driving engagement</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((promo, i) => {
                        const ctr = promo.impressions > 0 ? ((promo.clicks / promo.impressions) * 100).toFixed(1) : "0.0";
                        const isExpired = promo.endDate && new Date(promo.endDate) < new Date();

                        return (
                            <motion.div
                                key={promo.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="rounded-xl p-4 group"
                                style={{
                                    background: "var(--bg-surface)",
                                    border: `1px solid ${promo.active && !isExpired ? "var(--accent-primary)" : "var(--border-primary)"}`,
                                    opacity: promo.active && !isExpired ? 1 : 0.7,
                                }}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            {promo.badge && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                                                    <Sparkles className="w-2.5 h-2.5" />
                                                    {promo.badge}
                                                </span>
                                            )}
                                            {promo.active && !isExpired && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                                                    Live
                                                </span>
                                            )}
                                            {isExpired && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                                                    Expired
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{promo.title}</h3>
                                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{promo.message}</p>
                                        <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                                            {promo.serviceTitle && (
                                                <span className="flex items-center gap-1">
                                                    <ArrowUpRight className="w-3 h-3" /> {promo.serviceTitle}
                                                </span>
                                            )}
                                            {promo.whatsappUrl && (
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3" /> WhatsApp
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(promo.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                {promo.endDate && ` – ${new Date(promo.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                                            </span>
                                            <span>Pages: {promo.showOnPages.join(", ")}</span>
                                        </div>
                                    </div>

                                    {/* Analytics */}
                                    <div className="flex items-center gap-4 text-center flex-shrink-0">
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{promo.impressions.toLocaleString()}</p>
                                            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Views</p>
                                        </div>
                                        <div className="w-px h-8" style={{ background: "var(--border-primary)" }} />
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{promo.clicks.toLocaleString()}</p>
                                            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Clicks</p>
                                        </div>
                                        <div className="w-px h-8" style={{ background: "var(--border-primary)" }} />
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: ctr !== "0.0" ? "#10b981" : "var(--text-primary)" }}>{ctr}%</p>
                                            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>CTR</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => handleToggleActive(promo)}
                                            className="p-2 rounded-lg transition-colors hover:bg-white/5"
                                            title={promo.active ? "Deactivate" : "Activate"}
                                        >
                                            {promo.active ? (
                                                <Eye className="w-4 h-4" style={{ color: "#10b981" }} />
                                            ) : (
                                                <EyeOff className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => openEdit(promo)}
                                            className="p-2 rounded-lg transition-colors hover:bg-white/5"
                                        >
                                            <Edit2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                        </button>
                                        {deleteConfirm === promo.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleDelete(promo.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(null)} className="p-2 rounded-lg hover:bg-white/5">
                                                    <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeleteConfirm(promo.id)} className="p-2 rounded-lg transition-colors hover:bg-white/5">
                                                <Trash2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ─── Create / Edit Modal ─── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        onClick={() => { setShowForm(false); setEditingId(null); }}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                                        <Megaphone className="w-4 h-4" style={{ color: "#818cf8" }} />
                                    </div>
                                    <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                                        {editingId ? "Edit Promotion" : "New Promotion"}
                                    </h2>
                                </div>
                                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 rounded-lg hover:bg-white/5">
                                    <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                </button>
                            </div>

                            {/* Form Body */}
                            <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
                                {/* Title */}
                                <div>
                                    <label className={labelClasses} style={{ color: "var(--text-muted)" }}>
                                        Title <span style={{ color: "#ef4444" }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => updateField("title", e.target.value)}
                                        placeholder="🚀 50% Off Web Development This Week!"
                                        className={inputClasses}
                                        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className={labelClasses} style={{ color: "var(--text-muted)" }}>
                                        Message <span style={{ color: "#ef4444" }}>*</span>
                                    </label>
                                    <textarea
                                        value={form.message}
                                        onChange={(e) => updateField("message", e.target.value)}
                                        placeholder="Limited-time offer for new clients. Get a premium website at half the price."
                                        rows={2}
                                        className={`${inputClasses} resize-none`}
                                        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                    />
                                </div>

                                {/* Service Selector */}
                                <div>
                                    <label className={labelClasses} style={{ color: "var(--text-muted)" }}>Link to Service</label>
                                    <select
                                        value={form.serviceId}
                                        onChange={(e) => handleServiceSelect(e.target.value)}
                                        className={inputClasses}
                                        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                    >
                                        <option value="">None — Direct WhatsApp only</option>
                                        {services.map((s) => (
                                            <option key={s.id} value={s.id}>{s.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* WhatsApp URL */}
                                <div>
                                    <label className={labelClasses} style={{ color: "var(--text-muted)" }}>WhatsApp URL</label>
                                    <input
                                        type="url"
                                        value={form.whatsappUrl}
                                        onChange={(e) => updateField("whatsappUrl", e.target.value)}
                                        placeholder="https://wa.me/919876543210?text=Hi"
                                        className={inputClasses}
                                        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                    />
                                </div>

                                {/* Row: CTA Text + Badge */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClasses} style={{ color: "var(--text-muted)" }}>CTA Button Text</label>
                                        <input
                                            type="text"
                                            value={form.ctaText}
                                            onChange={(e) => updateField("ctaText", e.target.value)}
                                            placeholder="Get Offer"
                                            className={inputClasses}
                                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses} style={{ color: "var(--text-muted)" }}>Badge</label>
                                        <input
                                            type="text"
                                            value={form.badge}
                                            onChange={(e) => updateField("badge", e.target.value)}
                                            placeholder="LIMITED TIME"
                                            className={inputClasses}
                                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                        />
                                    </div>
                                </div>

                                {/* Row: Priority + Active */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClasses} style={{ color: "var(--text-muted)" }}>Priority (0–100)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={form.priority}
                                            onChange={(e) => updateField("priority", parseInt(e.target.value) || 0)}
                                            className={inputClasses}
                                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                        />
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.active}
                                                onChange={(e) => updateField("active", e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 rounded-full bg-zinc-700 peer-checked:bg-indigo-600 transition-colors relative">
                                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? "translate-x-5" : "translate-x-0"}`} />
                                            </div>
                                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Active</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Row: Start Date + End Date */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClasses} style={{ color: "var(--text-muted)" }}>Start Date</label>
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => updateField("startDate", e.target.value)}
                                            className={inputClasses}
                                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses} style={{ color: "var(--text-muted)" }}>End Date <span className="normal-case tracking-normal font-normal">(optional)</span></label>
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            onChange={(e) => updateField("endDate", e.target.value)}
                                            className={inputClasses}
                                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                        />
                                    </div>
                                </div>

                                {/* Show On Pages */}
                                <div>
                                    <label className={labelClasses} style={{ color: "var(--text-muted)" }}>Show On Pages</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {PAGE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => togglePage(opt.value)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.showOnPages.includes(opt.value)
                                                        ? "text-white"
                                                        : ""
                                                    }`}
                                                style={{
                                                    background: form.showOnPages.includes(opt.value) ? "var(--accent-primary)" : "var(--bg-primary)",
                                                    border: `1px solid ${form.showOnPages.includes(opt.value) ? "var(--accent-primary)" : "var(--border-primary)"}`,
                                                    color: form.showOnPages.includes(opt.value) ? "#fff" : "var(--text-muted)",
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
                                <button
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    disabled={saving || !form.title || !form.message}
                                    className="px-5 py-2 rounded-xl text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                                    style={{ background: "var(--accent-primary)" }}
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingId ? "Update" : "Create"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
