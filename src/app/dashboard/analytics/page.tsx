"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, Users, Clock, MousePointerClick, Eye, TrendingUp,
    Globe, ExternalLink, Activity, RefreshCw, Zap, ArrowUpRight,
    ArrowDownRight, Smartphone, Monitor, Tablet, Radio,
    Loader2, MapPin, Chrome, Layout,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

// ── Helpers ──

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

async function authFetch(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    return res.json();
}

// ── Color Palette ──
const COLORS = {
    indigo: "#6366f1", cyan: "#06b6d4", emerald: "#10b981",
    amber: "#f59e0b", pink: "#ec4899", purple: "#8b5cf6",
    blue: "#3b82f6", rose: "#f43f5e", teal: "#14b8a6", orange: "#f97316",
};

const PIE_COLORS = [COLORS.indigo, COLORS.emerald, COLORS.amber, COLORS.pink, COLORS.cyan];
const BAR_COLORS = [COLORS.indigo, COLORS.cyan, COLORS.emerald, COLORS.amber, COLORS.pink, COLORS.purple, COLORS.blue, COLORS.rose];

const DEVICE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    desktop: Monitor, mobile: Smartphone, tablet: Tablet,
};

// ── Country Flag ──
function CountryFlag({ code }: { code: string }) {
    if (!code || code === "XX" || code === "LO" || code.length !== 2) return <Globe className="w-4 h-4" style={{ color: "var(--text-muted)" }} />;
    const flag = code
        .toUpperCase()
        .split("")
        .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
        .join("");
    return <span className="text-lg leading-none">{flag}</span>;
}

