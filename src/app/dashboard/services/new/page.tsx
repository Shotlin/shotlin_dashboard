"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Save, Eye, Loader2, Check, AlertCircle, Plus, Trash2, X,
    GripVertical, Sparkles, Globe, Tag, DollarSign, Settings, FileText,
    Search, Star, Zap, ChevronDown, Image as ImageIcon,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const ICON_OPTIONS = [
    "Code", "Bot", "MessageSquare", "Database", "LineChart",
    "Smartphone", "Globe", "Shield", "Zap", "Palette",
    "Camera", "Mail", "Cloud", "Cpu", "Server",
];
const COLOR_OPTIONS = [
    { name: "blue", label: "Blue", bg: "bg-blue-500" },
    { name: "purple", label: "Purple", bg: "bg-purple-500" },
    { name: "green", label: "Green", bg: "bg-emerald-500" },
    { name: "orange", label: "Orange", bg: "bg-amber-500" },
    { name: "pink", label: "Pink", bg: "bg-pink-500" },
];
const PRICING_TYPES = ["FIXED", "CUSTOM", "CONTACT"];

const TABS = [
    { id: "basic", label: "Basic Info", icon: <FileText className="w-4 h-4" /> },
    { id: "content", label: "Content", icon: <Settings className="w-4 h-4" /> },
    { id: "gallery", label: "Gallery", icon: <ImageIcon className="w-4 h-4" /> },
    { id: "offer", label: "Limited Offer", icon: <Sparkles className="w-4 h-4" /> },
    { id: "hero", label: "Hero & Detail", icon: <Star className="w-4 h-4" /> },
    { id: "seo", label: "SEO", icon: <Search className="w-4 h-4" /> },
    { id: "pricing", label: "Pricing & Publish", icon: <DollarSign className="w-4 h-4" /> },
];

interface ServiceForm {
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    coverImage: string;
    sortOrder: number;
    benefits: string[];
    technologies: string[];
    deliverables: string[];
    faq: { q: string; a: string }[];
    limitedOffer: {
        badge: string;
        title: string;
        subtitle: string;
        price: number;
        currency: string;
        appTypes: { name: string; icon: string; example: string }[];
        ctaText: string;
        active: boolean;
    };
    heroHeadline: string;
    heroSubheadline: string;
    heroCtaText: string;
    heroCtaPrice: string;
    heroUrgencyText: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    canonicalUrl: string;
    ogImage: string;
    structuredData: string;
    whatsappUrl: string;
    price: number | null;
    currency: string;
    pricingType: string;
    stats: { value: string; label: string }[];
    comparison: { struggles: string[]; solutions: string[] };
    hasDetailPage: boolean;
    published: boolean;
    featured: boolean;
    demoImages: string[];
}

const DEFAULT_FORM: ServiceForm = {
    title: "", subtitle: "", description: "", icon: "Code", color: "blue",
    coverImage: "", sortOrder: 0,
    benefits: [], technologies: [], deliverables: [],
    faq: [],
    limitedOffer: { badge: "LIMITED OFFER", title: "", subtitle: "", price: 0, currency: "INR", appTypes: [], ctaText: "Get Started", active: false },
    heroHeadline: "", heroSubheadline: "", heroCtaText: "", heroCtaPrice: "", heroUrgencyText: "",
    metaTitle: "", metaDescription: "", metaKeywords: [], canonicalUrl: "", ogImage: "", structuredData: "",
    whatsappUrl: "",
    price: null, currency: "INR", pricingType: "FIXED",
    stats: [], comparison: { struggles: [], solutions: [] },
    hasDetailPage: false, published: false, featured: false,
    demoImages: [],
};

