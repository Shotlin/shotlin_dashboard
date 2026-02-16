"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Users, Eye, Clock, Activity, MousePointerClick, Mail,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Radio, BarChart3, Loader2, ExternalLink,
} from "lucide-react";

import { ContactMessage } from "@/types/contact";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

// ── Helpers ──
function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

interface AnalyticsStats {
    visitors: number;
    pageViews: number;
    sessions: number;
    avgDuration: number;
    bounceRate: number;
    pagesPerSession: number;
    visitorsChange: number;
    pageViewsChange: number;
    sessionsChange: number;
    avgDurationChange: number;
    bounceRateChange: number;
}

interface RealtimeData {
    activeVisitors: number;
    activePages: Array<{ page: string; count: number }>;
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
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-[0.06] -mr-6 -mt-6"
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

export default function DashboardOverview() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [realtime, setRealtime] = useState<RealtimeData | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [msgRes, statsRes, rtRes] = await Promise.all([
                fetch(`${API_URL}/contact`, { credentials: "include" }),
                fetch(`${API_URL}/analytics/stats?range=7d`, { credentials: "include" }),
                fetch(`${API_URL}/analytics/realtime`, { credentials: "include" }),
            ]);

            const msgData = await msgRes.json();
            if (msgData.status === "success") setMessages(msgData.data);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.data);
            }

            if (rtRes.ok) {
                const rtData = await rtRes.json();
                setRealtime(rtData.data);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error instanceof Error ? error.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh realtime every 30s
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/analytics/realtime`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setRealtime(data.data);
                }
            } catch { /* silent */ }
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    const statCards = stats ? [
        { title: "Unique Visitors", value: formatNumber(stats.visitors), change: stats.visitorsChange, icon: Users, gradient: "linear-gradient(135deg, #06b6d4, #0891b2)" },
        { title: "Page Views", value: formatNumber(stats.pageViews), change: stats.pageViewsChange, icon: Eye, gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
        { title: "Sessions", value: formatNumber(stats.sessions), change: stats.sessionsChange, icon: Activity, gradient: "linear-gradient(135deg, #10b981, #059669)" },
        { title: "Avg. Duration", value: formatDuration(stats.avgDuration), change: stats.avgDurationChange, icon: Clock, gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
        { title: "Bounce Rate", value: `${stats.bounceRate}%`, change: -(stats.bounceRateChange), icon: MousePointerClick, gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
        { title: "Total Messages", value: messages.length.toString(), change: 0, icon: Mail, gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
    ] : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Dashboard Overview
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        Real-time metrics across your site — last 7 days
                    </p>
                </div>
                <Link
                    href="/dashboard/analytics"
                    className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: "var(--accent)" }}
                >
                    <BarChart3 className="w-4 h-4" />
                    Full Analytics
                    <ExternalLink className="w-3 h-3" />
                </Link>
            </motion.div>

            {/* Real-time Indicator */}
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
                    <span className="text-[10px] ml-2 hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                        on {realtime.activePages[0].page}
                        {realtime.activePages.length > 1 && ` +${realtime.activePages.length - 1} more`}
                    </span>
                )}
                <span className="text-[10px] ml-auto font-semibold" style={{ color: "var(--text-muted)" }}>
                    Auto-refreshes every 30s
                </span>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, i) => (
                    <StatCard key={stat.title} {...stat} delay={0.15 + i * 0.05} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Messages */}
                <div
                    className="rounded-2xl p-6 theme-transition"
                    style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        boxShadow: "var(--shadow-card)",
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                            Recent Messages
                        </h3>
                        <Link
                            href="/dashboard/messages"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
                        >
                            View All
                        </Link>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {messages.length === 0 ? (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No messages yet.</p>
                        ) : (
                            messages.slice(0, 5).map((msg) => (
                                <div
                                    key={msg.id}
                                    className="flex items-start gap-4 p-3 rounded-xl transition-colors"
                                    style={{ border: "1px solid transparent" }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "var(--bg-surface-hover)";
                                        e.currentTarget.style.border = "1px solid var(--border-subtle)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.border = "1px solid transparent";
                                    }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs uppercase"
                                        style={{
                                            background: "var(--accent-soft)",
                                            color: "var(--accent-text)",
                                            border: "1px solid var(--accent-border)",
                                        }}
                                    >
                                        {`${msg.firstName?.[0] || ''}${msg.lastName?.[0] || ''}`}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                                                {msg.subject || "No Subject"}
                                            </p>
                                            <span className="text-[10px] whitespace-nowrap ml-2" style={{ color: "var(--text-muted)" }}>
                                                {new Date(msg.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                                            {msg.firstName} {msg.lastName} ({msg.email})
                                        </p>
                                        <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                                            {msg.message}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions / Live Activity */}
                <div
                    className="rounded-2xl p-6 theme-transition"
                    style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        boxShadow: "var(--shadow-card)",
                    }}
                >
                    <h3 className="text-lg font-bold mb-6" style={{ color: "var(--text-primary)" }}>
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Live Chat", href: "/dashboard/chat", icon: "💬", color: "#6366f1" },
                            { label: "New Blog Post", href: "/dashboard/blog/new", icon: "📝", color: "#10b981" },
                            { label: "View Bookings", href: "/dashboard/bookings", icon: "📅", color: "#f59e0b" },
                            { label: "Bot Config", href: "/dashboard/botconfig", icon: "🤖", color: "#ec4899" },
                        ].map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-[1.02] text-center"
                                style={{
                                    background: "var(--bg-input)",
                                    border: "1px solid var(--border-subtle)",
                                }}
                            >
                                <span className="text-2xl">{action.icon}</span>
                                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                                    {action.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* Active Pages */}
                    {realtime?.activePages && realtime.activePages.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                                Active Pages Right Now
                            </h4>
                            <div className="space-y-2">
                                {realtime.activePages.slice(0, 4).map((page, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "var(--bg-input)" }}>
                                        <span className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                                            {page.page}
                                        </span>
                                        <span className="text-xs font-bold ml-2" style={{ color: "var(--accent)" }}>
                                            {page.count} {page.count === 1 ? "visitor" : "visitors"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
