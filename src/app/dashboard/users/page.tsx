"use client";

import React, { useState, useEffect } from "react";
import {
    Users, Plus, Shield, ShieldCheck, UserCheck, Trash2, UserX, UserPlus, KeyRound,
    Loader2, CheckCircle, AlertCircle, X, Eye, EyeOff, ChevronDown
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface UserItem {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
}

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    SUPERADMIN: { bg: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", label: "Super Admin" },
    ADMIN: { bg: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", label: "Admin" },
    TEAM_MEMBER: { bg: "linear-gradient(135deg, #059669, #10b981)", color: "#fff", label: "Team Member" },
};

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [currentUser, setCurrentUser] = useState<UserItem | null>(null);

    // Modal states
    const [createModal, setCreateModal] = useState(false);
    const [resetPwModal, setResetPwModal] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

    // Form states
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "TEAM_MEMBER" });
    const [newPassword, setNewPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchCurrentUser();
        fetchUsers();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
            const data = await res.json();
            if (res.ok) setCurrentUser(data.user);
        } catch (e) { console.error(e); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users`, { credentials: "include" });
            const data = await res.json();
            if (res.ok) setUsers(data.users);
            else showMessage("error", data.message || "Failed to fetch users");
        } catch (e) {
            showMessage("error", "Network error");
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    // ─── Create User ───
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newUser),
            });
            const data = await res.json();
            if (res.ok) {
                showMessage("success", "User created successfully");
                setCreateModal(false);
                setNewUser({ name: "", email: "", password: "", role: "TEAM_MEMBER" });
                fetchUsers();
            } else {
                showMessage("error", data.message || "Failed to create user");
            }
        } catch (e) {
            showMessage("error", "Network error");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Update Role ───
    const handleUpdateRole = async (userId: string, role: string) => {
        setRoleDropdown(null);
        try {
            const res = await fetch(`${API_URL}/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ role }),
            });
            const data = await res.json();
            if (res.ok) {
                showMessage("success", data.message);
                fetchUsers();
            } else {
                showMessage("error", data.message);
            }
        } catch (e) {
            showMessage("error", "Network error");
        }
    };

    // ─── Reset Password ───
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetPwModal) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/${resetPwModal}/password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password: newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                showMessage("success", "Password reset successfully");
                setResetPwModal(null);
                setNewPassword("");
            } else {
                showMessage("error", data.message);
            }
        } catch (e) {
            showMessage("error", "Network error");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Deactivate / Activate ───
    const handleToggleActive = async (userId: string, isActive: boolean) => {
        const endpoint = isActive ? "deactivate" : "activate";
        try {
            const res = await fetch(`${API_URL}/users/${userId}/${endpoint}`, {
                method: "PATCH",
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
                showMessage("success", data.message);
                fetchUsers();
            } else {
                showMessage("error", data.message);
            }
        } catch (e) {
            showMessage("error", "Network error");
        }
    };

    // ─── Delete ───
    const handleDelete = async (userId: string) => {
        setDeleteConfirm(null);
        try {
            const res = await fetch(`${API_URL}/users/${userId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
                showMessage("success", data.message);
                fetchUsers();
            } else {
                showMessage("error", data.message);
            }
        } catch (e) {
            showMessage("error", "Network error");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                        User Management
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                        Manage roles, passwords, and account status
                    </p>
                </div>
                <button
                    onClick={() => setCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "var(--accent)" }}
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            {/* Message */}
            {message && (
                <div
                    className="flex items-center gap-2 p-3 rounded-xl text-sm animate-in fade-in"
                    style={{
                        background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: message.type === "success" ? "#10b981" : "#ef4444",
                        border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    }}
                >
                    {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Users Table */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                    {["User", "Role", "Status", "Joined", "Actions"].map(h => (
                                        <th
                                            key={h}
                                            className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => {
                                    const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.TEAM_MEMBER;
                                    const isSelf = currentUser?.id === u.id;
                                    const isSuperAdmin = u.role === "SUPERADMIN";

                                    return (
                                        <tr
                                            key={u.id}
                                            className="transition-colors"
                                            style={{ borderBottom: "1px solid var(--border-subtle)" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            {/* User */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                                                        style={{ background: roleStyle.bg, color: roleStyle.color }}
                                                    >
                                                        {(u.name?.[0] || u.email[0]).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                                                            {u.name || "Unnamed"} {isSelf && <span className="text-xs opacity-50">(You)</span>}
                                                        </div>
                                                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-5 py-4">
                                                <div className="relative">
                                                    {isSuperAdmin || isSelf ? (
                                                        <span
                                                            className="inline-block px-2.5 py-1 rounded-full text-xs font-bold"
                                                            style={{ background: roleStyle.bg, color: roleStyle.color }}
                                                        >
                                                            {roleStyle.label}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setRoleDropdown(roleDropdown === u.id ? null : u.id)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
                                                                style={{ background: roleStyle.bg, color: roleStyle.color }}
                                                            >
                                                                {roleStyle.label}
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                            {roleDropdown === u.id && (
                                                                <div
                                                                    className="absolute z-10 mt-1 rounded-xl shadow-xl py-1 min-w-[140px]"
                                                                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}
                                                                >
                                                                    {["ADMIN", "TEAM_MEMBER"].map(r => (
                                                                        <button
                                                                            key={r}
                                                                            onClick={() => handleUpdateRole(u.id, r)}
                                                                            className="block w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                                                                            style={{ color: u.role === r ? "var(--accent)" : "var(--text-secondary)" }}
                                                                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
                                                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                                        >
                                                                            {r === "ADMIN" ? "Admin" : "Team Member"}
                                                                            {u.role === r && " ✓"}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                    style={{
                                                        background: u.isActive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                                        color: u.isActive ? "#10b981" : "#ef4444",
                                                    }}
                                                >
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ background: u.isActive ? "#10b981" : "#ef4444" }}
                                                    />
                                                    {u.isActive ? "Active" : "Deactivated"}
                                                </span>
                                            </td>

                                            {/* Joined */}
                                            <td className="px-5 py-4 text-xs" style={{ color: "var(--text-muted)" }}>
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                {!isSelf && !isSuperAdmin && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => setResetPwModal(u.id)}
                                                            className="p-1.5 rounded-lg transition-colors"
                                                            style={{ color: "var(--text-muted)" }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.1)"; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                                                            title="Reset Password"
                                                        >
                                                            <KeyRound className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActive(u.id, u.isActive)}
                                                            className="p-1.5 rounded-lg transition-colors"
                                                            style={{ color: "var(--text-muted)" }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.color = u.isActive ? "#ef4444" : "#10b981";
                                                                e.currentTarget.style.background = u.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)";
                                                            }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                                                            title={u.isActive ? "Deactivate" : "Activate"}
                                                        >
                                                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(u.id)}
                                                            className="p-1.5 rounded-lg transition-colors"
                                                            style={{ color: "var(--text-muted)" }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Create User Modal ─── */}
            {createModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div
                        className="w-full max-w-md rounded-2xl p-6 mx-4"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5" style={{ color: "var(--accent)" }} />
                                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Create New User</h3>
                            </div>
                            <button onClick={() => setCreateModal(false)} style={{ color: "var(--text-muted)" }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Full Name</label>
                                <input
                                    type="text" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Email</label>
                                <input
                                    type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Password</label>
                                <input
                                    type="password" required minLength={6} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Role</label>
                                <select
                                    value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                >
                                    <option value="TEAM_MEMBER">Team Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <button
                                type="submit" disabled={actionLoading}
                                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: "var(--accent)" }}
                            >
                                {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create User"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Reset Password Modal ─── */}
            {resetPwModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div
                        className="w-full max-w-md rounded-2xl p-6 mx-4"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Reset Password</h3>
                            </div>
                            <button onClick={() => { setResetPwModal(null); setNewPassword(""); }} style={{ color: "var(--text-muted)" }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                            Set a new password for <strong>{users.find(u => u.id === resetPwModal)?.email}</strong>
                        </p>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showPw ? "text" : "password"} required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2"
                                    style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                                    placeholder="New password (min 6 characters)"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                                type="submit" disabled={actionLoading}
                                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: "#f59e0b" }}
                            >
                                {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : "Reset Password"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirm Modal ─── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div
                        className="w-full max-w-sm rounded-2xl p-6 mx-4"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)" }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Delete User</h3>
                        </div>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                            Are you sure you want to permanently delete <strong>{users.find(u => u.id === deleteConfirm)?.email}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: "#ef4444" }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
