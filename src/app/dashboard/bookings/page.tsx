"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarCheck,
    Phone,
    Mail,
    Briefcase,
    Clock,
    ChevronDown,
    X,
    User,
    FileText,
    RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Booking {
    id: string;
    name: string;
    email: string;
    countryCode: string;
    phone: string;
    service: string;
    brief: string;
    status: string;
    createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    NEW: { bg: "rgba(99,102,241,0.1)", text: "#818cf8", dot: "#6366f1" },
    CONTACTED: { bg: "rgba(234,179,8,0.1)", text: "#facc15", dot: "#eab308" },
    CLOSED: { bg: "rgba(34,197,94,0.1)", text: "#4ade80", dot: "#22c55e" },
};

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/bookings`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.status === "success") {
                setBookings(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings =
        statusFilter === "ALL"
            ? bookings
            : bookings.filter((b) => b.status === statusFilter);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="p-6 md:p-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1
                        className="text-2xl md:text-3xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Bookings
                    </h1>
                    <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Manage all incoming call booking requests
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Refresh Button */}
                    <button
                        onClick={fetchBookings}
                        className="p-2.5 rounded-xl transition-colors"
                        style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-primary)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none px-4 py-2.5 pr-9 rounded-xl text-sm font-medium cursor-pointer outline-none"
                            style={{
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border-primary)",
                                color: "var(--text-primary)",
                            }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        <ChevronDown
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                            style={{ color: "var(--text-muted)" }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: "Total", count: bookings.length, color: "#6366f1" },
                    { label: "New", count: bookings.filter((b) => b.status === "NEW").length, color: "#818cf8" },
                    { label: "Contacted", count: bookings.filter((b) => b.status === "CONTACTED").length, color: "#eab308" },
                    { label: "Closed", count: bookings.filter((b) => b.status === "CLOSED").length, color: "#22c55e" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="px-4 py-3 rounded-xl"
                        style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                        }}
                    >
                        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                            {stat.label}
                        </p>
                        <p className="text-xl font-bold mt-0.5" style={{ color: stat.color }}>
                            {stat.count}
                        </p>
                    </div>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div
                        className="w-8 h-8 border-2 rounded-full animate-spin"
                        style={{
                            borderColor: "var(--border-subtle)",
                            borderTopColor: "var(--accent)",
                        }}
                    />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="text-center py-20">
                    <CalendarCheck
                        className="w-12 h-12 mx-auto mb-3"
                        style={{ color: "var(--text-muted)" }}
                    />
                    <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                        No bookings found
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        Bookings will appear here when visitors submit the form.
                    </p>
                </div>
            ) : (
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-surface)",
                    }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: "1px solid var(--border-subtle)",
                                        background: "var(--bg-card)",
                                    }}
                                >
                                    {["Name", "Email", "Phone", "Service", "Status", "Date", ""].map(
                                        (h) => (
                                            <th
                                                key={h}
                                                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                                                style={{ color: "var(--text-muted)" }}
                                            >
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((b, i) => {
                                    const sc = statusColors[b.status] || statusColors.NEW;
                                    return (
                                        <motion.tr
                                            key={b.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="cursor-pointer transition-colors"
                                            style={{
                                                borderBottom: "1px solid var(--border-subtle)",
                                            }}
                                            onClick={() => setSelectedBooking(b)}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.background = "var(--bg-surface-hover)")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.background = "transparent")
                                            }
                                        >
                                            <td className="px-4 py-3">
                                                <span
                                                    className="font-medium text-sm"
                                                    style={{ color: "var(--text-primary)" }}
                                                >
                                                    {b.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="text-sm"
                                                    style={{ color: "var(--text-secondary)" }}
                                                >
                                                    {b.email}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="text-sm"
                                                    style={{ color: "var(--text-secondary)" }}
                                                >
                                                    {b.countryCode} {b.phone}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                                                    style={{
                                                        background: "var(--accent-soft)",
                                                        color: "var(--accent-text)",
                                                    }}
                                                >
                                                    {b.service}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                                                    style={{ background: sc.bg, color: sc.text }}
                                                >
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ background: sc.dot }}
                                                    />
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="text-xs"
                                                    style={{ color: "var(--text-muted)" }}
                                                >
                                                    {formatDate(b.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                                                    style={{
                                                        color: "var(--accent-text)",
                                                        background: "var(--accent-soft)",
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail Drawer */}
            <AnimatePresence>
                {selectedBooking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex justify-end"
                        onClick={() => setSelectedBooking(null)}
                    >
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 350, damping: 35 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md h-full overflow-y-auto"
                            style={{
                                background: "var(--bg-primary)",
                                borderLeft: "1px solid var(--border-primary)",
                            }}
                        >
                            {/* Drawer Header */}
                            <div
                                className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
                                style={{
                                    background: "var(--bg-primary)",
                                    borderBottom: "1px solid var(--border-subtle)",
                                }}
                            >
                                <h3
                                    className="text-lg font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Booking Details
                                </h3>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="px-6 py-5 space-y-5">
                                {[
                                    { icon: <User className="w-4 h-4" />, label: "Name", value: selectedBooking.name },
                                    { icon: <Mail className="w-4 h-4" />, label: "Email", value: selectedBooking.email },
                                    { icon: <Phone className="w-4 h-4" />, label: "Phone", value: `${selectedBooking.countryCode} ${selectedBooking.phone}` },
                                    { icon: <Briefcase className="w-4 h-4" />, label: "Service", value: selectedBooking.service },
                                    { icon: <Clock className="w-4 h-4" />, label: "Submitted", value: `${formatDate(selectedBooking.createdAt)} at ${formatTime(selectedBooking.createdAt)}` },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-start gap-3">
                                        <div
                                            className="p-2 rounded-lg mt-0.5"
                                            style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                                        >
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                                                {item.label}
                                            </p>
                                            <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>
                                                {item.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Brief */}
                                <div className="flex items-start gap-3">
                                    <div
                                        className="p-2 rounded-lg mt-0.5"
                                        style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                                    >
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                                            Project Brief
                                        </p>
                                        <p
                                            className="text-sm mt-1 leading-relaxed p-3 rounded-lg"
                                            style={{
                                                color: "var(--text-secondary)",
                                                background: "var(--bg-surface)",
                                                border: "1px solid var(--border-subtle)",
                                            }}
                                        >
                                            {selectedBooking.brief}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge & Update */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                                    >
                                        <CalendarCheck className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                                            Status
                                        </p>
                                        <div className="relative mt-1">
                                            <select
                                                value={selectedBooking.status}
                                                onChange={async (e) => {
                                                    const newStatus = e.target.value;
                                                    // Optimistic update
                                                    const updatedBooking = { ...selectedBooking, status: newStatus };
                                                    setSelectedBooking(updatedBooking);
                                                    setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));

                                                    try {
                                                        await fetch(`${API_URL}/bookings/${selectedBooking.id}/status`, {
                                                            method: 'PATCH',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                            },
                                                            credentials: "include",
                                                            body: JSON.stringify({ status: newStatus })
                                                        });
                                                    } catch (err) {
                                                        console.error("Failed to update status:", err);
                                                        // Revert on error (optional, simplified for now)
                                                    }
                                                }}
                                                className="appearance-none w-full pl-3 pr-8 py-2 rounded-lg text-xs font-medium cursor-pointer outline-none transition-colors hover:bg-white/5"
                                                style={{
                                                    background: (statusColors[selectedBooking.status] || statusColors.NEW).bg,
                                                    color: (statusColors[selectedBooking.status] || statusColors.NEW).text,
                                                    border: `1px solid ${(statusColors[selectedBooking.status] || statusColors.NEW).dot}40`,
                                                }}
                                            >
                                                <option value="NEW">New</option>
                                                <option value="CONTACTED">Contacted</option>
                                                <option value="CLOSED">Closed</option>
                                            </select>
                                            <ChevronDown
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-70"
                                                style={{
                                                    color: (statusColors[selectedBooking.status] || statusColors.NEW).text,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
