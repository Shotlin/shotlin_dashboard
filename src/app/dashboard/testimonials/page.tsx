"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquareQuote, Plus, Star, Edit2, Trash2, X, Check, ChevronDown,
    Eye, EyeOff, Search, Upload, User, Briefcase, Building2, Quote,
    GripVertical, Loader2, Sparkles,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    company: string;
    avatar: string;
    companyLogo?: string;
    quote: string;
    rating: number;
    featured: boolean;
    sortOrder: number;
    active: boolean;
    createdAt: string;
}

const emptyForm = {
    name: "", role: "", company: "", avatar: "", companyLogo: "", quote: "", rating: 5, featured: false, sortOrder: 0, active: true,
};

export default function TestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchTestimonials = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/testimonials/admin/all`, {
                credentials: "include"
            });
            const data = await res.json();
            if (data.status === "success") setTestimonials(data.data);
        } catch (e) {
            console.error("Failed to fetch testimonials", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

    const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const openEdit = (t: Testimonial) => {
        setForm({
            name: t.name, role: t.role, company: t.company, avatar: t.avatar,
            companyLogo: t.companyLogo || "", quote: t.quote, rating: t.rating,
            featured: t.featured, sortOrder: t.sortOrder, active: t.active,
        });
        setEditingId(t.id);
        setShowForm(true);
    };

    const openNew = () => {
        setForm({ ...emptyForm, sortOrder: testimonials.length });
        setEditingId(null);
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editingId ? `${API_URL}/testimonials/${editingId}` : `${API_URL}/testimonials`;
            const method = editingId ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
                fetchTestimonials();
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`${API_URL}/testimonials/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            setDeleteConfirm(null);
            fetchTestimonials();
        } catch (e) { console.error(e); }
    };

    const toggleActive = async (t: Testimonial) => {
        try {
            await fetch(`${API_URL}/testimonials/${t.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ active: !t.active }),
            });
            fetchTestimonials();
        } catch (e) { console.error(e); }
    };

    const toggleFeatured = async (t: Testimonial) => {
        try {
            await fetch(`${API_URL}/testimonials/${t.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ featured: !t.featured }),
            });
            fetchTestimonials();
        } catch (e) { console.error(e); }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            const data = await res.json();
            if (data.url) updateField("avatar", data.url);
        } catch (err) { console.error(err); }
    };

    const filtered = testimonials.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.company.toLowerCase().includes(search.toLowerCase()) ||
        t.quote.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = testimonials.filter(t => t.active).length;
    const featuredCount = testimonials.filter(t => t.featured).length;
    const avgRating = testimonials.length ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1) : "0";

    return (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Testimonials
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        Manage client testimonials displayed on your website
                    </p>
                </div>
                <button onClick={openNew}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] shadow-lg"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                    <Plus className="w-4 h-4" /> Add Testimonial
                </button>
            </motion.div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: testimonials.length, icon: MessageSquareQuote, gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
                    { label: "Active", value: activeCount, icon: Eye, gradient: "linear-gradient(135deg, #10b981, #059669)" },
                    { label: "Featured", value: featuredCount, icon: Sparkles, gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
                    { label: "Avg Rating", value: avgRating, icon: Star, gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="rounded-2xl p-5 relative overflow-hidden"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] -mr-6 -mt-6" style={{ background: s.gradient }} />
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.gradient }}>
                            <s.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Search ── */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search testimonials..." className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
            </div>

            {/* ── Testimonial Cards ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
                </div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-20 rounded-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <MessageSquareQuote className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                    <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>No testimonials found</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {search ? "Try a different search" : "Add your first testimonial to get started"}
                    </p>
                    {!search && (
                        <button onClick={openNew} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                            <Plus className="w-4 h-4 inline mr-1" /> Add Testimonial
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((t, i) => (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={`rounded-2xl p-5 transition-all relative group ${!t.active ? "opacity-50" : ""}`}
                            style={{ background: "var(--bg-surface)", border: `1px solid ${t.featured ? "rgba(245,158,11,0.3)" : "var(--border-subtle)"}` }}>
                            {t.featured && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400">
                                    <Sparkles className="w-3 h-3" /> Featured
                                </div>
                            )}
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                                    {t.avatar ? (
                                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t.name}</h3>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.role} · {t.company}</p>
                                </div>
                            </div>

                            <p className="text-sm mt-3 line-clamp-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            <div className="flex items-center gap-1 mt-3">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                ))}
                                {Array.from({ length: 5 - t.rating }).map((_, j) => (
                                    <Star key={j} className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                                ))}
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                <button onClick={() => toggleActive(t)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                                    style={{ background: "var(--bg-input)", color: t.active ? "#22c55e" : "var(--text-muted)" }}>
                                    {t.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    {t.active ? "Active" : "Hidden"}
                                </button>
                                <button onClick={() => toggleFeatured(t)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                                    style={{ background: "var(--bg-input)", color: t.featured ? "#f59e0b" : "var(--text-muted)" }}>
                                    <Sparkles className="w-3 h-3" /> {t.featured ? "Featured" : "Feature"}
                                </button>
                                <div className="flex-1" />
                                <button onClick={() => openEdit(t)}
                                    className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setDeleteConfirm(t.id)}
                                    className="p-2 rounded-lg transition-colors hover:bg-red-500/10 text-red-400">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="rounded-2xl p-6 max-w-sm w-full"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}>
                            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Delete Testimonial?</h3>
                            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Add/Edit Drawer ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex justify-end"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                        onClick={() => { setShowForm(false); setEditingId(null); }}>
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg h-full overflow-y-auto"
                            style={{ background: "var(--bg-primary)", borderLeft: "1px solid var(--border-primary)" }}>

                            {/* Drawer Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4"
                                style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
                                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                                    {editingId ? "Edit Testimonial" : "Add Testimonial"}
                                </h2>
                                <button onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="p-2 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Avatar Upload */}
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 relative group"
                                        style={{ background: "var(--bg-input)", border: "2px dashed var(--border-primary)" }}>
                                        {form.avatar ? (
                                            <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
                                            </div>
                                        )}
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                            <Upload className="w-5 h-5 text-white" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                        </label>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Photo</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Click to upload or paste URL below</p>
                                        <input value={form.avatar} onChange={e => updateField("avatar", e.target.value)}
                                            placeholder="https://..." className="mt-2 w-full px-3 py-2 rounded-lg text-xs outline-none"
                                            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        style={{ color: "var(--text-muted)" }}>Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                        <input value={form.name} onChange={e => updateField("name", e.target.value)}
                                            placeholder="Sarah Johnson" className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
                                    </div>
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        style={{ color: "var(--text-muted)" }}>Role *</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                        <input value={form.role} onChange={e => updateField("role", e.target.value)}
                                            placeholder="Marketing Director" className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
                                    </div>
                                </div>

                                {/* Company */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        style={{ color: "var(--text-muted)" }}>Company *</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                        <input value={form.company} onChange={e => updateField("company", e.target.value)}
                                            placeholder="TechVision Inc." className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
                                    </div>
                                </div>

                                {/* Quote */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        style={{ color: "var(--text-muted)" }}>Quote *</label>
                                    <textarea value={form.quote} onChange={e => updateField("quote", e.target.value)}
                                        placeholder="Working with this team transformed our digital presence..." rows={4}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
                                </div>

                                {/* Rating */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        style={{ color: "var(--text-muted)" }}>Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button key={n} onClick={() => updateField("rating", n)}
                                                className="p-1.5 rounded-lg transition-all hover:scale-110">
                                                <Star className={`w-6 h-6 ${n <= form.rating ? "fill-yellow-400 text-yellow-400" : ""}`}
                                                    style={n > form.rating ? { color: "var(--text-muted)" } : {}} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.featured} onChange={e => updateField("featured", e.target.checked)}
                                            className="accent-amber-500 w-4 h-4" />
                                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Featured</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.active} onChange={e => updateField("active", e.target.checked)}
                                            className="accent-emerald-500 w-4 h-4" />
                                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Active (visible on site)</span>
                                    </label>
                                </div>

                                {/* Company Logo URL */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        style={{ color: "var(--text-muted)" }}>Company Logo URL (optional)</label>
                                    <input value={form.companyLogo} onChange={e => updateField("companyLogo", e.target.value)}
                                        placeholder="https://..." className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
                                </div>

                                {/* Sort Order */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        style={{ color: "var(--text-muted)" }}>Sort Order</label>
                                    <input type="number" value={form.sortOrder} onChange={e => updateField("sortOrder", parseInt(e.target.value) || 0)}
                                        className="w-24 px-4 py-3 rounded-xl text-sm outline-none"
                                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="sticky bottom-0 p-6 pt-4 flex gap-3"
                                style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-subtle)" }}>
                                <button onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}>
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving || !form.name || !form.role || !form.company || !form.quote}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                                        editingId ? "Save Changes" : "Create Testimonial"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
