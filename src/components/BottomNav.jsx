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
    { id: 'dashboard', label: 'Inicio',    icon: LayoutDashboard, path: '/' },
    { id: 'products',  label: 'Productos', icon: ShoppingBag,     path: '/productos' },
    { id: 'orders',    label: 'Comandas',  icon: ClipboardList,   path: '/comandas' },
    { id: 'stock',     label: 'Stock',     icon: Package,         path: '/stock' },
    { id: 'settings',  label: 'Config',    icon: Settings,        path: '/configuracion' },
  ]

  return (
    <nav style={{backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)'}} className="fixed bottom-0 left-0 right-0 z-40 shadow-nav pb-safe max-w-md mx-auto">
      <div className="flex items-center justify-around px-2 h-16">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path, premium }) => {
          const isActive = location.pathname === path ||
            (path === '/ia' && location.pathname.startsWith('/ia'))
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-2xl transition-all duration-200 active:scale-95',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              )}
            >
              <div className={clsx(
                'flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 relative',
                isActive
                  ? premium ? 'bg-primary-600 scale-110' : 'bg-primary-50 scale-110'
                  : ''
              )}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive && premium ? 'text-white' : ''}
                />
              </div>
              <span className={clsx(
                'text-[10px] font-semibold transition-all duration-200',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
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
