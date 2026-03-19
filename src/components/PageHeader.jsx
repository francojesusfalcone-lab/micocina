import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import clsx from 'clsx'

export default function PageHeader({ title, subtitle, back, action, className }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <header className={clsx('page-header dark:bg-gray-950/90 dark:border-gray-800 pt-safe', className)}>
      <div className="flex items-center gap-3">
        {back ? (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-100 dark:bg-gray-800 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        ) : (
          /* Logo en páginas principales */
          <div className="w-14 h-14 shrink-0">
            {!imgError ? (
              <img
                src="/logo-icon.png"
                alt="MiCuchina"
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-3xl">🍳</span>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="page-title dark:text-gray-100 truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="shrink-0">{action}</div>
        )}
      </div>
    </header>
  )
}
