"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, MoreVertical, Search, User, FileText, Image as ImageIcon, Film, File, ArrowLeft, MessageSquare } from "lucide-react";

interface Conversation {
    visitorId: string;
    lastMessage: string;
    lastActive: string;
    name: string;
    unreadCount: number;
}

interface Message {
    id: string;
    message: string;
    sender: "USER" | "ADMIN";
    createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function ChatPage() {
    const [activeVisitorId, setActiveVisitorId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyText, setReplyText] = useState("");
    const [loading, setLoading] = useState(true);
    const [mobileShowChat, setMobileShowChat] = useState(false); // Mobile: toggle list vs chat
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevMessageCountRef = useRef(0);
    const isAtBottom = useRef(true);
    const isInitialLoad = useRef(true);

    // ── Fetch Conversations ──────────────────────────────
    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/contact/conversations`, {
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const data = await res.json();
            if (data.status === "success") {
                setConversations(data.data);
                if (isInitialLoad.current && data.data.length > 0) {
                    setActiveVisitorId(data.data[0].visitorId);
                    isInitialLoad.current = false;
                }
            }
        } catch (err) {
            console.error("Failed to fetch conversations", err);
        } finally {
            setLoading(false);
        }
    }, [activeVisitorId]);

    // ── Fetch Chat History ───────────────────────────────
    const fetchChatHistory = useCallback(async () => {
        if (!activeVisitorId) return;
        try {
            const res = await fetch(
                `${API_URL}/contact/chat?visitorId=${activeVisitorId}`,
                {
                    headers: { "Content-Type": "application/json" },
                    credentials: "include"
                }
            );
            const data = await res.json();
            if (data.status === "success") {
                setMessages(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch chat history", err);
        }
    }, [activeVisitorId]);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    useEffect(() => {
        fetchChatHistory();
        const interval = setInterval(fetchChatHistory, 3000);
        return () => clearInterval(interval);
    }, [activeVisitorId, fetchChatHistory]);

    // ── Scroll to bottom ─────────────────────────────────
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        isAtBottom.current = scrollHeight - scrollTop - clientHeight < 50;
    };

    const scrollToBottom = useCallback((force = false) => {
        if (!force && !isAtBottom.current) return;
        setTimeout(() => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight;
            }
        }, 80);
    }, []);

    useEffect(() => {
        scrollToBottom();
        prevMessageCountRef.current = messages.length;
    }, [messages, scrollToBottom]);

    // Switch conversation
    const handleConversationSwitch = (visitorId: string) => {
        if (visitorId === activeVisitorId) return;
        setMessages([]);
        setActiveVisitorId(visitorId);
        setMobileShowChat(true); // On mobile, switch to chat view
        isAtBottom.current = true;
        setTimeout(() => scrollToBottom(true), 100);
    };

    // Back to list on mobile
    const handleBackToList = () => {
        setMobileShowChat(false);
    };

    // ── Send Reply ───────────────────────────────────────
    const handleSendReply = async () => {
        if (!replyText.trim() || !activeVisitorId) return;
        try {
            const res = await fetch(`${API_URL}/contact/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    visitorId: activeVisitorId,
                    message: replyText,
                }),
            });
            if (res.ok) {
                setReplyText("");
                fetchChatHistory();
                scrollToBottom(true);
            }
        } catch (err) {
            console.error("Failed to send reply", err);
        }
    };

    const activeConv = conversations.find((c) => c.visitorId === activeVisitorId);

    return (
        <div
            className="h-[calc(100vh-8rem)] rounded-2xl overflow-hidden flex theme-transition"
            style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-primary)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            {/* ─── Sidebar Conversation List ─── */}
            <div
                className={`
                    flex flex-col backdrop-blur-sm theme-transition
                    w-full md:w-80 flex-shrink-0
                    ${mobileShowChat ? "hidden md:flex" : "flex"}
                `}
                style={{
                    background: "var(--bg-surface)",
                    borderRight: "1px solid var(--border-subtle)",
                }}
            >
                {/* Search Header */}
                <div className="p-3 sm:p-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center gap-3 mb-3 md:mb-0">
                        <h2 className="text-lg font-bold md:hidden" style={{ color: "var(--text-primary)" }}>
                            Messages
                        </h2>
                        {conversations.length > 0 && (
                            <span className="md:hidden px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                                style={{ background: "var(--accent)" }}>
                                {conversations.length}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "var(--text-muted)" }}
                        />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:outline-none"
                            style={{
                                background: "var(--bg-input)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--border-subtle)",
                            }}
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-5 h-5 border-2 rounded-full animate-spin"
                                style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent)" }} />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <MessageSquare className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
                            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No conversations yet</p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const isActive = activeVisitorId === conv.visitorId;
                            return (
                                <div
                                    key={conv.visitorId}
                                    onClick={() => handleConversationSwitch(conv.visitorId)}
                                    className="p-3 sm:p-4 cursor-pointer transition-colors theme-transition"
                                    style={{
                                        background: isActive ? "var(--accent-soft)" : "transparent",
                                        borderBottom: "1px solid var(--border-subtle)",
                                        borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) e.currentTarget.style.background = "var(--bg-surface-hover)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h4
                                                    className="font-medium text-sm truncate"
                                                    style={{ color: isActive ? "var(--accent-text)" : "var(--text-primary)" }}
                                                >
                                                    {conv.name}
                                                </h4>
                                                <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                                                    {new Date(conv.lastActive).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs line-clamp-1 flex-1" style={{ color: "var(--text-muted)" }}>
                                                    {conv.lastMessage}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span
                                                        className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white rounded-full flex-shrink-0"
                                                        style={{ background: "var(--danger)" }}
                                                    >
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─── Chat Area ─── */}
            <div
                className={`
                    flex-1 flex flex-col min-w-0
                    ${mobileShowChat ? "flex" : "hidden md:flex"}
                `}
                style={{ background: "var(--bg-secondary)" }}
            >
                {activeVisitorId ? (
                    <>
                        {/* Chat Header */}
                        <div
                            className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 theme-transition flex-shrink-0"
                            style={{
                                borderBottom: "1px solid var(--border-subtle)",
                                background: "var(--bg-surface)",
                            }}
                        >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                {/* Back button — mobile only */}
                                <button
                                    onClick={handleBackToList}
                                    className="md:hidden p-1.5 -ml-1 rounded-lg transition-colors hover:bg-[var(--bg-surface-hover)]"
                                >
                                    <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                                </button>

                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                        {activeConv?.name || `Visitor #${activeVisitorId.slice(0, 4)}`}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--success)" }} />
                                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Online</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar"
                        >
                            {messages.length === 0 && (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                        Loading conversation...
                                    </p>
                                </div>
                            )}
                            {messages.map((msg) => {
                                const isAdmin = msg.sender === "ADMIN";
                                const cleanMessage = msg.message.replace(/\n\[QUICK_REPLIES\].*/, "");
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className="max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 text-sm"
                                            style={{
                                                background: isAdmin
                                                    ? "var(--chat-admin-bg)"
                                                    : "var(--chat-user-bg)",
                                                color: isAdmin
                                                    ? "var(--chat-admin-text)"
                                                    : "var(--chat-user-text)",
                                                borderBottomRightRadius: isAdmin ? "4px" : undefined,
                                                borderBottomLeftRadius: !isAdmin ? "4px" : undefined,
                                            }}
                                        >
                                            {cleanMessage.startsWith("[FILE]") ? (
                                                (() => {
                                                    const url = cleanMessage.replace("[FILE] ", "").trim();
                                                    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                                                    return isImage ? (
                                                        <div className="mt-1">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={url}
                                                                alt="Attachment"
                                                                className="rounded-lg max-h-48 object-cover border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => window.open(url, "_blank")}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center space-x-2 bg-black/20 p-2 rounded-lg hover:bg-black/30 transition-colors mt-1"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            <span className="underline truncate max-w-[150px]">View File</span>
                                                        </a>
                                                    );
                                                })()
                                            ) : (
                                                cleanMessage
                                            )}
                                            <div className="text-[10px] mt-1 opacity-60">
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div
                            className="p-2.5 sm:p-4 theme-transition flex-shrink-0"
                            style={{
                                background: "var(--bg-surface)",
                                borderTop: "1px solid var(--border-subtle)",
                            }}
                        >
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                                    className="flex-1 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:ring-1 focus:outline-none"
                                    style={{
                                        background: "var(--bg-input)",
                                        color: "var(--text-primary)",
                                        border: "1px solid var(--border-subtle)",
                                    }}
                                    placeholder="Type a reply..."
                                />
                                <button
                                    onClick={handleSendReply}
                                    className="rounded-xl px-3 sm:px-4 transition-colors hover:opacity-90 flex-shrink-0"
                                    style={{
                                        background: "var(--accent)",
                                        color: "#fff",
                                    }}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        className="flex-1 flex flex-col items-center justify-center gap-3 px-6"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <MessageSquare className="w-12 h-12 opacity-30" />
                        <p className="text-sm text-center">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
