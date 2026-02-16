"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Search, Eye, EyeOff, Trash2, Edit2, Star, StarOff,
    Layers, Globe, BarChart3, Loader2, Check, AlertCircle,
    MoreVertical, ArrowUpRight, DollarSign, Tag, Sparkles, X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Service {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    description: string;
    icon: string | null;
    color: string;
    coverImage: string | null;
    published: boolean;
    sortOrder: number;
    benefits: string[] | null;
    technologies: string[] | null;
    deliverables: string[] | null;
    limitedOffer: { badge?: string; title?: string; price?: number; active?: boolean } | null;
    price: number | null;
    currency: string;
    pricingType: string;
    featured: boolean;
    hasDetailPage: boolean;
    createdAt: string;
    updatedAt: string;
}

const COLOR_MAP: Record<string, string> = {
    blue: "from-blue-600 to-indigo-600",
    purple: "from-purple-600 to-violet-600",
    green: "from-emerald-600 to-teal-600",
    orange: "from-amber-600 to-orange-600",
    pink: "from-pink-600 to-rose-600",
};

const COLOR_BG: Record<string, string> = {
    blue: "bg-blue-500/15",
    purple: "bg-purple-500/15",
    green: "bg-emerald-500/15",
    orange: "bg-amber-500/15",
    pink: "bg-pink-500/15",
};

const COLOR_TEXT: Record<string, string> = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-emerald-400",
    orange: "text-amber-400",
    pink: "text-pink-400",
};

