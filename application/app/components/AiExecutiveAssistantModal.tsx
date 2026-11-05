"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, X, Send, Loader2, Copy, Check, RotateCcw, Download, Bot, User, Zap, Wrench, FileText, Lightbulb, CheckCircle2, Leaf } from "lucide-react";
import { fetchAiLlmChat, buildFacilityPrompt } from "../lib/api";

interface AiExecutiveAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  currentData?: {
    healthScore?: number;
    energyKwh?: number;
    peakKw?: number;
    anomalies?: string[];
    maintenanceAlerts?: string[];
    safetyStatus?: string;
    sustainabilityScore?: number;
  };
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isSummary?: boolean;
}

export default function AiExecutiveAssistantModal({
  isOpen,
  onClose,
  facilityName,
  currentData,
}: AiExecutiveAssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick action prompt chips with Lucide icons
  const quickPrompts = [
    {
      icon: FileText,
      label: "Generate Live Executive Briefing",
      prompt: "Generate an Executive Operational Briefing with 4 prioritized step-by-step action items for facility leadership.",
    },
    {
      icon: Zap,
      label: "Peak Demand & HVAC Strategy",
      prompt: "How can we shave peak energy demand between 2 PM - 5 PM by 20% while maintaining comfort baseline?",
    },
    {
      icon: Wrench,
      label: "Predictive Maintenance Plan",
      prompt: "Provide a 14-day preventive overhaul schedule for critical HVAC chillers and water distribution pumps.",
    },
    {
      icon: Leaf,
      label: "ESG Carbon Neutral Roadmap",
      prompt: "What immediate low-capex measures can we take this quarter to improve our campus ESG Sustainability score?",
    },
  ];

  // Auto-generate executive summary on first open if empty
  const handleAutoGenerateSummary = useCallback(async () => {
    setLoading(true);
    const prompt = buildFacilityPrompt({
      facilityName: facilityName || "Engineering College",
      healthScore: currentData?.healthScore || 94,
      energyKwh: currentData?.energyKwh || 14280,
      peakKw: currentData?.peakKw || 480,
      anomalies: currentData?.anomalies || [
        "HVAC Chiller-01 harmonic vibration alert (RUL: 14d)",
        "Water Tank 2 overflow sensor anomaly",
      ],
      maintenanceAlerts: currentData?.maintenanceAlerts || [
        "Chiller bearing lubrication work order #WO-418",
        "Transformer insulation inspection",
      ],
      safetyStatus: currentData?.safetyStatus || "97.1% SLA Compliant",
      sustainabilityScore: currentData?.sustainabilityScore || 91,
    });

    const userMsg: ChatMessage = {
      id: `user-${crypto.randomUUID()}`,
      sender: "user",
      text: `Generate Live AI Executive Summary & Step-by-Step Action Plan for ${facilityName}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([userMsg]);

    try {
      const aiReply = await fetchAiLlmChat(prompt);
      const aiMsg: ChatMessage = {
        id: `ai-${crypto.randomUUID()}`,
        sender: "ai",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSummary: true,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `ai-err-${crypto.randomUUID()}`,
        sender: "ai",
        text: "Could not reach the neural LLM engine. Please verify network connectivity or try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [currentData, facilityName]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Opening the dialog intentionally starts an async request that updates the conversation.
      handleAutoGenerateSummary();
    }
  }, [handleAutoGenerateSummary, isOpen, messages.length]);

  if (!isOpen) return null;

  async function handleSendMessage(customText?: string) {
    const text = customText || inputValue.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${crypto.randomUUID()}`,
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue("");
    setLoading(true);

    try {
      const aiReply = await fetchAiLlmChat(text);
      const aiMsg: ChatMessage = {
        id: `ai-${crypto.randomUUID()}`,
        sender: "ai",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `ai-err-${crypto.randomUUID()}`,
        sender: "ai",
        text: "Error processing query through the LLM backend. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleExportReport(text: string) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CampusIQ_AI_Executive_Summary_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        data-lenis-prevent="true"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
      >
        {/* Header Bar */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  CampusIQ AI Executive Copilot
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800/80">
                  Live Neural Engine
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                Powered by DeepBot API &bull; Synthesizing live data for{" "}
                <span className="text-orange-500 font-black">{facilityName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoGenerateSummary}
              disabled={loading}
              title="Regenerate Executive Briefing"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Summary</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Chips Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
            Prompt Chips:
          </span>
          {quickPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={loading}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat / Executive Briefing Stream Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain p-6 space-y-6">
          {messages.map((msg) => {
            const isAi = msg.sender === "ai";
            return (
              <div
                key={msg.id}
                className={`flex gap-4 ${isAi ? "items-start" : "items-start flex-row-reverse"}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isAi
                      ? "bg-gradient-to-tr from-orange-500 to-amber-500 text-white"
                      : "bg-slate-800 dark:bg-slate-700 text-white"
                  }`}
                >
                  {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`rounded-3xl p-6 transition-all shadow-xs ${
                    isAi
                      ? "w-full max-w-[95%] bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100"
                      : "max-w-[80%] bg-orange-500 text-white font-semibold"
                  }`}
                >
                  {/* Header inside AI card */}
                  {isAi && (
                    <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-black text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600 dark:text-orange-400 font-extrabold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> CampusIQ LLM Intelligence
                        </span>
                        <span>&bull;</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          title="Copy text"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleExportReport(msg.text)}
                          title="Download Markdown Report"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export .md</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Body Content with ReactMarkdown + RemarkGFM */}
                  {isAi ? (
                    <div className="ai-markdown-content space-y-3">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-5 mb-3 pb-2 border-b border-orange-500/30 flex items-center gap-2.5">
                              <Sparkles className="w-6 h-6 text-orange-500 shrink-0" />
                              <span>{children}</span>
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-black text-orange-600 dark:text-orange-400 mt-5 mb-2.5 flex items-center gap-2">
                              <Lightbulb className="w-5 h-5 shrink-0" />
                              <span>{children}</span>
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-black text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{children}</span>
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mt-3 mb-1.5">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed my-2 font-medium">
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-slate-900 dark:text-white font-black">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="text-slate-600 dark:text-slate-400 italic">
                              {children}
                            </em>
                          ),
                          hr: () => (
                            <hr className="my-5 border-t border-slate-200/90 dark:border-slate-700/80" />
                          ),
                          ul: ({ children }) => (
                            <ul className="space-y-1.5 my-3 pl-2">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="space-y-1.5 my-3 pl-4 list-decimal text-xs text-slate-700 dark:text-slate-200 font-bold">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                              <div className="flex-1">{children}</div>
                            </li>
                          ),
                          table: ({ children }) => (
                            <div className="w-full my-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                              <table className="w-full text-left border-collapse bg-white dark:bg-slate-900 text-xs">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black border-b border-slate-200 dark:border-slate-700">
                              {children}
                            </thead>
                          ),
                          tbody: ({ children }) => (
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                              {children}
                            </tbody>
                          ),
                          tr: ({ children }) => (
                            <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                              {children}
                            </tr>
                          ),
                          th: ({ children }) => (
                            <th className="p-3.5 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="p-3.5 text-xs font-semibold leading-relaxed">
                              {children}
                            </td>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 border-l-4 border-orange-500 text-xs font-semibold text-slate-800 dark:text-orange-200 my-3">
                              {children}
                            </blockquote>
                          ),
                          code: ({ className, children }) => {
                            const isInline = !className && !String(children).includes("\n");
                            return isInline ? (
                              <code className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 font-mono text-[11px] font-black text-orange-600 dark:text-orange-400">
                                {children}
                              </code>
                            ) : (
                              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-3 border border-slate-800">
                                <code>{children}</code>
                              </pre>
                            );
                          },
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing / Loading indicator */}
          {loading && (
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 animate-bounce shadow-xs">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span>Processing live campus telemetry through DeepBot Neural LLM...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask AI Facility Copilot about ${facilityName} energy, maintenance, or steps to do...`}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition shadow-xs"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-orange-500/30 transition cursor-pointer"
            >
              <span>Ask AI</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
