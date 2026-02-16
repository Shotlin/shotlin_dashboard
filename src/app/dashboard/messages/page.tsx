"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Inbox,
    Search,
    RefreshCw,
    X,
    Mail,
    Clock,
    ChevronRight,
    MoreHorizontal,
    Reply
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface ContactMessage {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    status: "UNREAD" | "READ" | "ARCHIVED";
    createdAt: string;
}

export default function InquiriesPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/contact`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.status === "success") {
                setMessages(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const filteredMessages = messages.filter((msg) =>
        (msg.firstName + " " + msg.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--accent-soft)" }}
                    >
                        <Inbox className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                            Inquiries
                        </h1>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            Manage contact form submissions
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: "var(--text-muted)" }}
                        />
                        <input
                            type="text"
                            placeholder="Search inquiries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none w-full md:w-64 transition-all"
                            style={{
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>
                    <button
                        onClick={fetchMessages}
                        className="p-2.5 rounded-xl transition-colors hover:bg-white/5"
                        style={{
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div
                className="rounded-2xl overflow-hidden backdrop-blur-sm"
                style={{
                    border: "1px solid var(--border-primary)",
                    background: "var(--bg-surface)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                {/* Table Header */}
                <div
                    className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider"
                    style={{
                        background: "var(--bg-input)",
                        borderBottom: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                    }}
                >
                    <div className="col-span-3">Name</div>
                    <div className="col-span-3">Email</div>
                    <div className="col-span-4">Subject</div>
                    <div className="col-span-2 text-right">Date</div>
                </div>

                {/* Table Body */}
                {loading ? (
                    <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                        <div
                            className="inline-block w-5 h-5 border-2 rounded-full animate-spin mb-2"
                            style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent)" }}
                        />
                        <p>Loading inquiries...</p>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                        No inquiries found matching your search.
                    </div>
                ) : (
                    <div>
                        {filteredMessages.map((msg, i) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => setSelectedMessage(msg)}
                                className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-colors group"
                                style={{
                                    borderBottom: "1px solid var(--border-subtle)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "var(--bg-surface-hover)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                }}
                            >
                                {/* Name */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                        style={{
                                            background: "var(--accent-soft)",
                                            color: "var(--accent-text)",
                                        }}
                                    >
                                        {msg.firstName[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                                            {msg.firstName} {msg.lastName}
                                        </p>
                                        {msg.status === "UNREAD" && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 mt-0.5">
                                                New
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="col-span-3">
                                    <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                                        {msg.email}
                                    </p>
                                </div>

                                {/* Subject */}
                                <div className="col-span-4">
                                    <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                        {msg.subject || "No Subject"}
                                    </p>
                                    <p className="text-xs truncate opacity-70" style={{ color: "var(--text-muted)" }}>
                                        {msg.message}
                                    </p>
                                </div>

                                {/* Date */}
                                <div className="col-span-2 text-right">
                                    <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                        {formatDate(msg.createdAt)}
                                    </p>
                                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Drawer */}
            <AnimatePresence>
                {selectedMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex justify-end"
                        onClick={() => setSelectedMessage(null)}
                    >
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 350, damping: 35 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-lg h-full overflow-y-auto shadow-2xl"
                            style={{
                                background: "var(--bg-primary)",
                                borderLeft: "1px solid var(--border-primary)",
                            }}
                        >
                            {/* Drawer Header */}
                            <div
                                className="sticky top-0 z-10 flex items-center justify-between px-8 py-5"
                                style={{
                                    background: "var(--bg-primary)",
                                    borderBottom: "1px solid var(--border-subtle)",
                                }}
                            >
                                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                                    Inquiry Details
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="p-2 rounded-lg transition-colors hover:bg-white/5"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Body */}
                            <div className="px-8 py-8 space-y-8">
                                {/* Sender Profile */}
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
                                        style={{
                                            background: "var(--accent-soft)",
                                            color: "var(--accent-text)",
                                        }}
                                    >
                                        {selectedMessage.firstName[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                                            {selectedMessage.firstName} {selectedMessage.lastName}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Mail className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                                            <a
                                                href={`mailto:${selectedMessage.email}`}
                                                className="text-sm hover:underline"
                                                style={{ color: "var(--accent)" }}
                                            >
                                                {selectedMessage.email}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                                            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                                {formatDate(selectedMessage.createdAt)} • {formatTime(selectedMessage.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px w-full" style={{ background: "var(--border-subtle)" }} />

                                {/* Subject & Message */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
                                        Subject
                                    </label>
                                    <p className="text-base font-medium mb-6" style={{ color: "var(--text-primary)" }}>
                                        {selectedMessage.subject || "No Subject"}
                                    </p>

                                    <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: "var(--text-muted)" }}>
                                        Message
                                    </label>
                                    <div
                                        className="p-6 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                                        style={{
                                            background: "var(--bg-surface)",
                                            border: "1px solid var(--border-subtle)",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {selectedMessage.message}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <a
                                        href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-90"
                                        style={{
                                            background: "var(--accent)",
                                            color: "white",
                                        }}
                                    >
                                        <Reply className="w-4 h-4" />
                                        Reply via Email
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
