"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Code, Minus, Link2, Image as ImageIcon,
    AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Type, Pilcrow,
    RemoveFormatting, Maximize2, Minimize2, CheckSquare, X, ExternalLink,
    Palette, HighlighterIcon,
} from "lucide-react";

// ── Types ──
interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    onImageUpload?: (file: File) => Promise<string | null>;
}

// ── Toolbar Button ──
function ToolbarBtn({ icon: Icon, label, active, onClick, danger, disabled }: {
    icon: any; label: string; active?: boolean; onClick: () => void; danger?: boolean; disabled?: boolean;
}) {
    return (
        <button
            onClick={e => { e.preventDefault(); onClick(); }}
            onMouseDown={e => e.preventDefault()}
            disabled={disabled}
            title={label}
            className={`relative p-2 rounded-lg transition-all duration-150 focus:outline-none disabled:opacity-30 ${active
                ? "text-white shadow-md"
                : danger
                    ? "hover:bg-red-500/10 hover:text-red-400"
                    : "hover:bg-[var(--bg-surface-hover)]"
                }`}
            style={active ? {
                background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, #7c3aed))",
                boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
            } : {
                color: "var(--text-secondary)",
            }}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}

// ── Toolbar Divider ──
function ToolbarDivider() {
    return <div className="w-px h-6 mx-1" style={{ background: "var(--border-subtle)" }} />;
}

// ── Link Modal ──
function LinkModal({ onSubmit, onClose }: { onSubmit: (url: string, text: string) => void; onClose: () => void }) {
    const [url, setUrl] = useState("https://");
    const [text, setText] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute left-0 top-full mt-2 z-50 p-4 rounded-2xl shadow-2xl w-80 space-y-3 backdrop-blur-xl"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-primary)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Insert Link</p>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-surface-hover)]">
                    <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                </button>
            </div>
            <input ref={inputRef} type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com"
                className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
            />
            <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Link text (optional)"
                className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 transition-all"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSubmit(url, text); } }}
            />
            <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}>Cancel</button>
                <button onClick={() => onSubmit(url, text)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all"
                    style={{ background: "var(--accent)" }}>Insert</button>
            </div>
        </motion.div>
    );
}

