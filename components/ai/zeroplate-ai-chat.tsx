"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  "🚀 How to get started / use this?",
  "🍱 How do I list surplus food?",
  "🤝 How does NGO matching work?",
  "🚚 How do delivery dispatches work?",
  "📊 Where can I see ESG reports?",
];

function deriveClientRecommendations(query: string): string[] {
  const q = query.toLowerCase().trim();

  if (
    q.includes("start") ||
    q.includes("started") ||
    q.includes("how to use") ||
    q.includes("guide") ||
    q.includes("intro")
  ) {
    return [
      "🍱 How do I list surplus food?",
      "🤝 How does NGO matching work?",
      "🚚 How do delivery dispatches work?",
      "🔐 Where do I complete onboarding?",
      "📊 Where can I see ESG reports?",
    ];
  }

  if (
    q.includes("list") ||
    q.includes("surplus") ||
    q.includes("kitchen") ||
    q.includes("food batch") ||
    q.includes("donate")
  ) {
    return [
      "🌡️ What are the food safety temperature rules?",
      "📈 How does Kitchen Forecast prevent waste?",
      "🚚 Who picks up and delivers the surplus?",
      "📊 Where can I see our ESG impact reports?",
    ];
  }

  if (
    q.includes("claim") ||
    q.includes("ngo") ||
    q.includes("receive") ||
    q.includes("browse")
  ) {
    return [
      "📍 How does radius distance matching work?",
      "✅ How do I confirm delivery receipt?",
      "📋 What KYC verification is needed for NGOs?",
      "🍱 How do I browse surplus batches?",
    ];
  }

  if (
    q.includes("delivery") ||
    q.includes("courier") ||
    q.includes("driver") ||
    q.includes("dispatch") ||
    q.includes("route") ||
    q.includes("plate")
  ) {
    return [
      "🚗 Where do I enter vehicle number plate?",
      "🗺️ How does the live route map work?",
      "📦 How do I advance status to Picked Up?",
      "📋 Where do I view delivery history?",
    ];
  }

  if (
    q.includes("esg") ||
    q.includes("report") ||
    q.includes("carbon") ||
    q.includes("metric") ||
    q.includes("impact")
  ) {
    return [
      "🌍 Where is the public impact dashboard?",
      "📄 How do I export an audit report?",
      "🍲 How are meals rescued converted from kg?",
      "🍱 How do I list surplus food?",
    ];
  }

  return [
    "🚀 How to get started / use this?",
    "🍱 How do I list surplus food?",
    "🤝 How does NGO matching work?",
    "🚚 How do delivery dispatches work?",
    "📊 Where can I see ESG reports?",
  ];
}

