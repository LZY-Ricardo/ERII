"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // 确保在客户端渲染
  useEffect(() => {
    console.log("ToastProvider mounted");
  }, []);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    console.log("addToast called:", { message, type, duration });
    const id = ++toastIdRef.current;
    const toast = { id, message, type, duration };

    setToasts((prev) => {
      const newToasts = [...prev, toast];
      console.log("Toasts updated:", newToasts);
      return newToasts;
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    console.log("removeToast called:", id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => addToast(message, "success", duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, "error", duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, "warning", duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, "info", duration), [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  console.log("ToastContainer rendering, toasts:", toasts);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const { id, message, type } = toast;

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={() => onRemove(id)} aria-label="关闭">
        <X size={16} />
      </button>
    </div>
  );
}
