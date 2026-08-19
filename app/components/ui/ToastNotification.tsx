"use client";

import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const bgColors: Record<ToastType, string> = {
    success: "#064e3b",
    error: "#7f1d1d",
    warning: "#78350f",
    info: "#1e293b",
  };

  const borderColors: Record<ToastType, string> = {
    success: "#059669",
    error: "#dc2626",
    warning: "#d97706",
    info: "#475569",
  };

  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 18px",
        borderRadius: "14px",
        background: bgColors[toast.type],
        border: `1px solid ${borderColors[toast.type]}`,
        color: "#ffffff",
        fontSize: "13.5px",
        fontWeight: 550,
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.3)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "slideInToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          fontSize: "12px",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {icons[toast.type]}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          fontSize: "14px",
          cursor: "pointer",
          padding: "2px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
