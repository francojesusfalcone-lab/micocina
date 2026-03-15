import React from 'react'
import { Crown, Lock } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import clsx from 'clsx'

// Badge small "Premium" to show on features
export function PremiumBadge({ className }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
      'bg-amber-100 text-amber-700',
      className
    )}>
      <Crown size={10} />
      PREMIUM
    </span>
  )
}

// Gate: shows upgrade prompt if user is on free plan
export function PremiumGate({ children, feature = 'esta función' }) {
  const isPremium = useAppStore((s) => s.isPremium())

  if (isPremium) return children

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40 select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
            <Lock size={20} className="text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Función Premium
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Activá {feature} con Premium por solo $5/mes
          </p>
          <button className="btn-primary text-sm py-2 px-5 bg-amber-500 hover:bg-amber-600">
            Activar Premium
          </button>
        </div>
      </div>
    </div>
  )
}
