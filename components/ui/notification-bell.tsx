"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { BellIcon, CheckIcon } from "@/components/icons/ledger-icons";
import { cn } from "@/lib/utils";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  readStatus: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  isAdmin?: boolean;
}

export function NotificationBell({ isAdmin = false }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
    if (isFetchingRef.current) return;
    if (typeof window !== "undefined" && (!window.navigator.onLine || document.visibilityState === "hidden")) {
      return;
    }
    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/notifications", {
        signal,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else if (res.status === 401) {
        // User session inactive or logged out
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err: unknown) {
      if ((err instanceof Error || (typeof DOMException !== "undefined" && err instanceof DOMException)) && err.name === "AbortError") {
        return;
      }
      console.warn("Notice: Notification sync paused:", err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    fetchNotifications(controller.signal);

    const interval = setInterval(() => {
      if (isMounted && typeof window !== "undefined" && window.navigator.onLine && document.visibilityState === "visible") {
        fetchNotifications(controller.signal);
      }
    }, 45000);

    const handleVisibilityChange = () => {
      if (isMounted && document.visibilityState === "visible" && window.navigator.onLine) {
        fetchNotifications(controller.signal);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readStatus: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn("Notice: Error marking all read:", err);
    }
  };

  const handleMarkItemRead = async (id: string) => {
    try {
      await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn("Notice: Error marking item read:", err);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={cn(
          "relative p-2 rounded-xl border transition-colors cursor-pointer",
          isAdmin
            ? "border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
            : "border-line text-ink hover:bg-[#EAE3D4]"
        )}
        aria-label="Notifications"
        title="Notifications"
      >
        <BellIcon size={18} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-mono flex items-center justify-center font-bold shadow-2xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden",
            isAdmin
              ? "bg-white border-slate-200 text-slate-900"
              : "bg-[#FAF6EE] border-line text-ink"
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "px-4 py-3 border-b flex items-center justify-between shrink-0",
              isAdmin ? "border-slate-200 bg-slate-50 text-slate-900" : "border-line bg-[#EFE8D8] text-ink"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-sans cursor-pointer font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            className={cn(
              "max-h-80 overflow-y-auto divide-y",
              isAdmin
                ? "bg-white divide-slate-100"
                : "bg-[#FAF6EE] divide-line/60"
            )}
          >
            {notifications.length === 0 ? (
              <div
                className={cn(
                  "p-6 text-center text-xs",
                  isAdmin ? "bg-white text-slate-500" : "bg-[#FAF6EE] text-ink-soft"
                )}
              >
                No notifications logged yet.
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.readStatus && handleMarkItemRead(n._id)}
                  className={cn(
                    "p-3.5 text-xs transition-colors cursor-pointer border-l-2",
                    !n.readStatus
                      ? isAdmin
                        ? "bg-emerald-50/50 hover:bg-emerald-50/80 border-l-emerald-600 text-slate-900"
                        : "bg-[#F3ECE0] hover:bg-[#EBE3D4] border-l-saffron text-ink"
                      : isAdmin
                        ? "bg-white hover:bg-slate-50 border-l-transparent text-slate-600"
                        : "bg-[#FAF6EE] hover:bg-[#F2ECE0] border-l-transparent text-ink"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">{n.title}</span>
                    <span
                      className={cn(
                        "text-[10px] shrink-0 font-mono",
                        isAdmin ? "text-slate-400" : "text-ink-soft"
                      )}
                    >
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[11px] line-clamp-2",
                      isAdmin ? "text-slate-600" : "text-ink-soft"
                    )}
                  >
                    {n.message}
                  </p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "inline-block mt-1.5 text-[11px] hover:underline font-medium",
                        isAdmin ? "text-emerald-700" : "text-basil"
                      )}
                    >
                      View Details →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className={cn(
              "px-4 py-2.5 border-t text-center shrink-0",
              isAdmin ? "border-slate-200 bg-slate-50 text-slate-700" : "border-line bg-[#EFE8D8]"
            )}
          >
            <Link
              href="/app/notifications"
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-xs font-medium transition-colors",
                isAdmin
                  ? "text-emerald-800 hover:text-emerald-950 font-semibold"
                  : "text-ink hover:text-basil"
              )}
            >
              View Full Notifications Center →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
