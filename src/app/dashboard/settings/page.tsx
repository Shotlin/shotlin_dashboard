"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Shield, User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Globe, MessageCircle, Save } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
}

export default function SettingsPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Site Settings
    const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsMsg, setSettingsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchUser();
        fetchSiteSettings();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
            const data = await res.json();
            if (res.ok) setUser(data.user);
        } catch (error) {
            console.error("Failed to fetch user", error);
        }
    };

    const fetchSiteSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`, { credentials: "include" });
            const data = await res.json();
            if (data.status === "success") setSiteSettings(data.data || {});
        } catch (error) {
            console.error("Failed to fetch site settings", error);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        setSettingsMsg(null);
        try {
            const res = await fetch(`${API_URL}/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    settings: Object.entries(siteSettings).map(([key, value]) => ({ key, value })),
                }),
            });
            if (res.ok) {
                setSettingsMsg({ type: "success", text: "Settings saved successfully" });
            } else {
                const data = await res.json();
                setSettingsMsg({ type: "error", text: data.message || "Failed to save" });
            }
        } catch {
            setSettingsMsg({ type: "error", text: "Network error. Please try again." });
        } finally {
            setSavingSettings(false);
            setTimeout(() => setSettingsMsg(null), 3500);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/me/password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "Password changed successfully" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.message || "Failed to change password" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            SUPERADMIN: "background: linear-gradient(135deg, #7c3aed, #a855f7); color: white;",
            ADMIN: "background: linear-gradient(135deg, #2563eb, #3b82f6); color: white;",
            TEAM_MEMBER: "background: linear-gradient(135deg, #059669, #10b981); color: white;",
        };
        return styles[role] || styles.TEAM_MEMBER;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Settings
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    Manage your account settings and password
                </p>
            </div>

            {/* Profile Card */}
            {user && (
                <div
                    className="rounded-2xl p-6 space-y-4"
                    style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-primary)",
                    }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--accent-soft)" }}
                        >
                            <User className="w-5 h-5" style={{ color: "var(--accent)" }} />
                        </div>
                        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                            Profile
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                            <User className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                    Name
                                </div>
                                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                                    {user.name || "—"}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                            <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                    Email
                                </div>
                                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                            <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                    Role
                                </div>
                                <span
                                    className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                                    style={{ ...Object.fromEntries(getRoleBadge(user.role).split(";").filter(Boolean).map(s => { const [k, v] = s.split(":"); return [k.trim(), v.trim()]; })) }}
                                >
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Card */}
            <div
                className="rounded-2xl p-6"
                style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-primary)",
                }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--accent-soft)" }}
                    >
                        <KeyRound className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                            Change Password
                        </h2>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Update your password to keep your account secure
                        </p>
                    </div>
                </div>

                {message && (
                    <div
                        className="flex items-center gap-2 p-3 rounded-xl mb-6 text-sm"
                        style={{
                            background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: message.type === "success" ? "#10b981" : "#ef4444",
                            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}
                    >
                        {message.type === "success" ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        )}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                            Current Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                                autoComplete="current-password"
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={{
                                    background: "var(--bg-input)",
                                    border: "1px solid var(--border-primary)",
                                    color: "var(--text-primary)",
                                    // @ts-ignore
                                    "--tw-ring-color": "var(--accent)",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 6 characters)"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={{
                                    background: "var(--bg-input)",
                                    border: "1px solid var(--border-primary)",
                                    color: "var(--text-primary)",
                                    // @ts-ignore
                                    "--tw-ring-color": "var(--accent)",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={{
                                    background: "var(--bg-input)",
                                    border: "1px solid var(--border-primary)",
                                    color: "var(--text-primary)",
                                    // @ts-ignore
                                    "--tw-ring-color": "var(--accent)",
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: "var(--accent)" }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Changing...
                            </>
                        ) : (
                            "Change Password"
                        )}
                    </button>
                </form>
            </div>

            {/* Site Settings Card */}
            <div
                className="rounded-2xl p-6"
                style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-primary)",
                }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(37,211,102,0.1)" }}
                    >
                        <Globe className="w-5 h-5" style={{ color: "#25D366" }} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                            Site Settings
                        </h2>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Global settings used across the website
                        </p>
                    </div>
                </div>

                {settingsMsg && (
                    <div
                        className="flex items-center gap-2 p-3 rounded-xl mb-6 text-sm"
                        style={{
                            background: settingsMsg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: settingsMsg.type === "success" ? "#10b981" : "#ef4444",
                            border: `1px solid ${settingsMsg.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}
                    >
                        {settingsMsg.type === "success" ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        )}
                        {settingsMsg.text}
                    </div>
                )}

                <div className="space-y-4">
                    {/* WhatsApp URL */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                            <MessageCircle className="w-4 h-4" style={{ color: "#25D366" }} />
                            WhatsApp URL
                        </label>
                        <input
                            type="text"
                            value={siteSettings.whatsappUrl || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, whatsappUrl: e.target.value })}
                            placeholder="https://wa.me/919775845587"
                            className="w-full pl-4 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                            style={{
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-primary)",
                                color: "var(--text-primary)",
                            }}
                        />
                        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                            Used in Book a Call modal, service pages, and offer CTAs across the website
                        </p>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: "#25D366" }}
                    >
                        {savingSettings ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
