import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

export default function BottomSheet({ isOpen, onClose, title, children, className }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={clsx(
        'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl animate-slide-up',
        'pb-safe max-h-[90vh] flex flex-col',
        className
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-surface-200 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200">
            <h2 className="text-lg font-display font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-100 active:scale-95 transition-all"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {children}
        </div>
      </div>
    </>
  )
}