// ── Stat Card ──
function StatCard({ title, value, change, icon: Icon, gradient, delay }: {
    title: string; value: string; change: number; icon: React.ComponentType<{ className?: string }>; gradient: string; delay: number;
}) {
    const isUp = change > 0;
    const isDown = change < 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.06] -mr-8 -mt-8"
                style={{ background: gradient }} />
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: gradient }}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isUp ? "text-emerald-400 bg-emerald-400/10" :
                    isDown ? "text-red-400 bg-red-400/10" :
                        "text-amber-400 bg-amber-400/10"
                    }`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> :
                        isDown ? <ArrowDownRight className="w-3 h-3" /> : null}
                    {change > 0 ? "+" : ""}{change}%
                </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>{title}</p>
        </motion.div>
    );
}

// ── Custom Tooltip for Charts ──
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl p-3 shadow-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-[10px] font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                    <span className="text-xs font-semibold capitalize" style={{ color: "var(--text-secondary)" }}>{entry.name}:</span>
                    <span className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>{formatNumber(entry.value)}</span>
                </div>
            ))}
        </div>
    );
}

// ── Main Page ──
export default function AnalyticsPage() {
    const [range, setRange] = useState("7d");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data state
    const [stats, setStats] = useState<Record<string, number | string> | null>(null);
    const [timeSeries, setTimeSeries] = useState<{ series: Array<{ time: string; views: number; visitors: number }>; granularity: string } | null>(null);
    const [topPages, setTopPages] = useState<Array<{ path: string; title: string; views: number; avgTime: number; bounceRate: number }>>([]);
    const [geo, setGeo] = useState<Array<{ country: string; countryCode: string; visitors: number; sessions: number; percentage: number }>>([]);
    const [devices, setDevices] = useState<{ devices: Array<{ name: string; count: number; percentage: number }>; browsers: Array<{ name: string; count: number; percentage: number }>; os: Array<{ name: string; count: number; percentage: number }> } | null>(null);
    const [referrers, setReferrers] = useState<{ sources: Array<{ name: string; sessions: number; percentage: number }>; referrers: Array<{ domain: string; sessions: number; percentage: number }> } | null>(null);
    const [realtime, setRealtime] = useState<{ activeVisitors: number; activePages: Array<{ page: string; count: number }> } | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            const [statsRes, tsRes, pagesRes, geoRes, devRes, refRes, rtRes] = await Promise.all([
                authFetch(`/analytics/stats?range=${range}`),
                authFetch(`/analytics/time-series?range=${range}`),
                authFetch(`/analytics/top-pages?range=${range}`),
                authFetch(`/analytics/geo?range=${range}`),
                authFetch(`/analytics/devices?range=${range}`),
                authFetch(`/analytics/referrers?range=${range}`),
                authFetch(`/analytics/realtime`),
            ]);
            setStats(statsRes.data);
            setTimeSeries(tsRes.data);
            setTopPages(pagesRes.data);
            setGeo(geoRes.data);
            setDevices(devRes.data);
            setReferrers(refRes.data);
            setRealtime(rtRes.data);
        } catch (err) {
            console.error("Analytics fetch error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [range]);

    useEffect(() => {
        setLoading(true);
        fetchAll();
    }, [fetchAll]);

    // Auto-refresh realtime every 30s
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const rtRes = await authFetch("/analytics/realtime");
                setRealtime(rtRes.data);
            } catch { /* silent */ }
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    const refreshData = () => {
        setRefreshing(true);
        fetchAll();
    };

    const ranges = [
        { key: "today", label: "Today" },
        { key: "7d", label: "7 Days" },
        { key: "30d", label: "30 Days" },
        { key: "all", label: "All Time" },
    ];

    const statCards = stats ? [
        { title: "Unique Visitors", value: formatNumber(stats.visitors as number), change: stats.visitorsChange as number, icon: Users, gradient: "linear-gradient(135deg, #06b6d4, #0891b2)" },
        { title: "Page Views", value: formatNumber(stats.pageViews as number), change: stats.pageViewsChange as number, icon: Eye, gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
        { title: "Sessions", value: formatNumber(stats.sessions as number), change: stats.sessionsChange as number, icon: Activity, gradient: "linear-gradient(135deg, #10b981, #059669)" },
        { title: "Avg. Duration", value: formatDuration(stats.avgDuration as number), change: stats.avgDurationChange as number, icon: Clock, gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
        { title: "Bounce Rate", value: `${stats.bounceRate}%`, change: -(stats.bounceRateChange as number), icon: MousePointerClick, gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
        { title: "Pages / Session", value: `${stats.pagesPerSession}`, change: 0, icon: BarChart3, gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
    ] : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Analytics Dashboard
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        First-party analytics — real-time traffic, engagement, and audience intelligence
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Range Selector */}
                    <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
                        {ranges.map(r => (
                            <button
                                key={r.key}
                                onClick={() => setRange(r.key)}
                                className="px-3.5 py-2 text-[11px] font-bold transition-all"
                                style={{
                                    background: range === r.key ? "var(--accent)" : "transparent",
                                    color: range === r.key ? "#fff" : "var(--text-muted)",
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={refreshData}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </motion.div>

            {/* ── Real-time Indicator ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
                <div className="relative">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    <span className="text-emerald-400 text-sm">{realtime?.activeVisitors ?? 0}</span> active {(realtime?.activeVisitors ?? 0) === 1 ? "visitor" : "visitors"} right now
                </span>
                {realtime?.activePages && realtime.activePages.length > 0 && (
                    <span className="text-[10px] ml-2" style={{ color: "var(--text-muted)" }}>
                        on {realtime.activePages[0].page}
                        {realtime.activePages.length > 1 && ` +${realtime.activePages.length - 1} more`}
                    </span>
                )}
                <span className="text-[10px] ml-auto font-semibold" style={{ color: "var(--text-muted)" }}>
                    {range === "today" ? "Today" : range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "All time"}
                </span>
            </motion.div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat, i) => (
                    <StatCard key={stat.title} {...stat} delay={0.15 + i * 0.05} />
                ))}
            </div>

            {/* ── Traffic Over Time Chart ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Traffic Overview</h3>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {timeSeries?.granularity === "hour" ? "Hourly" : "Daily"} page views & visitors
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.indigo }} />
                            <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Views</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.emerald }} />
                            <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Visitors</span>
                        </div>
                    </div>
                </div>
                <div style={{ height: 280 }}>
                    {timeSeries && timeSeries.series.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeSeries.series} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                                    tickFormatter={(v: string) => {
                                        if (v.includes("T")) return v.split("T")[1] || v;
                                        return v.split("-").slice(1).join("/");
                                    }}
                                    axisLine={false} tickLine={false}
                                />
                                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="views" stroke={COLORS.indigo} fill="url(#viewsGrad)" strokeWidth={2.5} dot={false} name="views" />
                                <Area type="monotone" dataKey="visitors" stroke={COLORS.emerald} fill="url(#visitorsGrad)" strokeWidth={2.5} dot={false} name="visitors" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data for this period yet. Visit the website to generate traffic.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Main Grid: Top Pages + Traffic Sources ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Pages */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="lg:col-span-2 rounded-2xl overflow-hidden"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                    <div className="flex items-center justify-between p-6 pb-4">
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Top Pages</h3>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{topPages.length} pages tracked</p>
                        </div>
                        <Layout className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                    {["Page", "Views", "Avg. Time", "Bounce"].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                                            style={{ color: "var(--text-muted)" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topPages.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>No page data yet</td></tr>
                                ) : topPages.slice(0, 10).map((p, i) => (
                                    <motion.tr
                                        key={p.path}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 + i * 0.04 }}
                                        className="hover:bg-[var(--bg-surface-hover)] transition-colors"
                                        style={{ borderBottom: i < Math.min(topPages.length, 10) - 1 ? "1px solid var(--border-subtle)" : "none" }}
                                    >
                                        <td className="px-6 py-3.5">
                                            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{p.title}</p>
                                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{p.path}</p>
                                        </td>
                                        <td className="px-6 py-3.5 text-xs font-bold" style={{ color: "var(--text-primary)" }}>{formatNumber(p.views)}</td>
                                        <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-secondary)" }}>{formatDuration(p.avgTime)}</td>
                                        <td className="px-6 py-3.5 text-xs font-semibold" style={{ color: p.bounceRate > 50 ? "#f59e0b" : "#22c55e" }}>{p.bounceRate}%</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Traffic Sources */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="rounded-2xl p-6"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Traffic Sources</h3>
                        <TrendingUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div className="space-y-4">
                        {referrers?.sources && referrers.sources.length > 0 ? referrers.sources.map((s, i) => (
                            <motion.div
                                key={s.name}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.55 + i * 0.06 }}
                                className="space-y-1.5"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                                    <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                                        {formatNumber(s.sessions)} · {s.percentage}%
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                                        initial={{ width: 0 }} animate={{ width: `${Math.min(s.percentage, 100)}%` }}
                                        transition={{ delay: 0.6 + i * 0.08, duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </motion.div>
                        )) : (
                            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No referrer data yet</p>
                        )}
                    </div>

                    {/* Top Referrer Domains */}
                    {referrers?.referrers && referrers.referrers.length > 0 && (
                        <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                            <h4 className="text-xs font-bold mb-3" style={{ color: "var(--text-primary)" }}>Top Referrers</h4>
                            <div className="space-y-2.5">
                                {referrers.referrers.slice(0, 5).map((r, i) => (
                                    <div key={r.domain} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                                            <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{r.domain}</span>
                                        </div>
                                        <span className="text-[10px] font-bold" style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>
                                            {formatNumber(r.sessions)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Bottom Grid: Geo + Devices + Browsers ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Geographic Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="lg:col-span-1 rounded-2xl p-6"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Geographic Intelligence</h3>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{geo.length} countries</p>
                        </div>
                        <MapPin className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div className="space-y-3">
                        {geo.length === 0 ? (
                            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No geographic data yet</p>
                        ) : geo.slice(0, 8).map((c, i) => (
                            <motion.div
                                key={c.countryCode}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.65 + i * 0.05 }}
                                className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-[var(--bg-surface-hover)]"
                            >
                                <CountryFlag code={c.countryCode} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{c.country}</p>
                                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatNumber(c.visitors)} visitors</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>{c.percentage}%</p>
                                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatNumber(c.sessions)} sess.</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Device Distribution — Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                    className="rounded-2xl p-6"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                    <h3 className="text-sm font-bold mb-5" style={{ color: "var(--text-primary)" }}>Device Breakdown</h3>
                    {devices && devices.devices.length > 0 ? (
                        <>
                            <div style={{ height: 180 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={devices.devices}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            strokeWidth={0}
                                        >
                                            {devices.devices.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={((value: number | undefined, name: string) => [formatNumber(value ?? 0), name]) as never}
                                            contentStyle={{
                                                background: "var(--bg-surface)",
                                                border: "1px solid var(--border-subtle)",
                                                borderRadius: 12,
                                                fontSize: 11,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-2">
                                {devices.devices.map((d, i) => {
                                    const DevIcon = DEVICE_ICONS[d.name] || Monitor;
                                    return (
                                        <div key={d.name} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ background: `${PIE_COLORS[i % PIE_COLORS.length]}15` }}>
                                                <DevIcon className="w-4 h-4" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{d.name}</span>
                                                    <span className="text-[11px] font-bold" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{d.percentage}%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full" style={{ background: "var(--bg-input)" }}>
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                                        initial={{ width: 0 }} animate={{ width: `${d.percentage}%` }}
                                                        transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>No device data yet</p>
                    )}
                </motion.div>

                {/* Browser & OS Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="rounded-2xl p-6 space-y-6"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                    {/* Browsers */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Browsers</h3>
                            <Chrome className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        </div>
                        {devices && devices.browsers.length > 0 ? (
                            <div style={{ height: 140 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={devices.browsers.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 10 }}>
                                        <XAxis type="number" hide />
                                        <YAxis
                                            type="category" dataKey="name" width={70}
                                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <Tooltip
                                            formatter={((value: number | undefined) => [formatNumber(value ?? 0), "Sessions"]) as never}
                                            contentStyle={{
                                                background: "var(--bg-surface)",
                                                border: "1px solid var(--border-subtle)",
                                                borderRadius: 12, fontSize: 11,
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                            {devices.browsers.slice(0, 5).map((_, i) => (
                                                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No browser data</p>
                        )}
                    </div>

                    {/* Operating Systems */}
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Operating Systems</h3>
                            <Zap className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                        </div>
                        {devices && devices.os.length > 0 ? (
                            <div className="space-y-2.5">
                                {devices.os.slice(0, 5).map((o, i) => (
                                    <div key={o.name} className="flex items-center gap-3">
                                        <span className="text-xs font-semibold w-16 truncate" style={{ color: "var(--text-primary)" }}>{o.name}</span>
                                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ background: BAR_COLORS[(i + 3) % BAR_COLORS.length] }}
                                                initial={{ width: 0 }} animate={{ width: `${o.percentage}%` }}
                                                transition={{ delay: 0.9 + i * 0.08, duration: 0.6 }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold w-10 text-right" style={{ color: BAR_COLORS[(i + 3) % BAR_COLORS.length] }}>{o.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No OS data</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
