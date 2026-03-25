import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, ClipboardList,
  Package, Settings, Sparkles, BarChart2
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../store/appStore'

export default function BottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const isPremium = useAppStore((s) => s.isPremium())

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Inicio',    icon: LayoutDashboard, path: '/',              color: 'text-emerald-500',  bg: 'bg-emerald-50'  },
    { id: 'products',  label: 'Productos', icon: ShoppingBag,     path: '/productos',     color: 'text-blue-500',     bg: 'bg-blue-50'     },
    { id: 'orders',    label: 'Comandas',  icon: ClipboardList,   path: '/comandas',      color: 'text-violet-500',   bg: 'bg-violet-50'   },
    { id: 'stock',     label: 'Stock',     icon: Package,         path: '/stock',         color: 'text-amber-500',    bg: 'bg-amber-50'    },
    { id: 'settings',  label: 'Config',    icon: Settings,        path: '/configuracion', color: 'text-rose-500',     bg: 'bg-rose-50'     },
  ]

  return (
    <nav style={{backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)'}} className="fixed bottom-0 left-0 right-0 z-40 shadow-nav pb-safe max-w-md mx-auto">
      <div className="flex items-center justify-around px-2 h-16">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path, color, bg }) => {
          const isActive = location.pathname === path ||
            (path === '/ia' && location.pathname.startsWith('/ia'))
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl transition-all duration-200 active:scale-95"
            >
              <div className={clsx(
                'flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-200',
                isActive ? `${bg} scale-110` : ''
              )}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? color : 'text-app-faint'}
                />
              </div>
              <span className={clsx(
                'text-[10px] font-bold transition-all duration-200',
                isActive ? color : 'text-app-faint'
              )}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