export default function ServicesDashboardPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "featured">("all");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const apiHeaders = () => ({ "Content-Type": "application/json" });

    const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/services/admin/all`, {
                headers: apiHeaders(),
                credentials: "include"
            });
            const json = await res.json();
            if (json.status === "success") setServices(json.data);
        } catch { showToast("Failed to load services", "error"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchServices(); }, []);

    const togglePublish = async (svc: Service) => {
        try {
            const res = await fetch(`${API_URL}/services/${svc.id}`, {
                method: "PUT",
                headers: apiHeaders(),
                credentials: "include",
                body: JSON.stringify({ published: !svc.published }),
            });
            if (!res.ok) { const err = await res.text(); console.error("Toggle Publish:", res.status, err); throw new Error("fail"); }
            showToast(svc.published ? "Unpublished" : "Published!");
            fetchServices();
        } catch { showToast("Action failed", "error"); }
        setOpenMenu(null);
    };

    const toggleFeatured = async (svc: Service) => {
        try {
            const res = await fetch(`${API_URL}/services/${svc.id}`, {
                method: "PUT",
                headers: apiHeaders(),
                credentials: "include",
                body: JSON.stringify({ featured: !svc.featured }),
            });
            if (!res.ok) { const err = await res.text(); console.error("Toggle Featured:", res.status, err); throw new Error("fail"); }
            showToast(svc.featured ? "Removed from featured" : "Marked as featured!");
            fetchServices();
        } catch { showToast("Action failed", "error"); }
        setOpenMenu(null);
    };

    const deleteService = async (id: string | null) => {
        if (!id) return;
        try {
            const res = await fetch(`${API_URL}/services/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!res.ok) { const err = await res.text(); console.error("Delete:", res.status, err); throw new Error("fail"); }
            showToast("Service deleted");
            fetchServices();
        } catch { showToast("Delete failed", "error"); }
        setDeleteConfirm(null);
    };

    // Filters
    const filtered = services.filter((s) => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "all" ? true :
                statusFilter === "published" ? s.published :
                    statusFilter === "draft" ? !s.published :
                        statusFilter === "featured" ? s.featured : true;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: services.length,
        published: services.filter(s => s.published).length,
        drafts: services.filter(s => !s.published).length,
        featured: services.filter(s => s.featured).length,
    };

    const formatPrice = (s: Service) =>
        s.price ? `${s.currency === "INR" ? "₹" : "$"}${s.price.toLocaleString()}` : s.pricingType === "CONTACT" ? "Contact" : "—";

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Services</h1>
                    <p className="text-gray-500 mt-1">Manage your service offerings</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/dashboard/services/new")}
                    className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    <Plus className="w-5 h-5" /> New Service
                </motion.button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total Services", value: stats.total, icon: <Layers className="w-5 h-5" />, gradient: "from-blue-500 to-cyan-500" },
                    { label: "Published", value: stats.published, icon: <Globe className="w-5 h-5" />, gradient: "from-green-500 to-emerald-500" },
                    { label: "Drafts", value: stats.drafts, icon: <Eye className="w-5 h-5" />, gradient: "from-amber-500 to-orange-500" },
                    { label: "Featured", value: stats.featured, icon: <Star className="w-5 h-5" />, gradient: "from-purple-500 to-pink-500" },
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                    >
                        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient}`} />
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient} bg-opacity-10`}>{card.icon}</div>
                        </div>
                        <div className="text-3xl font-bold">{card.value}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{card.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-colors placeholder:text-gray-600"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "published", "draft", "featured"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${statusFilter === f
                                ? "bg-white text-black"
                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Service List */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <Layers className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">
                        {searchQuery ? "No services match your search" : "No services yet"}
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">
                        {searchQuery ? "Try a different search term" : "Create your first service to get started"}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => router.push("/dashboard/services/new")}
                            className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all"
                        >
                            <Plus className="w-5 h-5" /> New Service
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((svc, i) => (
                        <motion.div
                            key={svc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative group rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-visible"
                        >
                            <div className="flex flex-col md:flex-row items-stretch">
                                {/* Color Accent Bar */}
                                <div className={`w-full md:w-1 md:min-h-full bg-gradient-to-b ${COLOR_MAP[svc.color] || COLOR_MAP.blue} rounded-t-2xl md:rounded-none md:rounded-l-2xl`} />

                                {/* Cover Image */}
                                {svc.coverImage && (
                                    <div className="w-full md:w-40 h-32 md:h-auto flex-shrink-0 overflow-hidden">
                                        <img src={svc.coverImage} alt={svc.title} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                                    {/* Icon + Info */}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className={`w-12 h-12 rounded-xl ${COLOR_BG[svc.color] || COLOR_BG.blue} flex items-center justify-center flex-shrink-0`}>
                                            <Layers className={`w-5 h-5 ${COLOR_TEXT[svc.color] || COLOR_TEXT.blue}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-semibold truncate">{svc.title}</h3>
                                                {svc.featured && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                                        <Star className="w-3 h-3 fill-current" /> Featured
                                                    </span>
                                                )}
                                                {svc.limitedOffer && (svc.limitedOffer as any).active && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                                                        <Sparkles className="w-3 h-3" /> Limited Offer
                                                    </span>
                                                )}
                                            </div>
                                            {svc.subtitle && <p className="text-sm text-gray-500 mt-0.5 truncate">{svc.subtitle}</p>}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                                {svc.technologies && (svc.technologies as string[]).slice(0, 3).map((t, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/5">{t}</span>
                                                ))}
                                                {svc.technologies && (svc.technologies as string[]).length > 3 && (
                                                    <span className="text-gray-600">+{(svc.technologies as string[]).length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-6 text-sm">
                                        {/* Price */}
                                        <div className="text-right">
                                            <div className="text-lg font-bold">{formatPrice(svc)}</div>
                                            <div className="text-[10px] text-gray-600 uppercase tracking-wider">{svc.pricingType}</div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${svc.published
                                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                            : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                            }`}>
                                            {svc.published ? "Published" : "Draft"}
                                        </div>

                                        {/* Actions Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === svc.id ? null : svc.id); }}
                                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5 text-gray-400" />
                                            </button>
                                            <AnimatePresence>
                                                {openMenu === svc.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                        className="absolute right-0 top-full mt-1 w-52 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                                                    >
                                                        <button onClick={() => { router.push(`/dashboard/services/${svc.id}`); setOpenMenu(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 text-gray-300 transition-colors">
                                                            <Edit2 className="w-4 h-4" /> Edit
                                                        </button>
                                                        <button onClick={() => togglePublish(svc)}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 text-gray-300 transition-colors">
                                                            {svc.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            {svc.published ? "Unpublish" : "Publish"}
                                                        </button>
                                                        <button onClick={() => toggleFeatured(svc)}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 text-gray-300 transition-colors">
                                                            {svc.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                                                            {svc.featured ? "Unfeature" : "Set Featured"}
                                                        </button>
                                                        <div className="border-t border-white/5 my-1" />
                                                        <button onClick={() => { setDeleteConfirm(svc.id); setOpenMenu(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 transition-colors">
                                                            <Trash2 className="w-4 h-4" /> Delete
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Close menu on outside click */}
            {openMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-red-500/10"><Trash2 className="w-6 h-6 text-red-400" /></div>
                                <div>
                                    <h3 className="text-lg font-bold">Delete Service</h3>
                                    <p className="text-sm text-gray-400">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm mb-6">
                                Are you sure you want to permanently delete this service? All associated data will be lost.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
                                    Cancel
                                </button>
                                <button onClick={() => deleteService(deleteConfirm)}
                                    className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                                    Delete Service
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 20, x: "-50%" }}
                        className={`fixed bottom-8 left-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium ${toast.type === "success"
                            ? "bg-green-500/10 border-green-500/20 text-green-300"
                            : "bg-red-500/10 border-red-500/20 text-red-300"
                            }`}
                    >
                        {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
