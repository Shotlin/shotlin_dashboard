"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    MessageSquare,
    Zap,
    Mail,
    Inbox,
    Settings,
    FileText,
    Layers,
    User,
    LogOut,
    Bell,
    Search,
    Menu,
    Sun,
    Moon,
    CalendarCheck,
    BarChart3,
    MessageSquareQuote,
    Users,
    Shield,
    Megaphone,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    // Auto-close sidebar on route change (mobile)
    useEffect(() => {
        const isMobile = window.innerWidth < 1024;
        if (isMobile && isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }, [pathname]);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data.user);
            } else if (res.status === 401 || res.status === 403) {
                // Not authenticated or deactivated — redirect to login
                router.push("/");
            }
        } catch (error) {
            console.error("Failed to fetch user", error);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            router.push("/");
        }
    };

    const isSuperAdmin = currentUser?.role === "SUPERADMIN";

    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
        { icon: MessageSquare, label: "Live Chat", href: "/dashboard/chat", badge: 3 },
        { icon: Zap, label: "Bot Config", href: "/dashboard/botconfig" },
        { icon: Inbox, label: "Inquiries", href: "/dashboard/messages" },
        { icon: CalendarCheck, label: "Bookings", href: "/dashboard/bookings" },
        { icon: FileText, label: "Blog Posts", href: "/dashboard/blog" },
        { icon: MessageSquareQuote, label: "Testimonials", href: "/dashboard/testimonials" },
        { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
        { icon: Layers, label: "Services", href: "/dashboard/services" },
        { icon: Megaphone, label: "Promotions", href: "/dashboard/promotions" },
        // SUPERADMIN only
        ...(isSuperAdmin
            ? [{ icon: Users, label: "User Management", href: "/dashboard/users" }]
            : []),
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ];

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "SUPERADMIN": return { label: "Super Admin", color: "#a855f7" };
            case "ADMIN": return { label: "Admin", color: "#3b82f6" };
            default: return { label: "Team", color: "#10b981" };
        }
    };

    const roleBadge = currentUser ? getRoleBadge(currentUser.role) : null;

    return (
        <div
            className="min-h-screen font-sans flex overflow-hidden theme-transition"
            style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
        >
            {/* ─── Sidebar Backdrop (mobile) ─── */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ─── Sidebar ─── */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 w-64 backdrop-blur-xl transition-transform duration-300 transform lg:translate-x-0 theme-transition",
                    !isSidebarOpen && "-translate-x-full lg:w-20 lg:translate-x-0"
                )}
                style={{
                    background: "var(--bg-surface)",
                    borderRight: "1px solid var(--border-primary)",
                }}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div
                        className={cn(
                            "h-16 flex items-center px-6 theme-transition",
                            !isSidebarOpen && "lg:justify-center lg:px-0"
                        )}
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-white">S</span>
                        </div>
                        <span
                            className={cn(
                                "ml-3 font-bold text-lg tracking-tight transition-opacity duration-200",
                                !isSidebarOpen && "lg:hidden"
                            )}
                            style={{ color: "var(--text-primary)" }}
                        >
                            Shotlin
                        </span>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 py-6 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center px-3 py-2.5 rounded-xl transition-all group relative"
                                    )}
                                    style={{
                                        background: isActive ? "var(--accent-soft)" : "transparent",
                                        color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = "var(--bg-surface-hover)";
                                            e.currentTarget.style.color = "var(--text-primary)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = "var(--text-secondary)";
                                        }
                                    }}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span
                                        className={cn(
                                            "ml-3 font-medium text-sm transition-opacity duration-200 whitespace-nowrap",
                                            !isSidebarOpen && "lg:hidden"
                                        )}
                                    >
                                        {item.label}
                                    </span>

                                    {item.badge && (
                                        <span
                                            className={cn(
                                                "ml-auto text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                                                !isSidebarOpen && "lg:absolute lg:top-1 lg:right-1"
                                            )}
                                            style={{ background: "var(--accent)" }}
                                        >
                                            {item.badge}
                                        </span>
                                    )}

                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute left-0 w-1 h-6 rounded-r-full"
                                            style={{ background: "var(--accent)" }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <div className={cn("flex items-center gap-3", !isSidebarOpen && "lg:justify-center")}>
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs text-white"
                                style={{
                                    background: roleBadge
                                        ? `linear-gradient(135deg, ${roleBadge.color}, ${roleBadge.color}dd)`
                                        : "var(--bg-input)",
                                }}
                            >
                                {currentUser
                                    ? (currentUser.name?.[0] || currentUser.email[0]).toUpperCase()
                                    : "?"}
                            </div>
                            <div className={cn("flex-1 min-w-0 transition-opacity duration-200", !isSidebarOpen && "lg:hidden")}>
                                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                                    {currentUser?.name || currentUser?.email || "Loading..."}
                                </p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider truncate" style={{ color: roleBadge?.color || "var(--text-muted)" }}>
                                    {roleBadge?.label || "..."}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className={cn("transition-colors hover:text-red-500", !isSidebarOpen && "lg:hidden")}
                                style={{ color: "var(--text-muted)" }}
                                title="Log Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--bg-secondary)" }}>
                {/* Top Header */}
                <header
                    className="h-16 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 theme-transition"
                    style={{
                        background: "var(--backdrop)",
                        borderBottom: "1px solid var(--border-subtle)",
                    }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 rounded-lg transition-colors"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Search */}
                        <div className="hidden md:flex items-center relative">
                            <Search className="w-4 h-4 absolute left-3" style={{ color: "var(--text-muted)" }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 w-64 transition-all"
                                style={{
                                    background: "var(--bg-input)",
                                    border: "1px solid var(--border-subtle)",
                                    color: "var(--text-primary)",
                                    // @ts-ignore
                                    "--tw-ring-color": "var(--accent)",
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg transition-all hover:scale-105"
                            style={{
                                color: "var(--text-muted)",
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-subtle)",
                            }}
                            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4 h-4" style={{ color: "#facc15" }} />
                            ) : (
                                <Moon className="w-4 h-4" style={{ color: "#6366f1" }} />
                            )}
                        </button>

                        {/* Notifications */}
                        <button
                            className="relative p-2 transition-colors"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <Bell className="w-5 h-5" />
                            <span
                                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                                style={{ background: "var(--accent)", border: "2px solid var(--bg-primary)" }}
                            />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <DashboardShell>{children}</DashboardShell>
        </ThemeProvider>
    );
}