export default function ServiceEditorPage() {
    const router = useRouter();
    const params = useParams();
    const editId = params?.id as string | undefined;
    const isEditing = !!editId;

    const [form, setForm] = useState<ServiceForm>({ ...DEFAULT_FORM });
    const [activeTab, setActiveTab] = useState("basic");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const apiHeaders = () => ({ "Content-Type": "application/json" });

    const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // Load service if editing
    useEffect(() => {
        if (!isEditing) return;
        setLoading(true);
        (async () => {
            try {
                const res = await fetch(`${API_URL}/services/admin/all`, {
                    headers: apiHeaders(),
                    credentials: "include"
                });
                const json = await res.json();
                if (json.status === "success") {
                    const svc = json.data.find((s: any) => s.id === editId);
                    if (svc) {
                        setForm({
                            title: svc.title || "",
                            subtitle: svc.subtitle || "",
                            description: svc.description || "",
                            icon: svc.icon || "Code",
                            color: svc.color || "blue",
                            coverImage: svc.coverImage || "",
                            sortOrder: svc.sortOrder || 0,
                            benefits: svc.benefits || [],
                            technologies: svc.technologies || [],
                            deliverables: svc.deliverables || [],
                            faq: svc.faq || [],
                            limitedOffer: svc.limitedOffer || DEFAULT_FORM.limitedOffer,
                            heroHeadline: svc.heroHeadline || "",
                            heroSubheadline: svc.heroSubheadline || "",
                            heroCtaText: svc.heroCtaText || "",
                            heroCtaPrice: svc.heroCtaPrice || "",
                            heroUrgencyText: svc.heroUrgencyText || "",
                            metaTitle: svc.metaTitle || "",
                            metaDescription: svc.metaDescription || "",
                            metaKeywords: svc.metaKeywords || [],
                            canonicalUrl: svc.canonicalUrl || "",
                            ogImage: svc.ogImage || "",
                            structuredData: svc.structuredData || "",
                            price: svc.price ?? null,
                            currency: svc.currency || "INR",
                            pricingType: svc.pricingType || "FIXED",
                            stats: svc.stats || [],
                            comparison: svc.comparison || { struggles: [], solutions: [] },
                            hasDetailPage: svc.hasDetailPage || false,
                            published: svc.published || false,
                            featured: svc.featured || false,
                            whatsappUrl: svc.whatsappUrl || "",
                            demoImages: svc.demoImages || [],
                        });
                    }
                }
            } catch { showToast("Failed to load service", "error"); }
            finally { setLoading(false); }
        })();
    }, [editId]);

    const handleSave = async () => {
        if (!form.title.trim()) { showToast("Title is required", "error"); return; }
        if (!form.description.trim()) { showToast("Description is required", "error"); return; }
        setSaving(true);
        try {
            const payload: Record<string, any> = { ...form };
            // Clean nulls
            if (!payload.coverImage) delete payload.coverImage;
            if (!payload.canonicalUrl) delete payload.canonicalUrl;
            if (!payload.ogImage) delete payload.ogImage;
            if (payload.price === null || payload.price === 0) delete payload.price;
            // if (!payload.limitedOffer?.active) payload.limitedOffer = undefined; // Fixed: Don't remove, let it update to false

            const url = isEditing ? `${API_URL}/services/${editId}` : `${API_URL}/services`;
            const method = isEditing ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: apiHeaders(),
                credentials: "include",
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.text();
                console.error("Save failed:", res.status, err);
                throw new Error("Save failed");
            }
            showToast(isEditing ? "Service updated!" : "Service created!");
            setTimeout(() => router.push("/dashboard/services"), 1000);
        } catch {
            showToast("Failed to save service", "error");
        } finally { setSaving(false); }
    };

    const updateForm = (key: keyof ServiceForm, val: any) => setForm(prev => ({ ...prev, [key]: val }));

    // ── Helpers for dynamic lists ──
    const addToList = (key: "benefits" | "technologies" | "deliverables" | "metaKeywords") => {
        setForm(prev => ({ ...prev, [key]: [...(prev[key] as string[]), ""] }));
    };
    const updateListItem = (key: "benefits" | "technologies" | "deliverables" | "metaKeywords", idx: number, val: string) => {
        setForm(prev => {
            const arr = [...(prev[key] as string[])];
            arr[idx] = val;
            return { ...prev, [key]: arr };
        });
    };
    const removeListItem = (key: "benefits" | "technologies" | "deliverables" | "metaKeywords", idx: number) => {
        setForm(prev => {
            const arr = [...(prev[key] as string[])];
            arr.splice(idx, 1);
            return { ...prev, [key]: arr };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between px-4 md:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/dashboard/services")}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">{isEditing ? "Edit Service" : "Create Service"}</h1>
                            <p className="text-xs text-gray-500">{form.title || "Untitled Service"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateForm("published", !form.published)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.published ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-gray-400 border border-white/10"
                                }`}>
                            <Eye className="w-4 h-4 inline mr-1.5" />
                            {form.published ? "Published" : "Draft"}
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? "Saving..." : "Save"}
                        </motion.button>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 px-4 md:px-8 overflow-x-auto scrollbar-hide pb-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-white text-black" : "text-gray-400 hover:bg-white/5"
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "basic" && <BasicInfoTab form={form} updateForm={updateForm} />}
                        {activeTab === "content" && (
                            <ContentTab form={form} updateForm={updateForm}
                                addToList={addToList} updateListItem={updateListItem} removeListItem={removeListItem} />
                        )}
                        {activeTab === "gallery" && (
                            <GalleryTab form={form} updateForm={updateForm}
                                addToList={addToList} updateListItem={updateListItem} removeListItem={removeListItem} />
                        )}
                        {activeTab === "offer" && <LimitedOfferTab form={form} updateForm={updateForm} />}
                        {activeTab === "hero" && <HeroDetailTab form={form} updateForm={updateForm} />}
                        {activeTab === "seo" && (
                            <SEOTab form={form} updateForm={updateForm}
                                addToList={addToList} updateListItem={updateListItem} removeListItem={removeListItem} />
                        )}
                        {activeTab === "pricing" && <PricingTab form={form} updateForm={updateForm} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 20, x: "-50%" }}
                        className={`fixed bottom-8 left-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium ${toast.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-red-500/10 border-red-500/20 text-red-300"
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

/* ═══════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 mb-6">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
            {!description && <div className="mb-5" />}
            {children}
        </div>
    );
}

function InputField({ label, value, onChange, placeholder, maxLength, type = "text", inputClassName = "" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; type?: string; inputClassName?: string;
}) {
    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                {maxLength && <span className={`text-xs ${(value?.length || 0) > maxLength ? "text-red-400" : "text-gray-600"}`}>{value?.length || 0}/{maxLength}</span>}
            </div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-colors placeholder:text-gray-600 ${inputClassName}`}
            />
        </div>
    );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 4, maxLength }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; maxLength?: number;
}) {
    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                {maxLength && <span className={`text-xs ${(value?.length || 0) > maxLength ? "text-red-400" : "text-gray-600"}`}>{value?.length || 0}/{maxLength}</span>}
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-colors placeholder:text-gray-600 resize-none"
            />
        </div>
    );
}

function DynamicStringList({ label, items, onAdd, onUpdate, onRemove, placeholder }: {
    label: string; items: string[]; onAdd: () => void; onUpdate: (i: number, v: string) => void; onRemove: (i: number) => void; placeholder?: string;
}) {
    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                <button onClick={onAdd} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="text-gray-600 cursor-grab"><GripVertical className="w-4 h-4" /></div>
                        <input
                            value={item}
                            onChange={(e) => onUpdate(i, e.target.value)}
                            placeholder={placeholder || `Item ${i + 1}`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                        />
                        <button onClick={() => onRemove(i)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-sm text-gray-600 py-2">No items yet. Click "Add" to create one.</p>
                )}
            </div>
        </div>
    );
}

function ToggleSwitch({ label, description, checked, onChange }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-3">
            <div>
                <div className="text-sm font-medium text-gray-300">{label}</div>
                {description && <div className="text-xs text-gray-600">{description}</div>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-white/10"}`}
            >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 1: BASIC INFO
   ═══════════════════════════════════════════════════════════════════════ */

function BasicInfoTab({ form, updateForm }: { form: ServiceForm; updateForm: (k: keyof ServiceForm, v: any) => void }) {
    return (
        <>
            <SectionCard title="Service Identity" description="Core information about your service">
                <InputField label="Title *" value={form.title} onChange={v => updateForm("title", v)} placeholder="e.g. Website & App Development" maxLength={200} />
                <InputField label="Subtitle" value={form.subtitle} onChange={v => updateForm("subtitle", v)} placeholder="e.g. Custom-built digital experiences" maxLength={300} />
                <TextAreaField label="Description *" value={form.description} onChange={v => updateForm("description", v)} placeholder="Describe what this service offers..." rows={4} />
            </SectionCard>

            <SectionCard title="Appearance" description="Visual identity of the service">
                {/* Icon Picker */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Icon</label>
                    <div className="flex flex-wrap gap-2">
                        {ICON_OPTIONS.map(icon => (
                            <button
                                key={icon}
                                onClick={() => updateForm("icon", icon)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${form.icon === icon ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
                                    }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Picker */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Theme Color</label>
                    <div className="flex gap-3">
                        {COLOR_OPTIONS.map(c => (
                            <button
                                key={c.name}
                                onClick={() => updateForm("color", c.name)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${form.color === c.name ? "bg-white/10 border border-white/20 ring-2 ring-white/20" : "bg-white/5 border border-white/5"
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full ${c.bg}`} />
                                <span className="text-xs text-gray-300">{c.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cover Image */}
                <InputField label="Cover Image URL" value={form.coverImage} onChange={v => updateForm("coverImage", v)} placeholder="https://..." />
                {form.coverImage && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                        <img src={form.coverImage} alt="Preview" className="w-full h-48 object-cover" />
                    </div>
                )}

                <InputField label="Sort Order" value={String(form.sortOrder)} onChange={v => updateForm("sortOrder", parseInt(v) || 0)} type="number" />
            </SectionCard>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 2: CONTENT SECTIONS
   ═══════════════════════════════════════════════════════════════════════ */

function ContentTab({ form, updateForm, addToList, updateListItem, removeListItem }: {
    form: ServiceForm;
    updateForm: (k: keyof ServiceForm, v: any) => void;
    addToList: (k: "benefits" | "technologies" | "deliverables" | "metaKeywords") => void;
    updateListItem: (k: "benefits" | "technologies" | "deliverables" | "metaKeywords", i: number, v: string) => void;
    removeListItem: (k: "benefits" | "technologies" | "deliverables" | "metaKeywords", i: number) => void;
}) {
    return (
        <>
            <SectionCard title="Key Benefits" description="What clients get from this service">
                <DynamicStringList
                    label="Benefits"
                    items={form.benefits}
                    onAdd={() => addToList("benefits")}
                    onUpdate={(i, v) => updateListItem("benefits", i, v)}
                    onRemove={(i) => removeListItem("benefits", i)}
                    placeholder="e.g. Responsive design for all devices"
                />
            </SectionCard>

            <SectionCard title="Technologies" description="Tech stack used for this service">
                <DynamicStringList
                    label="Technologies"
                    items={form.technologies}
                    onAdd={() => addToList("technologies")}
                    onUpdate={(i, v) => updateListItem("technologies", i, v)}
                    onRemove={(i) => removeListItem("technologies", i)}
                    placeholder="e.g. React, Next.js, TypeScript"
                />
            </SectionCard>

            <SectionCard title="Deliverables" description="What's included in the package">
                <DynamicStringList
                    label="Deliverables"
                    items={form.deliverables}
                    onAdd={() => addToList("deliverables")}
                    onUpdate={(i, v) => updateListItem("deliverables", i, v)}
                    onRemove={(i) => removeListItem("deliverables", i)}
                    placeholder="e.g. Custom Frontend, Secure Backend"
                />
            </SectionCard>

            <SectionCard title="Stats Cards" description="Key metrics to highlight">
                <div className="space-y-3">
                    {form.stats.map((stat, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                value={stat.value}
                                onChange={(e) => {
                                    const arr = [...form.stats]; arr[i] = { ...arr[i], value: e.target.value };
                                    updateForm("stats", arr);
                                }}
                                placeholder="20+"
                                className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                            />
                            <input
                                value={stat.label}
                                onChange={(e) => {
                                    const arr = [...form.stats]; arr[i] = { ...arr[i], label: e.target.value };
                                    updateForm("stats", arr);
                                }}
                                placeholder="Hours Saved / Week"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                            />
                            <button onClick={() => { const arr = [...form.stats]; arr.splice(i, 1); updateForm("stats", arr); }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => updateForm("stats", [...form.stats, { value: "", label: "" }])}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Plus className="w-3 h-3" /> Add Stat</button>
                </div>
            </SectionCard>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 3: LIMITED OFFER
   ═══════════════════════════════════════════════════════════════════════ */

function LimitedOfferTab({ form, updateForm }: { form: ServiceForm; updateForm: (k: keyof ServiceForm, v: any) => void }) {
    const offer = form.limitedOffer;
    const setOffer = (key: string, val: any) => {
        updateForm("limitedOffer", { ...offer, [key]: val });
    };

    return (
        <>
            <SectionCard title="Limited Offer" description="Special promotional offer for this service">
                <ToggleSwitch
                    label="Enable Limited Offer"
                    description="Show a special offer banner on the service page"
                    checked={offer.active}
                    onChange={(v) => setOffer("active", v)}
                />
            </SectionCard>

            {offer.active && (
                <>
                    <SectionCard title="Offer Details" description="Configure the promotional banner">
                        <InputField label="Badge Text" value={offer.badge} onChange={v => setOffer("badge", v)} placeholder="LIMITED OFFER" />
                        <InputField label="Offer Title" value={offer.title} onChange={v => setOffer("title", v)} placeholder="Build Your Dream App." />
                        <InputField label="Offer Subtitle" value={offer.subtitle} onChange={v => setOffer("subtitle", v)}
                            placeholder="From food delivery to ed-tech. Production-ready code." />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Offer Price" value={String(offer.price || "")} onChange={v => setOffer("price", parseFloat(v) || 0)} type="number" />
                            <InputField label="Currency" value={offer.currency} onChange={v => setOffer("currency", v)} placeholder="INR" />
                        </div>
                        <InputField label="CTA Button Text" value={offer.ctaText} onChange={v => setOffer("ctaText", v)} placeholder="Get Started" />
                    </SectionCard>

                    <SectionCard title="App Types / Use Cases" description="Examples shown in the offer marquee">
                        <div className="space-y-3">
                            {offer.appTypes.map((app, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        value={app.name}
                                        onChange={(e) => {
                                            const arr = [...offer.appTypes]; arr[i] = { ...arr[i], name: e.target.value };
                                            setOffer("appTypes", arr);
                                        }}
                                        placeholder="Food Delivery"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                                    />
                                    <input
                                        value={app.example}
                                        onChange={(e) => {
                                            const arr = [...offer.appTypes]; arr[i] = { ...arr[i], example: e.target.value };
                                            setOffer("appTypes", arr);
                                        }}
                                        placeholder="Like Zomato"
                                        className="w-36 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                                    />
                                    <button onClick={() => { const arr = [...offer.appTypes]; arr.splice(i, 1); setOffer("appTypes", arr); }}
                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                            <button onClick={() => setOffer("appTypes", [...offer.appTypes, { name: "", icon: "", example: "" }])}
                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Plus className="w-3 h-3" /> Add App Type</button>
                        </div>
                    </SectionCard>
                </>
            )}
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 4: HERO & DETAIL PAGE
   ═══════════════════════════════════════════════════════════════════════ */

function HeroDetailTab({ form, updateForm }: { form: ServiceForm; updateForm: (k: keyof ServiceForm, v: any) => void }) {
    return (
        <>
            <SectionCard title="Detail Page" description="Enable a dedicated page for this service">
                <ToggleSwitch
                    label="Enable Detail Page"
                    description="Create a dedicated detail page with hero, features, FAQ, etc."
                    checked={form.hasDetailPage}
                    onChange={v => updateForm("hasDetailPage", v)}
                />
            </SectionCard>

            {form.hasDetailPage && (
                <>
                    <SectionCard title="Hero Section" description="Top of the detail page">
                        <InputField label="Hero Headline" value={form.heroHeadline} onChange={v => updateForm("heroHeadline", v)}
                            placeholder="Don't Just Run a Business. Dominate It." maxLength={300} />
                        <TextAreaField label="Hero Sub-headline" value={form.heroSubheadline} onChange={v => updateForm("heroSubheadline", v)}
                            placeholder="Stop trading time for money..." maxLength={500} rows={3} />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="CTA Button Text" value={form.heroCtaText} onChange={v => updateForm("heroCtaText", v)} placeholder="Automate My Business" />
                            <InputField label="CTA Price Text" value={form.heroCtaPrice} onChange={v => updateForm("heroCtaPrice", v)} placeholder="₹30k" />
                        </div>
                        <InputField label="Urgency Text" value={form.heroUrgencyText} onChange={v => updateForm("heroUrgencyText", v)} placeholder="Limited slots for Feb" />
                    </SectionCard>

                    <SectionCard title="Comparison Section" description="Before vs After comparison">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-red-400 mb-2 block">❌ Struggles (Without You)</label>
                                <div className="space-y-2">
                                    {form.comparison.struggles.map((s, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input value={s} onChange={(e) => {
                                                const arr = [...form.comparison.struggles]; arr[i] = e.target.value;
                                                updateForm("comparison", { ...form.comparison, struggles: arr });
                                            }} placeholder="e.g. Chasing clients manually"
                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20" />
                                            <button onClick={() => {
                                                const arr = [...form.comparison.struggles]; arr.splice(i, 1);
                                                updateForm("comparison", { ...form.comparison, struggles: arr });
                                            }} className="p-1 text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => updateForm("comparison", { ...form.comparison, struggles: [...form.comparison.struggles, ""] })}
                                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"><Plus className="w-3 h-3" /> Add</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-green-400 mb-2 block">✅ Solutions (With You)</label>
                                <div className="space-y-2">
                                    {form.comparison.solutions.map((s, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input value={s} onChange={(e) => {
                                                const arr = [...form.comparison.solutions]; arr[i] = e.target.value;
                                                updateForm("comparison", { ...form.comparison, solutions: arr });
                                            }} placeholder="e.g. Leads flow in automatically"
                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20" />
                                            <button onClick={() => {
                                                const arr = [...form.comparison.solutions]; arr.splice(i, 1);
                                                updateForm("comparison", { ...form.comparison, solutions: arr });
                                            }} className="p-1 text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => updateForm("comparison", { ...form.comparison, solutions: [...form.comparison.solutions, ""] })}
                                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"><Plus className="w-3 h-3" /> Add</button>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="FAQ" description="Frequently asked questions">
                        <div className="space-y-4">
                            {form.faq.map((item, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <input
                                            value={item.q}
                                            onChange={(e) => {
                                                const arr = [...form.faq]; arr[i] = { ...arr[i], q: e.target.value };
                                                updateForm("faq", arr);
                                            }}
                                            placeholder="Question"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-white/20"
                                        />
                                        <button onClick={() => { const arr = [...form.faq]; arr.splice(i, 1); updateForm("faq", arr); }}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                                    </div>
                                    <textarea
                                        value={item.a}
                                        onChange={(e) => {
                                            const arr = [...form.faq]; arr[i] = { ...arr[i], a: e.target.value };
                                            updateForm("faq", arr);
                                        }}
                                        placeholder="Answer"
                                        rows={2}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20 resize-none"
                                    />
                                </div>
                            ))}
                            <button onClick={() => updateForm("faq", [...form.faq, { q: "", a: "" }])}
                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Plus className="w-3 h-3" /> Add FAQ</button>
                        </div>
                    </SectionCard>
                </>
            )}
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 5: SEO
   ═══════════════════════════════════════════════════════════════════════ */

function SEOTab({ form, updateForm, addToList, updateListItem, removeListItem }: {
    form: ServiceForm;
    updateForm: (k: keyof ServiceForm, v: any) => void;
    addToList: (k: "benefits" | "technologies" | "deliverables" | "metaKeywords") => void;
    updateListItem: (k: "benefits" | "technologies" | "deliverables" | "metaKeywords", i: number, v: string) => void;
    removeListItem: (k: "benefits" | "technologies" | "deliverables" | "metaKeywords", i: number) => void;
}) {
    return (
        <>
            <SectionCard title="Search Engine Optimization" description="Optimize how this service appears in search results">
                <InputField label="Meta Title" value={form.metaTitle} onChange={v => updateForm("metaTitle", v)}
                    placeholder="Web & App Development | Shotlin" maxLength={70} />
                <TextAreaField label="Meta Description" value={form.metaDescription} onChange={v => updateForm("metaDescription", v)}
                    placeholder="Premium website and app development services..." maxLength={320} rows={3} />
                <DynamicStringList
                    label="Meta Keywords"
                    items={form.metaKeywords}
                    onAdd={() => addToList("metaKeywords")}
                    onUpdate={(i, v) => updateListItem("metaKeywords", i, v)}
                    onRemove={(i) => removeListItem("metaKeywords", i)}
                    placeholder="e.g. web development"
                />
            </SectionCard>

            <SectionCard title="Open Graph & Social" description="How the service appears when shared">
                <InputField label="Canonical URL" value={form.canonicalUrl} onChange={v => updateForm("canonicalUrl", v)}
                    placeholder="https://shotlin.com/services/web-development" />
                <InputField label="OG Image URL" value={form.ogImage} onChange={v => updateForm("ogImage", v)}
                    placeholder="https://..." />
                {form.ogImage && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                        <img src={form.ogImage} alt="OG Preview" className="w-full h-40 object-cover" />
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Structured Data" description="JSON-LD schema for rich search results">
                <TextAreaField label="JSON-LD" value={form.structuredData} onChange={v => updateForm("structuredData", v)}
                    placeholder='{"@context":"https://schema.org",...}' rows={6} />
            </SectionCard>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 6: PRICING & PUBLISHING
   ═══════════════════════════════════════════════════════════════════════ */

function PricingTab({ form, updateForm }: { form: ServiceForm; updateForm: (k: keyof ServiceForm, v: any) => void }) {
    return (
        <>
            <SectionCard title="Pricing" description="Set the price for this service">
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="WhatsApp URL (Get Started)" value={form.whatsappUrl} onChange={v => updateForm("whatsappUrl", v)} placeholder="https://wa.me/..." />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <InputField label="Price" value={form.price !== null ? String(form.price) : ""} onChange={v => updateForm("price", v ? parseFloat(v) : null)} type="number" />
                    <InputField label="Currency" value={form.currency} onChange={v => updateForm("currency", v)} placeholder="INR" />
                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-300 mb-1.5 block">Pricing Type</label>
                        <select
                            value={form.pricingType}
                            onChange={(e) => updateForm("pricingType", e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 text-white appearance-none"
                        >
                            {PRICING_TYPES.map(t => <option key={t} value={t} className="bg-[#1a1a24]">{t}</option>)}
                        </select>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Publishing" description="Control visibility and prominence">
                <ToggleSwitch
                    label="Published"
                    description="Make this service visible on the public website"
                    checked={form.published}
                    onChange={v => updateForm("published", v)}
                />
                <div className="border-t border-white/5" />
                <ToggleSwitch
                    label="Featured"
                    description="Highlight this service in prominent positions"
                    checked={form.featured}
                    onChange={v => updateForm("featured", v)}
                />
            </SectionCard>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 2.5: GALLERY
   ═══════════════════════════════════════════════════════════════════════ */

function GalleryTab({ form, updateForm }: {
    form: ServiceForm;
    updateForm: (k: keyof ServiceForm, v: any) => void;
    addToList: (k: any) => void;
    updateListItem: (k: any, i: number, v: string) => void;
    removeListItem: (k: any, i: number) => void;
}) {
    // Helper to update specific image in array
    const updateImage = (idx: number, val: string) => {
        const arr = [...form.demoImages];
        arr[idx] = val;
        updateForm("demoImages", arr);
    };

    const removeImage = (idx: number) => {
        const arr = [...form.demoImages];
        arr.splice(idx, 1);
        updateForm("demoImages", arr);
    };

    const addImage = () => {
        updateForm("demoImages", [...form.demoImages, ""]);
    };

    return (
        <SectionCard title="Project Gallery" description="Add demo images to showcase your work (Premium Gallery)">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {form.demoImages.map((img, i) => (
                    <div key={i} className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5 aspect-video">
                        {img ? (
                            <img src={img} alt={`Demo ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <ImageIcon className="w-8 h-8 opacity-20" />
                            </div>
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                            <div className="flex justify-end">
                                <button onClick={() => removeImage(i)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <input
                                value={img}
                                onChange={(e) => updateImage(i, e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40"
                            />
                        </div>
                    </div>
                ))}

                {/* Add Button */}
                <button
                    onClick={addImage}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] aspect-video hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                >
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 group-hover:text-gray-300">Add Image</span>
                </button>
            </div>
            <p className="text-xs text-gray-500">
                Tip: Use high-quality images (16:9 aspect ratio recommended). These will be displayed in a premium masonry layout on the service page.
            </p>
        </SectionCard>
    );
}