// ── Main Editor ──
export default function RichTextEditor({ value, onChange, placeholder, onImageUpload }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [isEmpty, setIsEmpty] = useState(true);

    // ── Sync value into editor (only on mount / external change) ──
    const lastSetHtml = useRef(value);
    useEffect(() => {
        if (editorRef.current && value !== lastSetHtml.current) {
            editorRef.current.innerHTML = DOMPurify.sanitize(value);
            lastSetHtml.current = value;
            updateCounts();
        }
    }, [value]);

    // On mount, set initial content
    useEffect(() => {
        if (editorRef.current && value) {
            editorRef.current.innerHTML = DOMPurify.sanitize(value);
            updateCounts();
        }
    }, []);

    // ── Update counts ──
    const updateCounts = useCallback(() => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText || "";
        const words = text.split(/\s+/).filter(Boolean);
        setWordCount(words.length);
        setCharCount(text.length);
        setIsEmpty(!text.trim());
    }, []);

    // ── Detect active formatting ──
    const detectFormats = useCallback(() => {
        const formats = new Set<string>();
        try {
            if (document.queryCommandState("bold")) formats.add("bold");
            if (document.queryCommandState("italic")) formats.add("italic");
            if (document.queryCommandState("underline")) formats.add("underline");
            if (document.queryCommandState("strikeThrough")) formats.add("strikethrough");
            if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
            if (document.queryCommandState("insertOrderedList")) formats.add("ol");

            // Check block format
            const block = document.queryCommandValue("formatBlock");
            if (block) formats.add(block.toLowerCase());

            // Check alignment
            const align = document.queryCommandValue("justifyLeft") ? "left" :
                document.queryCommandValue("justifyCenter") ? "center" :
                    document.queryCommandValue("justifyRight") ? "right" : "";
            if (align) formats.add(`align-${align}`);

            // Check if in code/quote
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node: Node | null = sel.anchorNode;
                while (node && node !== editorRef.current) {
                    if (node.nodeName === "BLOCKQUOTE") formats.add("blockquote");
                    if (node.nodeName === "PRE" || node.nodeName === "CODE") formats.add("code");
                    if (node.nodeName === "A") formats.add("link");
                    node = node.parentNode;
                }
            }
        } catch { }
        setActiveFormats(formats);
    }, []);

    // ── Execute command ──
    const exec = useCallback((cmd: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        emitChange();
        detectFormats();
    }, []);

    // ── Emit change ──
    const emitChange = useCallback(() => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        lastSetHtml.current = html;
        onChange(html);
        updateCounts();
    }, [onChange, updateCounts]);

    // ── Handle input ──
    const handleInput = useCallback(() => {
        emitChange();
        detectFormats();
    }, [emitChange, detectFormats]);

    // ── Handle selection change ──
    useEffect(() => {
        const handleSelectionChange = () => {
            if (editorRef.current?.contains(document.activeElement) ||
                editorRef.current?.contains(window.getSelection()?.anchorNode || null)) {
                detectFormats();
            }
        };
        document.addEventListener("selectionchange", handleSelectionChange);
        return () => document.removeEventListener("selectionchange", handleSelectionChange);
    }, [detectFormats]);

    // ── Format Block ──
    const formatBlock = useCallback((tag: string) => {
        exec("formatBlock", `<${tag}>`);
    }, [exec]);

    // ── Insert Link ──
    const insertLink = useCallback((url: string, text: string) => {
        editorRef.current?.focus();
        if (text) {
            const sel = window.getSelection();
            if (sel) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                const a = document.createElement("a");
                a.href = url;
                a.textContent = text;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.style.color = "#818cf8";
                a.style.textDecoration = "underline";
                range.insertNode(a);
                range.setStartAfter(a);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else {
            exec("createLink", url);
        }
        setShowLinkModal(false);
        emitChange();
    }, [exec, emitChange]);

    // ── Insert Image ──
    const handleImageUpload = useCallback(async (file: File) => {
        if (!onImageUpload) return;
        const url = await onImageUpload(file);
        if (url) {
            editorRef.current?.focus();
            exec("insertHTML", `<figure style="margin:1.5em 0;text-align:center"><img src="${url}" alt="" style="max-width:100%;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15)" /><figcaption style="margin-top:0.5em;font-size:0.85em;color:#888;font-style:italic">Image caption</figcaption></figure>`);
        }
    }, [onImageUpload, exec]);

    // ── Insert Code Block ──
    const insertCode = useCallback(() => {
        exec("insertHTML", `<pre style="background:rgba(0,0,0,0.4);border-radius:12px;padding:1em 1.25em;font-family:'SF Mono','Fira Code',monospace;font-size:13px;line-height:1.6;overflow-x:auto;border:1px solid rgba(255,255,255,0.08);margin:1em 0"><code>// Your code here</code></pre><p><br/></p>`);
    }, [exec]);

    // ── Insert Divider ──
    const insertDivider = useCallback(() => {
        exec("insertHTML", `<hr style="border:none;border-top:2px solid rgba(255,255,255,0.08);margin:2em 0" /><p><br/></p>`);
    }, [exec]);

    // ── Keyboard shortcuts ──
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const mod = e.metaKey || e.ctrlKey;
        if (mod && e.key === "b") { e.preventDefault(); exec("bold"); }
        else if (mod && e.key === "i") { e.preventDefault(); exec("italic"); }
        else if (mod && e.key === "u") { e.preventDefault(); exec("underline"); }
        else if (mod && e.key === "k") { e.preventDefault(); setShowLinkModal(true); }
        else if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); exec("undo"); }
        else if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); exec("redo"); }
        else if (e.key === "Tab") {
            e.preventDefault();
            exec("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
        }
    }, [exec]);

    // ── Handle paste — clean up ──
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        exec("insertText", text);
    }, [exec]);

    const isActive = (fmt: string) => activeFormats.has(fmt);

    return (
        <div
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${fullscreen ? "fixed inset-4 z-[60]" : ""}`}
            style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-primary)",
                boxShadow: fullscreen ? "0 25px 80px rgba(0,0,0,0.5)" : "0 2px 12px rgba(0,0,0,0.06)",
            }}
        >
            {/* ─── Toolbar ─── */}
            <div
                className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-3 py-2 backdrop-blur-xl"
                style={{
                    background: "color-mix(in srgb, var(--bg-surface) 92%, transparent)",
                    borderBottom: "1px solid var(--border-subtle)",
                }}
            >
                {/* Text formatting */}
                <ToolbarBtn icon={Bold} label="Bold (⌘B)" active={isActive("bold")} onClick={() => exec("bold")} />
                <ToolbarBtn icon={Italic} label="Italic (⌘I)" active={isActive("italic")} onClick={() => exec("italic")} />
                <ToolbarBtn icon={Underline} label="Underline (⌘U)" active={isActive("underline")} onClick={() => exec("underline")} />
                <ToolbarBtn icon={Strikethrough} label="Strikethrough" active={isActive("strikethrough")} onClick={() => exec("strikeThrough")} />

                <ToolbarDivider />

                {/* Headings */}
                <ToolbarBtn icon={Pilcrow} label="Paragraph" active={isActive("p") || isActive("div")} onClick={() => formatBlock("p")} />
                <ToolbarBtn icon={Heading1} label="Heading 1" active={isActive("h1")} onClick={() => formatBlock("h1")} />
                <ToolbarBtn icon={Heading2} label="Heading 2" active={isActive("h2")} onClick={() => formatBlock("h2")} />
                <ToolbarBtn icon={Heading3} label="Heading 3" active={isActive("h3")} onClick={() => formatBlock("h3")} />

                <ToolbarDivider />

                {/* Lists */}
                <ToolbarBtn icon={List} label="Bullet List" active={isActive("ul")} onClick={() => exec("insertUnorderedList")} />
                <ToolbarBtn icon={ListOrdered} label="Numbered List" active={isActive("ol")} onClick={() => exec("insertOrderedList")} />

                <ToolbarDivider />

                {/* Blocks */}
                <ToolbarBtn icon={Quote} label="Blockquote" active={isActive("blockquote")} onClick={() => formatBlock("blockquote")} />
                <ToolbarBtn icon={Code} label="Code Block" active={isActive("code")} onClick={insertCode} />
                <ToolbarBtn icon={Minus} label="Divider" onClick={insertDivider} />

                <ToolbarDivider />

                {/* Insert */}
                <div className="relative">
                    <ToolbarBtn icon={Link2} label="Link (⌘K)" active={isActive("link")} onClick={() => setShowLinkModal(!showLinkModal)} />
                    <AnimatePresence>
                        {showLinkModal && <LinkModal onSubmit={insertLink} onClose={() => setShowLinkModal(false)} />}
                    </AnimatePresence>
                </div>
                <ToolbarBtn icon={ImageIcon} label="Image" onClick={() => fileInputRef.current?.click()} disabled={!onImageUpload} />
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />

                <ToolbarDivider />

                {/* Alignment */}
                <ToolbarBtn icon={AlignLeft} label="Align Left" onClick={() => exec("justifyLeft")} />
                <ToolbarBtn icon={AlignCenter} label="Align Center" onClick={() => exec("justifyCenter")} />
                <ToolbarBtn icon={AlignRight} label="Align Right" onClick={() => exec("justifyRight")} />

                <ToolbarDivider />

                {/* Actions */}
                <ToolbarBtn icon={RemoveFormatting} label="Clear Formatting" onClick={() => exec("removeFormat")} />
                <ToolbarBtn icon={Undo2} label="Undo (⌘Z)" onClick={() => exec("undo")} />
                <ToolbarBtn icon={Redo2} label="Redo (⌘⇧Z)" onClick={() => exec("redo")} />

                <div className="flex-1" />

                {/* Fullscreen */}
                <ToolbarBtn
                    icon={fullscreen ? Minimize2 : Maximize2}
                    label={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    onClick={() => setFullscreen(!fullscreen)}
                />
            </div>

            {/* ─── Editor Area ─── */}
            <div
                className="relative overflow-y-auto"
                style={{ minHeight: fullscreen ? "calc(100% - 100px)" : "500px", maxHeight: fullscreen ? "calc(100% - 100px)" : "800px" }}
            >
                {/* Placeholder */}
                {isEmpty && (
                    <div
                        className="absolute top-0 left-0 px-8 py-6 text-base pointer-events-none select-none"
                        style={{ color: "var(--text-muted)", opacity: 0.4, lineHeight: 1.8 }}
                    >
                        {placeholder || "Start writing your story..."}
                    </div>
                )}

                {/* ContentEditable */}
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onClick={detectFormats}
                    className="outline-none px-8 py-6 prose-editor"
                    style={{
                        color: "var(--text-primary)",
                        fontSize: "16px",
                        lineHeight: "1.85",
                        fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
                        caretColor: "var(--accent)",
                        minHeight: "inherit",
                        wordBreak: "break-word",
                    }}
                />
            </div>

            {/* ─── Bottom Bar ─── */}
            <div
                className="flex items-center justify-between px-5 py-2.5 text-[10px] font-semibold tracking-wide"
                style={{ background: "var(--bg-input)", borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
            >
                <div className="flex items-center gap-5">
                    <span>{wordCount} words</span>
                    <span>{charCount} chars</span>
                    <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="opacity-50">⌘B Bold</span>
                    <span className="opacity-50">⌘I Italic</span>
                    <span className="opacity-50">⌘K Link</span>
                </div>
            </div>

            {/* ─── Inline Styles for Editor Content ─── */}
            <style>{`
                .prose-editor h1 { font-size: 2em; font-weight: 800; margin: 0.8em 0 0.4em; line-height: 1.2; letter-spacing: -0.02em; color: var(--text-primary); }
                .prose-editor h2 { font-size: 1.5em; font-weight: 700; margin: 0.75em 0 0.35em; line-height: 1.3; letter-spacing: -0.01em; color: var(--text-primary); }
                .prose-editor h3 { font-size: 1.25em; font-weight: 700; margin: 0.7em 0 0.3em; line-height: 1.4; color: var(--text-primary); }
                .prose-editor p { margin: 0.5em 0; }
                .prose-editor blockquote {
                    border-left: 3px solid var(--accent, #6366f1);
                    padding: 0.75em 1.25em; margin: 1.25em 0;
                    background: rgba(99,102,241,0.06); border-radius: 0 12px 12px 0;
                    font-style: italic; color: var(--text-secondary);
                }
                .prose-editor pre {
                    background: rgba(0,0,0,0.4); border-radius: 12px; padding: 1em 1.25em;
                    font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
                    font-size: 13px; line-height: 1.6; overflow-x: auto;
                    border: 1px solid rgba(255,255,255,0.08); margin: 1em 0;
                }
                .prose-editor code {
                    font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
                    font-size: 0.9em; padding: 0.15em 0.4em; border-radius: 6px;
                    background: rgba(99,102,241,0.1); color: #a78bfa;
                }
                .prose-editor pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
                .prose-editor a { color: #818cf8; text-decoration: underline; text-underline-offset: 3px; transition: color 0.15s; }
                .prose-editor a:hover { color: #a78bfa; }
                .prose-editor ul, .prose-editor ol { padding-left: 1.5em; margin: 0.75em 0; }
                .prose-editor li { margin: 0.3em 0; }
                .prose-editor ul li { list-style-type: disc; }
                .prose-editor ol li { list-style-type: decimal; }
                .prose-editor hr { border: none; border-top: 2px solid rgba(255,255,255,0.08); margin: 2em 0; }
                .prose-editor img { max-width: 100%; border-radius: 12px; margin: 1em 0; }
                .prose-editor figure { margin: 1.5em 0; text-align: center; }
                .prose-editor figcaption { margin-top: 0.5em; font-size: 0.85em; color: var(--text-muted); font-style: italic; }
                .prose-editor strong { font-weight: 700; }
                .prose-editor em { font-style: italic; }
                .prose-editor u { text-decoration: underline; text-underline-offset: 3px; }
                .prose-editor s { text-decoration: line-through; }
                .prose-editor ::selection { background: rgba(99,102,241,0.3); }
            `}</style>
        </div>
    );
}
