"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Save, Send, Image as ImageIcon, Upload, X, Plus,
    Globe, FileText, Settings, Clock, Eye, Sparkles, ChevronDown,
    ChevronRight, Type, AlignLeft, Hash, Link2, Code, ExternalLink,
    Loader2, Check, AlertCircle, Calendar, Star, BarChart3,
    PanelRightClose, PanelRightOpen, Zap,
} from "lucide-react";
import RichTextEditor from "@/components/blog/RichTextEditor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const CATEGORIES = [
    "AI & Automation", "Business Growth", "Technology Trends",
    "Tutorials & Guides", "Company News", "Case Studies",
];

interface EditorForm {
    title: string;
    content: string;
    excerpt: string;
    coverImage: string;
    published: boolean;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    canonicalUrl: string;
    ogImage: string;
    structuredData: string;
    category: string;
    tags: string[];
    featured: boolean;
    publishedAt: string;
}

const defaultForm: EditorForm = {
    title: "", content: "", excerpt: "", coverImage: "", published: false,
    metaTitle: "", metaDescription: "", metaKeywords: [], canonicalUrl: "",
    ogImage: "", structuredData: "", category: "", tags: [], featured: false,
    publishedAt: "",
};

// ── Collapsible Section ──
function SidebarSection({ title, icon: Icon, children, defaultOpen = true }: {
    title: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{title}</span>
                </div>
                <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── SEO Score Ring ──
function SeoScoreRing({ score }: { score: number }) {
    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
    const label = score >= 80 ? "Great" : score >= 50 ? "OK" : "Poor";

    return (
        <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" strokeWidth="5" stroke="var(--border-subtle)" />
                    <motion.circle
                        cx="40" cy="40" r="36" fill="none" strokeWidth="5" stroke={color}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        strokeDasharray={circumference}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold" style={{ color }}>{score}</span>
                </div>
            </div>
            <div>
                <p className="text-sm font-bold" style={{ color }}>{label}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>SEO Score</p>
            </div>
        </div>
    );
}

// ── Main Editor ──
export default function NewBlogPostPage() {
    const router = useRouter();
    const [form, setForm] = useState<EditorForm>(defaultForm);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [keywordInput, setKeywordInput] = useState("");
    const [uploading, setUploading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [coverHover, setCoverHover] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [pendingFiles, setPendingFiles] = useState<{ coverImage?: File; ogImage?: File }>({});

    // Detect mobile and auto-close sidebar
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const apiHeaders = (json = true): Record<string, string> => {
        const h: Record<string, string> = {};
        if (json) h["Content-Type"] = "application/json";
        return h;
    };

    const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const updateField = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
        setForm(f => ({ ...f, [key]: value }));
    };

    const handleImageSelect = (file: File, field: "coverImage" | "ogImage") => {
        const previewUrl = URL.createObjectURL(file);
        updateField(field, previewUrl);
        setPendingFiles(prev => ({ ...prev, [field]: file }));
    };

    const removeImage = (field: "coverImage" | "ogImage") => {
        updateField(field, "");
        setPendingFiles(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const uploadFileToServer = async (file: File): Promise<string | null> => {
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`${API_URL}/upload`, {
                method: "POST",
                headers: apiHeaders(false),
                credentials: "include",
                body: fd
            });
            const json = await res.json();
            if (json.url) return json.url;
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const uploadContentImage = async (file: File): Promise<string | null> => {
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`${API_URL}/upload`, {
                method: "POST",
                headers: apiHeaders(false),
                credentials: "include",
                body: fd
            });
            const json = await res.json();
            if (json.url) { showToast("Image inserted!"); return json.url; }
            showToast("Upload failed", "error");
            return null;
        } catch { showToast("Upload failed", "error"); return null; }
    };

    const savePost = async (publish?: boolean) => {
        if (!form.title.trim()) { showToast("Title is required", "error"); return; }
        if (!form.content.trim()) { showToast("Content is required", "error"); return; }

        setSaving(true);
        try {
            let finalCoverImage = form.coverImage;
            let finalOgImage = form.ogImage;

            if (pendingFiles.coverImage) {
                const url = await uploadFileToServer(pendingFiles.coverImage);
                if (url) finalCoverImage = url;
                else { showToast("Failed to upload cover image", "error"); setSaving(false); return; }
            }
            if (pendingFiles.ogImage) {
                const url = await uploadFileToServer(pendingFiles.ogImage);
                if (url) finalOgImage = url;
                else { showToast("Failed to upload OG image", "error"); setSaving(false); return; }
            }

            const payload = {
                ...form,
                coverImage: finalCoverImage,
                ogImage: finalOgImage,
                published: publish !== undefined ? publish : form.published
            };

            const res = await fetch(`${API_URL}/blog`, {
                method: "POST",
                headers: apiHeaders(),
                credentials: "include",
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.status === "success") {
                showToast(publish ? "Post published! 🎉" : "Draft saved!");
                setTimeout(() => router.push("/dashboard/blog"), 800);
            } else {
                showToast(json.message || "Save failed", "error");
            }
        } catch { showToast("Network error", "error"); }
        finally { setSaving(false); }
    };

    // ── SEO Score ──
    const seoScore = (() => {
        let s = 0;
        const t = form.metaTitle || form.title;
        if (t.length >= 30 && t.length <= 60) s += 20; else if (t.length > 0) s += 10;
        const d = form.metaDescription || form.excerpt;
        if (d.length >= 120 && d.length <= 160) s += 20; else if (d.length > 0) s += 10;
        if (form.metaKeywords.length > 0) s += 15;
        if (form.coverImage || form.ogImage) s += 15;
        if (form.content.length > 300) s += 15; else if (form.content.length > 0) s += 5;
        if (form.category) s += 5;
        if (form.tags.length > 0) s += 5;
        if (form.excerpt.length > 0) s += 5;
        return Math.min(100, s);
    })();

    const plainText = form.content.replace(/<[^>]*>/g, "");
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const charCount = plainText.length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const metaTitleLen = (form.metaTitle || form.title).length;
    const metaDescLen = (form.metaDescription || form.excerpt).length;

    // Sidebar content (shared between desktop inline + mobile overlay)
    const sidebarContent = (
        <div className="min-w-0">
            {/* ── Publish ── */}
            <SidebarSection title="Publish" icon={Send} defaultOpen={true}>
                <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                    <div>
                        <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Status</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {form.published ? "Visible to everyone" : "Only visible to you"}
                        </p>
                    </div>
                    <button onClick={() => updateField("published", !form.published)}
                        className="w-12 h-6 rounded-full transition-colors relative flex-shrink-0"
                        style={{ background: form.published ? "#22c55e" : "var(--border-primary)" }}>
                        <motion.div className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-md"
                            animate={{ left: form.published ? 26 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
                    <div>
                        <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Featured</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Pin to homepage spotlight</p>
                    </div>
                    <button onClick={() => updateField("featured", !form.featured)}
                        className="w-12 h-6 rounded-full transition-colors relative flex-shrink-0"
                        style={{ background: form.featured ? "#f59e0b" : "var(--border-primary)" }}>
                        <motion.div className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-md"
                            animate={{ left: form.featured ? 26 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    </button>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                        <Calendar className="w-3 h-3 inline mr-1 -mt-0.5" /> Schedule
                    </label>
                    <input type="datetime-local" value={form.publishedAt}
                        onChange={e => updateField("publishedAt", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties} />
                </div>
            </SidebarSection>

            {/* ── Organization ── */}
            <SidebarSection title="Organization" icon={FileText} defaultOpen={true}>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Category</label>
                    <select value={form.category} onChange={e => updateField("category", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties}>
                        <option value="">Select category...</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Tags</label>
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); updateField("tags", [...form.tags, tagInput.trim()]); setTagInput(""); } }}
                        placeholder="Press Enter to add tag"
                        className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties} />
                    {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {form.tags.map((t, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                                    style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                                    {t}
                                    <button onClick={() => updateField("tags", form.tags.filter((_, j) => j !== i))}><X className="w-2.5 h-2.5" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </SidebarSection>

            {/* ── SEO ── */}
            <SidebarSection title="SEO Optimization" icon={Globe} defaultOpen={!isMobile}>
                <SeoScoreRing score={seoScore} />

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Meta Title</label>
                        <span className="text-[10px] font-bold" style={{ color: metaTitleLen > 60 ? "#ef4444" : metaTitleLen >= 30 ? "#22c55e" : "var(--text-muted)" }}>
                            {metaTitleLen}/60
                        </span>
                    </div>
                    <input type="text" value={form.metaTitle} onChange={e => updateField("metaTitle", e.target.value)}
                        placeholder={form.title || "Custom title for search engines..."}
                        maxLength={70}
                        className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties} />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Meta Description</label>
                        <span className="text-[10px] font-bold" style={{ color: metaDescLen > 160 ? "#ef4444" : metaDescLen >= 120 ? "#22c55e" : "var(--text-muted)" }}>
                            {metaDescLen}/160
                        </span>
                    </div>
                    <textarea value={form.metaDescription} onChange={e => updateField("metaDescription", e.target.value)}
                        placeholder={form.excerpt || "Custom description for search engines..."} rows={3} maxLength={320}
                        className="w-full px-3 py-2.5 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties} />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Target Keywords</label>
                    <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && keywordInput.trim()) { e.preventDefault(); updateField("metaKeywords", [...form.metaKeywords, keywordInput.trim()]); setKeywordInput(""); } }}
                        placeholder="Press Enter to add"
                        className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties} />
                    {form.metaKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {form.metaKeywords.map((k, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                                    style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
                                    {k}
                                    <button onClick={() => updateField("metaKeywords", form.metaKeywords.filter((_, j) => j !== i))}><X className="w-2.5 h-2.5" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Google SERP Preview ── */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                        <Eye className="w-3 h-3 inline mr-1 -mt-0.5" /> Google Preview
                    </label>
                    <div className="p-3 sm:p-4 rounded-xl space-y-1.5" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}>
                        <p className="text-sm font-medium truncate" style={{ color: "#1a0dab" }}>
                            {(form.metaTitle || form.title || "Your Post Title").slice(0, 60)}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "#006621" }}>
                            shotlin.com › blog › {form.title ? form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 30) : "your-post-slug"}
                        </p>
                        <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: "#545454" }}>
                            {(form.metaDescription || form.excerpt || "Add a description to improve search visibility...").slice(0, 160)}
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Canonical URL</label>
                    <input type="url" value={form.canonicalUrl} onChange={e => updateField("canonicalUrl", e.target.value)}
                        placeholder="https://example.com/your-post"
                        className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties} />
                </div>
            </SidebarSection>

            {/* ── Social / OG ── */}
            <SidebarSection title="Social Sharing" icon={ExternalLink} defaultOpen={false}>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>OG Image (1200×630)</label>
                    {form.ogImage ? (
                        <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
                            <img src={form.ogImage} alt="OG" className="w-full h-32 object-cover" />
                            <button onClick={() => removeImage("ogImage")}
                                className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-black/80">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--accent)]"
                            style={{ borderColor: "var(--border-primary)", background: "var(--bg-input)" }}>
                            <Upload className="w-5 h-5 mb-1" style={{ color: "var(--text-muted)" }} />
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Upload OG image</span>
                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                                const f = e.target.files?.[0]; if (f) handleImageSelect(f, "ogImage");
                            }} />
                        </label>
                    )}
                </div>
            </SidebarSection>

            {/* ── Advanced ── */}
            <SidebarSection title="Advanced" icon={Code} defaultOpen={false}>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>JSON-LD Structured Data</label>
                    <textarea value={form.structuredData} onChange={e => updateField("structuredData", e.target.value)}
                        rows={6} placeholder='{"@context": "https://schema.org", ...}'
                        className="w-full px-3 py-2.5 rounded-xl text-[11px] font-mono resize-y focus:outline-none focus:ring-2 transition-all"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties} />
                </div>
            </SidebarSection>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
            {/* ─── Toast ─── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        className="fixed top-5 left-4 right-4 sm:left-auto sm:right-5 z-[100] px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-semibold backdrop-blur-xl sm:max-w-md"
                        style={{
                            background: toast.type === "success" ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))" : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
                            color: toast.type === "success" ? "#22c55e" : "#ef4444",
                            border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}
                    >
                        {toast.type === "success" ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        <span className="truncate">{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Top Toolbar ─── */}
            <div
                className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 backdrop-blur-xl"
                style={{ background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)", borderBottom: "1px solid var(--border-subtle)" }}
            >
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={() => router.push("/dashboard/blog")}
                        className="p-2 rounded-xl transition-all hover:bg-[var(--bg-surface-hover)] hover:scale-105"
                    >
                        <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                    </button>
                    <div className="hidden sm:flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                        <span>Blog</span>
                        <ChevronRight className="w-3 h-3" />
                        <span style={{ color: "var(--text-primary)" }}>New Post</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {/* Sidebar Toggle */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 sm:p-2.5 rounded-xl transition-all hover:bg-[var(--bg-surface-hover)]"
                        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    >
                        {sidebarOpen ? <PanelRightClose className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: "var(--text-muted)" }} /> : <PanelRightOpen className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: "var(--text-muted)" }} />}
                    </button>

                    {/* Save Draft */}
                    <button
                        onClick={() => savePost(false)} disabled={saving}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="hidden sm:inline">Save Draft</span>
                    </button>

                    {/* Publish */}
                    <button
                        onClick={() => savePost(true)} disabled={saving}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                        style={{
                            background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, #7c3aed))",
                            boxShadow: "0 4px 20px rgba(var(--accent-rgb, 99, 102, 241), 0.3)",
                        }}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden xs:inline">Publish</span>
                    </button>
                </div>
            </div>

            {/* ─── Main Content Area ─── */}
            <div className="flex-1 flex min-h-0 relative">
                {/* ─── LEFT: Editor ─── */}
                <div className="flex-1 overflow-y-auto transition-all duration-300">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

                        {/* ── Cover Image ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-6 sm:mb-8"
                        >
                            {form.coverImage ? (
                                <div
                                    className="relative rounded-2xl overflow-hidden group cursor-pointer"
                                    onMouseEnter={() => setCoverHover(true)}
                                    onMouseLeave={() => setCoverHover(false)}
                                >
                                    <img src={form.coverImage} alt="Cover" className="w-full h-48 sm:h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                    <AnimatePresence>
                                        {coverHover && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 backdrop-blur-sm"
                                            >
                                                <button
                                                    onClick={() => coverInputRef.current?.click()}
                                                    className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:scale-105"
                                                    style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
                                                >
                                                    <Upload className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Replace
                                                </button>
                                                <button
                                                    onClick={() => removeImage("coverImage")}
                                                    className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:scale-105"
                                                    style={{ background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.4)" }}
                                                >
                                                    <X className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Remove
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div
                                    onClick={() => coverInputRef.current?.click()}
                                    className="relative rounded-2xl border-2 border-dashed h-40 sm:h-48 md:h-56 flex flex-col items-center justify-center cursor-pointer group transition-all hover:border-[var(--accent)]"
                                    style={{ borderColor: "var(--border-primary)", background: "var(--bg-input)" }}
                                >
                                    {uploading ? (
                                        <Loader2 className="w-8 sm:w-10 h-8 sm:h-10 animate-spin" style={{ color: "var(--accent)" }} />
                                    ) : (
                                        <>
                                            <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                                                style={{ background: "var(--accent-soft)" }}>
                                                <ImageIcon className="w-6 sm:w-7 h-6 sm:h-7" style={{ color: "var(--accent)" }} />
                                            </div>
                                            <p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Add Cover Image</p>
                                            <p className="text-[10px] sm:text-xs text-center px-4" style={{ color: "var(--text-muted)" }}>Drag & drop or click • 1200x630px</p>
                                        </>
                                    )}
                                </div>
                            )}
                            <input
                                ref={coverInputRef} type="file" className="hidden" accept="image/*"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f, "coverImage"); }}
                            />
                        </motion.div>

                        {/* ── Title ── */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                            <input
                                type="text" value={form.title}
                                onChange={e => updateField("title", e.target.value)}
                                placeholder="Post title..."
                                className="w-full text-2xl sm:text-3xl md:text-4xl font-extrabold bg-transparent border-none outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-40 tracking-tight leading-tight"
                                style={{ color: "var(--text-primary)", caretColor: "var(--accent)" }}
                            />
                        </motion.div>

                        {/* ── Excerpt ── */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-3 sm:mt-4">
                            <textarea
                                value={form.excerpt}
                                onChange={e => updateField("excerpt", e.target.value)}
                                placeholder="Write a brief summary that hooks readers..."
                                rows={2} maxLength={500}
                                className="w-full text-base sm:text-lg bg-transparent border-none outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-30 resize-none leading-relaxed"
                                style={{ color: "var(--text-secondary)", caretColor: "var(--accent)" }}
                            />
                        </motion.div>

                        {/* ── Divider ── */}
                        <div className="my-4 sm:my-6 border-t" style={{ borderColor: "var(--border-subtle)" }} />

                        {/* ── Rich Text Content Editor ── */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <RichTextEditor
                                value={form.content}
                                onChange={(html) => updateField("content", html)}
                                placeholder="Start writing your story..."
                                onImageUpload={uploadContentImage}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* ─── RIGHT: Settings Sidebar ─── */}

                {/* Desktop: inline sidebar */}
                <AnimatePresence>
                    {sidebarOpen && !isMobile && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex-shrink-0 overflow-y-auto overflow-x-hidden hidden lg:block"
                            style={{ borderLeft: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
                        >
                            <div className="min-w-[380px]">
                                {sidebarContent}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Mobile: full-screen overlay sidebar */}
                <AnimatePresence>
                    {sidebarOpen && isMobile && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                                onClick={() => setSidebarOpen(false)}
                            />
                            {/* Sidebar panel */}
                            <motion.aside
                                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[380px] overflow-y-auto"
                                style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border-subtle)" }}
                            >
                                {/* Mobile sidebar header */}
                                <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-xl"
                                    style={{ background: "color-mix(in srgb, var(--bg-surface) 90%, transparent)", borderBottom: "1px solid var(--border-subtle)" }}>
                                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Post Settings</h3>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-2 rounded-xl transition-colors hover:bg-[var(--bg-surface-hover)]"
                                    >
                                        <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                                    </button>
                                </div>
                                {sidebarContent}
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
