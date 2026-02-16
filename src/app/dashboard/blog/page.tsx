"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Search, Eye, EyeOff, Trash2, Edit2, Star, StarOff,
    FileText, Globe, BarChart3, Clock, Loader2, Check, AlertCircle,
    MoreVertical, ArrowUpRight, Image as ImageIcon, Calendar, Filter,
    TrendingUp, Sparkles, X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    published: boolean;
    viewCount: number;
    category: string | null;
    tags: string[];
    readTime: number | null;
    publishedAt: string | null;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
    author: { id: string; name: string | null };
}

const CATEGORIES = [
    "All", "AI & Automation", "Business Growth", "Technology Trends",
    "Tutorials & Guides", "Company News", "Case Studies",
];

export default function BlogDashboardPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const apiHeaders = () => ({ "Content-Type": "application/json" });

    const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/blog/admin/all`, {
                headers: apiHeaders(),
                credentials: "include"
            });
            const json = await res.json();
            if (json.status === "success") setPosts(json.data);
        } catch { showToast("Failed to load posts", "error"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPosts(); }, []);

    const togglePublish = async (post: BlogPost) => {
        try {
            const res = await fetch(`${API_URL}/blog/${post.id}`, {
                method: "PUT",
                headers: apiHeaders(),
                credentials: "include",
                body: JSON.stringify({ published: !post.published }),
            });
            if (!res.ok) {
                const err = await res.text();
                console.error("Toggle Publish Failed:", res.status, err);
                throw new Error("Failed to update");
            }
            showToast(post.published ? "Moved to drafts" : "Published!");
            fetchPosts();
        } catch { showToast("Action failed", "error"); }
        setOpenMenu(null);
    };

    const toggleFeatured = async (post: BlogPost) => {
        try {
            const res = await fetch(`${API_URL}/blog/${post.id}`, {
                method: "PUT",
                headers: apiHeaders(),
                credentials: "include",
                body: JSON.stringify({ featured: !post.featured }),
            });
            if (!res.ok) {
                const err = await res.text();
                console.error("Toggle Featured Failed:", res.status, err);
                throw new Error("Failed to update");
            }
            showToast(post.featured ? "Removed from featured" : "Marked as featured!");
            fetchPosts();
        } catch { showToast("Action failed", "error"); }
        setOpenMenu(null);
    };

    const deletePost = async (id: string | null) => {
        if (!id) return;
        try {
            const res = await fetch(`${API_URL}/blog/${id}`, {
                method: "DELETE",
                headers: apiHeaders(),
                credentials: "include"
            });
            if (!res.ok) {
                const err = await res.text();
                console.error("Delete Failed:", res.status, err);
                throw new Error("Failed to delete");
            }
            showToast("Post deleted");
            fetchPosts();
        } catch { showToast("Delete failed", "error"); }
        setDeleteConfirm(null);
    };

    // ── Filtered posts ──
    const filtered = posts.filter(p => {
        const s = searchQuery.toLowerCase();
        const matchSearch = p.title.toLowerCase().includes(s) || (p.excerpt || "").toLowerCase().includes(s);
        const matchStatus = statusFilter === "all" || (statusFilter === "published" ? p.published : !p.published);
        const matchCat = categoryFilter === "All" || p.category === categoryFilter;
        return matchSearch && matchStatus && matchCat;
    });

    // ── Stats ──
    const stats = {
        total: posts.length,
        published: posts.filter(p => p.published).length,
        drafts: posts.filter(p => !p.published).length,
        totalViews: posts.reduce((a, p) => a + p.viewCount, 0),
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="space-y-8 pb-10">
            {/* ─── Toast ─── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        className="fixed top-5 right-5 z-[100] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-semibold backdrop-blur-xl"
                        style={{
                            background: toast.type === "success"
                                ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))"
                                : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
                            color: toast.type === "success" ? "#22c55e" : "#ef4444",
                            border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                            boxShadow: `0 20px 40px ${toast.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}`,
                        }}
                    >
                        {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Header ─── */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}
                    >
                        Blog Posts
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}
                    >
                        Create, manage, and optimize your content for maximum reach
                    </motion.p>
                </div>
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => router.push("/dashboard/blog/new")}
                    className="group flex items-center gap-2.5 px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all shadow-lg"
                    style={{
                        background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, #7c3aed))",
                        boxShadow: "0 8px 30px rgba(var(--accent-rgb, 99, 102, 241), 0.3)",
                    }}
                >
                    <Plus className="w-4.5 h-4.5 transition-transform group-hover:rotate-90" />
                    New Post
                </motion.button>
            </div>

            {/* ─── Stats Grid ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Posts", value: stats.total, icon: FileText, color: "#6366f1", gradient: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))" },
                    { label: "Published", value: stats.published, icon: Globe, color: "#22c55e", gradient: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.03))" },
                    { label: "Drafts", value: stats.drafts, icon: EyeOff, color: "#f59e0b", gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03))" },
                    { label: "Total Views", value: stats.totalViews.toLocaleString(), icon: TrendingUp, color: "#8b5cf6", gradient: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.03))" },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }}
                        className="p-5 rounded-2xl relative overflow-hidden transition-all hover:scale-[1.02]"
                        style={{ background: s.gradient, border: `1px solid ${s.color}15` }}
                    >
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.08]" style={{ background: s.color }} />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                                <p className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                            </div>
                            <div className="p-2.5 rounded-xl" style={{ background: `${s.color}15` }}>
                                <s.icon className="w-5 h-5" style={{ color: s.color }} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ─── Filters Bar ─── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row gap-3 items-start md:items-center"
            >
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <input
                        type="text" placeholder="Search by title or excerpt..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--bg-surface-hover)]">
                            <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                        </button>
                    )}
                </div>
                {/* Status Tabs */}
                <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                    {(["all", "published", "draft"] as const).map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)}
                            className="relative px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                            style={{ color: statusFilter === f ? "var(--accent-text)" : "var(--text-muted)" }}
                        >
                            {statusFilter === f && (
                                <motion.div layoutId="statusTab" className="absolute inset-0 rounded-lg" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                            )}
                            <span className="relative z-10">{f}</span>
                        </button>
                    ))}
                </div>
                {/* Category Filter */}
                <select
                    value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer pr-8"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
                >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "📁 All Categories" : c}</option>)}
                </select>
            </motion.div>

            {/* ─── Results Count ─── */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Showing <span style={{ color: "var(--text-primary)" }}>{filtered.length}</span> of {posts.length} posts
                </p>
            </div>

            {/* ─── Post Cards Grid ─── */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Loading posts...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center py-24 rounded-3xl"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                    <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
                        <FileText className="w-9 h-9" style={{ color: "var(--accent)" }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                        {searchQuery || statusFilter !== "all" || categoryFilter !== "All" ? "No matching posts" : "No posts yet"}
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
                        {searchQuery || statusFilter !== "all" || categoryFilter !== "All"
                            ? "Try adjusting your filters to find what you're looking for."
                            : "Create your first blog post to start building your content library."}
                    </p>
                    {!searchQuery && statusFilter === "all" && categoryFilter === "All" && (
                        <button
                            onClick={() => router.push("/dashboard/blog/new")}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white"
                            style={{ background: "var(--accent)" }}
                        >
                            <Plus className="w-4 h-4" /> Create First Post
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}
                            className="group rounded-2xl transition-all hover:shadow-xl hover:scale-[1.01] relative"
                            style={{
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border-subtle)",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                            }}
                        >
                            {/* Cover Image */}
                            <div className="relative h-44 overflow-hidden rounded-t-2xl cursor-pointer" onClick={() => router.push(`/dashboard/blog/edit/${post.id}`)}>
                                {post.coverImage ? (
                                    <img
                                        src={post.coverImage} alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--bg-input), var(--bg-surface))" }}>
                                        <ImageIcon className="w-10 h-10" style={{ color: "var(--border-primary)" }} />
                                    </div>
                                )}
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Status & Featured Badges */}
                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
                                        style={{
                                            background: post.published ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
                                            color: post.published ? "#4ade80" : "#fbbf24",
                                            border: `1px solid ${post.published ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                                        }}>
                                        {post.published ? "Published" : "Draft"}
                                    </span>
                                    {post.featured && (
                                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
                                            style={{ background: "rgba(245,158,11,0.2)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>
                                            <Star className="w-3 h-3 inline -mt-0.5 mr-0.5 fill-current" /> Featured
                                        </span>
                                    )}
                                </div>

                                {/* Bottom gradient info */}
                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                    {post.category && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md"
                                            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                            {post.category}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] text-white/70 font-medium">
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.viewCount}</span>
                                        {post.readTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}m</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Action Menu (Moved Outside Overflow-Hidden) */}
                            <div className="absolute top-3 right-3 z-30">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === post.id ? null : post.id); }}
                                    className="w-8 h-8 rounded-lg backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                                    style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.5)", color: "#000" }}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                <AnimatePresence>
                                    {openMenu === post.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10, x: 10 }} animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute right-0 top-10 w-52 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-1"
                                            style={{
                                                background: "var(--bg-surface)",
                                                border: "1px solid var(--border-primary)",
                                                boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
                                            }}
                                        >
                                            <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/blog/edit/${post.id}`); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-[var(--bg-surface-hover)] group"
                                                style={{ color: "var(--text-primary)" }}>
                                                <Edit2 className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                                Edit Post
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); togglePublish(post); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-[var(--bg-surface-hover)] group"
                                                style={{ color: "var(--text-primary)" }}>
                                                {post.published ? <EyeOff className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" /> : <Eye className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />}
                                                {post.published ? "Unpublish" : "Publish"}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); toggleFeatured(post); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-[var(--bg-surface-hover)] group"
                                                style={{ color: "var(--text-primary)" }}>
                                                {post.featured ? <StarOff className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" /> : <Star className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />}
                                                {post.featured ? "Remove Featured" : "Set Featured"}
                                            </button>
                                            <div className="my-1 border-t" style={{ borderColor: "var(--border-subtle)" }} />
                                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(post.id); setOpenMenu(null); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-red-50 text-red-500 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Content */}
                            <div className="p-5 cursor-pointer" onClick={() => router.push(`/dashboard/blog/edit/${post.id}`)}>
                                <h3 className="text-base font-bold leading-snug line-clamp-2 mb-2 group-hover:text-[var(--accent-text)] transition-colors" style={{ color: "var(--text-primary)" }}>
                                    {post.title}
                                </h3>
                                {post.excerpt && (
                                    <p className="text-xs leading-relaxed line-clamp-2 mb-4" style={{ color: "var(--text-muted)" }}>
                                        {post.excerpt}
                                    </p>
                                )}
                                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                            style={{ background: "linear-gradient(135deg, var(--accent), #7c3aed)" }}>
                                            {(post.author.name || "A").charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{post.author.name || "Admin"}</span>
                                    </div>
                                    <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                                        {formatDate(post.publishedAt || post.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ─── Delete Confirmation Modal ─── */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="p-7 rounded-3xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}
                        >
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                                style={{ background: "rgba(239,68,68,0.1)" }}>
                                <Trash2 className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-center mb-2" style={{ color: "var(--text-primary)" }}>Delete this post?</h3>
                            <p className="text-sm text-center mb-7" style={{ color: "var(--text-muted)" }}>
                                This action is permanent and cannot be undone. The post will be removed from your blog.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}>
                                    Cancel
                                </button>
                                <button onClick={() => deletePost(deleteConfirm)}
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 15px rgba(239,68,68,0.3)" }}>
                                    Delete Post
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Close menu on outside click */}
            {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}
        </div>
    );
}