export default function ZeroPlateAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>(STARTER_PROMPTS);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I'm your ZeroPlate AI Guide. Ask me anything about logging surplus food, claiming NGO batches, dispatching couriers, or navigating our platforms.",
      timestamp: "Just now",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.reply || "I'm here to guide you across ZeroPlate AI.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Update recommendations dynamically based on API suggestions or client deduction
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setRecommendations(data.suggestions);
        } else {
          setRecommendations(deriveClientRecommendations(text));
        }
      } else {
        throw new Error("Failed to receive response");
      }
    } catch (err) {
      console.warn("Chat response error:", err);
      const errorMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content:
          "I'm ready to guide you! Try asking how to list surplus batches, claim food as an NGO, or track active dispatches.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setRecommendations(deriveClientRecommendations(text));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Chat reset! How can I assist you with ZeroPlate AI today?",
        timestamp: "Just now",
      },
    ]);
    setRecommendations(STARTER_PROMPTS);
  };

  // Render markdown-like links [Text](URL) safely while removing stars and hashes
  const formatContent = (rawText: string) => {
    // Strip markdown hashes and stars so they never show up as raw symbols in the UI
    const text = rawText
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*\*\s+/gm, "• ")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/[*#]/g, "");

    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];

      parts.push(
        <Link
          key={`${url}-${match.index}`}
          href={url}
          onClick={() => {
            // Keep chat open but allow navigation
          }}
          className="text-basil font-semibold underline hover:text-[#1F3327] transition-colors"
        >
          {label}
        </Link>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <aside aria-label="ZeroPlate AI Assistant" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanding Interactive Drawer Window */}
      {isOpen && (
        <div
          className={cn(
            "mb-3 w-[92vw] sm:w-[410px] h-[520px] max-h-[82vh] flex flex-col rounded-[12px] border border-line bg-ledger-paper shadow-[0_20px_50px_rgba(36,33,28,0.18)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          )}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-line bg-[#EAE3D4]/80 backdrop-blur-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-basil text-white flex items-center justify-center font-serif text-sm font-bold shadow-xs">
                <span>Z</span>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-sm text-ink leading-none">
                    ZeroPlate AI Guide
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-numeral font-semibold bg-basil/15 text-basil uppercase">
                    AI Online
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5 leading-none">
                  Smart navigator & platform companion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-xs text-ink-soft hover:text-ink hover:bg-black/5 rounded-[4px] transition-colors cursor-pointer"
                title="Reset conversation"
              >
                ↻
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-ink-soft hover:text-ink hover:bg-black/5 rounded-[4px] transition-colors cursor-pointer"
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-ledger-paper/60">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-[10px] leading-relaxed shadow-xs",
                    m.role === "user"
                      ? "bg-basil text-[#FAF7F2] rounded-br-xs"
                      : "bg-[#F7F3E9] text-ink border border-line rounded-bl-xs"
                  )}
                >
                  <div className="whitespace-pre-wrap">{formatContent(m.content)}</div>
                </div>
                <span className="text-[9px] font-mono-numeral text-ink-soft/70 px-1 mt-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="mr-auto items-start max-w-[85%]">
                <div className="p-3 rounded-[10px] bg-[#F7F3E9] border border-line rounded-bl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-basil/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-basil/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-basil/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compact Permanent Context-Aware Recommendations Bar */}
          <div className="px-2.5 py-1 border-t border-line/60 bg-[#EAE3D4]/30 flex items-center gap-1.5 shrink-0 overflow-hidden">
            <span className="text-[10px] text-ink-soft/60 shrink-0 select-none pl-0.5" title="Suggested questions">
              💡
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
              {recommendations.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="px-2 py-0.5 text-[10px] rounded-full border border-line/80 bg-ledger-paper hover:bg-[#EAE3D4] hover:border-basil/50 active:scale-95 text-ink-soft hover:text-ink transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-line bg-[#EAE3D4]/50 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about ZeroPlate AI..."
              disabled={isLoading}
              className="flex-1 bg-ledger-paper border border-line rounded-[6px] px-3 py-2 text-xs text-ink placeholder:text-ink-soft/60 focus:outline-hidden focus:border-basil transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-3.5 py-2 rounded-[6px] bg-basil text-white text-xs font-semibold hover:bg-[#253D2F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Bottom-Right Expanding Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center h-14 rounded-full border border-basil/25 bg-ledger-paper hover:bg-[#EAE3D4] text-basil shadow-[0_8px_25px_rgba(47,75,58,0.22)] hover:shadow-[0_12px_30px_rgba(47,75,58,0.3)] transition-all duration-300 ease-out cursor-pointer overflow-hidden px-3.5"
        aria-label={isOpen ? "Close ZeroPlate AI Chat" : "Ask ZeroPlate AI"}
      >
        {/* Animated AI Icon Container */}
        <div className="w-7 h-7 flex items-center justify-center shrink-0">
          <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300 group-hover:rotate-12 text-basil"
          >
            <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="m4.93 19.07 1.41-1.41" />
            <path d="M12 22a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2a2 2 0 0 1-2 2Z" />
            <path d="m19.07 19.07-1.41-1.41" />
            <path d="M22 12h-2" />
            <path d="m19.07 4.93-1.41 1.41" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>

        {/* Horizontal Expand Text on Hover */}
        <span className="max-w-0 group-hover:max-w-[160px] opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden text-xs font-semibold font-mono tracking-tight text-basil pl-0 group-hover:pl-2.5 select-none">
          Ask ZeroPlate AI
        </span>

        {/* Small pulsing notification dot on the button */}
        {!isOpen && (
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-saffron animate-pulse" />
        )}
      </button>
    </aside>
  );
}
