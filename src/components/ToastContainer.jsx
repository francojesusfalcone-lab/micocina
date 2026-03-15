import React from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import clsx from 'clsx'

const ICONS = {
  success: <CheckCircle size={18} className="text-primary-600 shrink-0" />,
  error:   <XCircle    size={18} className="text-red-500 shrink-0" />,
  info:    <Info       size={18} className="text-blue-500 shrink-0" />,
}

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'animate-fade-in pointer-events-auto',
            'flex items-center gap-3 bg-white rounded-2xl shadow-card-hover border border-surface-200',
            'px-4 py-3 max-w-sm mx-auto w-full'
          )}
        >
          {ICONS[toast.type || 'info']}
          <span className="text-sm font-medium text-gray-800 flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
