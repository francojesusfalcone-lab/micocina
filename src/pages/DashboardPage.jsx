import React, { useState } from 'react'
import {
  TrendingUp, TrendingDown, ShoppingBag, ClipboardList,
  AlertTriangle, ChevronRight, Plus, Zap, Crown,
  Clock, Star, CreditCard, BarChart2, Wallet
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, formatCurrency } from '../store/appStore'
import { PremiumBadge } from '../components/PremiumGate'
import { useDashboardStats, useActiveOrders, useRealProfit } from '../hooks/useDashboard'
import { useJornada, abrirJornada, cerrarJornada } from '../hooks/useJornada'
import { STATUS_CONFIG, PAYMENT_METHODS } from '../hooks/useOrders'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import GlobalSearch from '../components/GlobalSearch'
import clsx from 'clsx'

function HeroStatCard({ label, value, sub, change, marginPct }) {
  const marginColor = marginPct === null ? null : marginPct >= 30 ? 'text-gold-300' : marginPct >= 15 ? 'text-amber-300' : 'text-red-300'
  return (
    <div className="relative overflow-hidden bg-primary-700 rounded-2xl p-4 flex-1 min-w-0">
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-primary-600/40" />
      <div className="absolute -bottom-6 -right-8 w-28 h-28 rounded-full bg-primary-800/30" />
      <div className="relative z-10">
        <p className="text-primary-200 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-gold-400 text-3xl font-display font-bold mt-1 leading-none">{value}</p>
        <p className="text-primary-300 text-xs mt-1.5">{sub}</p>
        {marginPct !== null && (
          <div className={clsx('text-xs font-bold mt-1', marginColor)}>
            Margen del día: {marginPct}%
          </div>
        )}
        {change !== null && change !== undefined && (
          <div className={clsx('flex items-center gap-1 text-xs font-bold mt-1', change >= 0 ? 'text-gold-300' : 'text-red-300')}>
            {change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {change >= 0 ? '+' : ''}{change.toFixed(0)}% vs anterior
          </div>
        )}
      </div>
    </div>
  )
}



function StatCard({ label, value, sub, icon: Icon, color = 'green' }) {
  const colors = {
    green:  { bg: 'bg-primary-50', icon: 'text-primary-600' },
    blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600' },
    amber:  { bg: 'bg-amber-50',   icon: 'text-amber-600' },
    red:    { bg: 'bg-red-50',     icon: 'text-red-500' },
    gold:   { bg: 'bg-gold-50',    icon: 'text-gold-600' },
  }
  const c = colors[color] || colors.green
  return (
    <div className="card flex-1 min-w-0 dark:bg-gray-900 dark:border-gray-800">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${c.bg}`}>
        <Icon size={15} className={c.icon} />
      </div>
      <div className="text-base font-display font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">{value}</div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick, color = 'gray', badge }) {
  const colors = {
    green: 'bg-primary-600 text-white shadow-sm shadow-primary-200',
    gray:  'bg-surface-100 text-gray-700',
  }
  return (
    <button
      onClick={onClick}
      className={clsx('relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95', colors[color])}
    >
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <Icon size={22} />
      <span className="text-[11px] font-semibold leading-tight text-center">{label}</span>
    </button>
  )
}

function Skeleton({ className }) {
  return <div className={clsx('animate-pulse bg-surface-200 rounded-xl', className)} />
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const [imgError, setImgError] = useState(false)

  const stats = useDashboardStats('day')
  const activeOrders = useActiveOrders()
  const profit = useRealProfit('day', stats?.revenue ?? 0)
  const jornada = useJornada()
  const [confirmCerrar, setConfirmCerrar] = useState(false)

  const recipeCount = useLiveQuery(() => db.recipes.count(), [], null)
  const showGuide = recipeCount === 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const emoji = hour < 12 ? '☀️' : hour < 19 ? '👋' : '🌙'
  const isLoading = stats === null

  function formatPeakHour(h) {
    if (h === null) return '—'
    const suffix = h >= 12 ? 'pm' : 'am'
    return `${h % 12 || 12}:00 ${suffix}`
  }

  return (
    <div className="flex flex-col min-h-full bg-surface-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 px-5 pt-safe border-b border-surface-200 dark:border-gray-800">
        <div className="pt-4 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Logo pequeño en header */}
            {!imgError ? (
              <img
                src="/logo-icon.png"
                alt="MiCuchina"
                className="w-10 h-10 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-3xl">🍳</span>
            )}
            <div>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">{greeting} {emoji}</p>
              <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mt-0.5 leading-tight">
                {settings.businessName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            {/* Botón jornada */}
            {!jornada.abierto ? (
              <button
                onClick={abrirJornada}
                className="flex items-center gap-1.5 bg-primary-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-all"
              >
                <span className="text-base leading-none">🟢</span> Abrir
              </button>
            ) : confirmCerrar ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setConfirmCerrar(false)} className="text-xs font-bold text-gray-500 bg-surface-100 px-2 py-2 rounded-xl">Cancelar</button>
                <button onClick={() => { cerrarJornada(); setConfirmCerrar(false) }} className="text-xs font-bold text-white bg-red-500 px-2 py-2 rounded-xl">Confirmar</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCerrar(true)}
                className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all"
              >
                <span className="text-base leading-none">🔴</span> Cerrar
              </button>
            )}
            {/* Badge Premium */}
            {!isPremium ? (
              <button onClick={() => navigate('/premium')} className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm shadow-amber-200 active:scale-95 transition-all">
                <Crown size={13} /> Premium
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-bold px-3 py-2 rounded-xl border border-primary-200">
                <Star size={13} /> Premium
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner jornada cerrada */}
      {!jornada.abierto && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs font-semibold text-amber-700">Jornada cerrada — las stats son del último período</p>
          <button onClick={abrirJornada} className="text-xs font-bold text-amber-700 underline">Abrir ahora</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 pb-24 space-y-3">

        {/* Guía primeros pasos */}
        {showGuide && (
          <div className="rounded-2xl overflow-hidden border border-primary-200 bg-gradient-to-br from-primary-50 to-white">
            <div className="px-4 pt-4 pb-2">
              <p className="text-lg font-display font-bold text-gray-900">¿Empezamos? 🍳</p>
              <p className="text-xs text-gray-500 mt-0.5">Seguí estos pasos para sacarle el máximo a MiCuchina</p>
            </div>
            <div className="px-4 pb-4 space-y-2 mt-2">
              {[
                { step: 1, label: 'Cargá tus ingredientes', desc: 'Con precios y unidades reales', path: '/stock/nuevo', done: false },
                { step: 2, label: 'Creá un producto', desc: 'Armá la receta con sus ingredientes', path: '/productos/nuevo', done: false },
                { step: 3, label: 'Tomá tu primera comanda', desc: 'Registrá un pedido y controlá el estado', path: '/comandas/nueva', done: false },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl px-3 py-3 border border-surface-200 active:scale-[0.99] transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hero + por hora */}
        {isLoading ? (
          <div className="flex gap-3"><Skeleton className="h-28 w-full" /></div>
        ) : (
          <div className="flex gap-3">
            <HeroStatCard
              label='Ganado hoy'
              value={formatCurrency(stats.revenue, settings.currencySymbol)}
              sub={`${stats.deliveredOrders} pedido${stats.deliveredOrders !== 1 ? 's' : ''} entregado${stats.deliveredOrders !== 1 ? 's' : ''}`}
              change={stats.revenueChange}
              marginPct={stats.marginPct}
            />
          </div>
        )}

        {/* Secondary stats — 3 columnas */}
        {isLoading ? (
          <div className="flex gap-3">
            <Skeleton className="flex-1 h-24" />
            <Skeleton className="flex-1 h-24" />
            <Skeleton className="flex-1 h-24" />
          </div>
        ) : (
          <div className="flex gap-3">
            <StatCard
              label="Ticket prom."
              value={formatCurrency(stats.avgOrder, settings.currencySymbol)}
              sub={`${stats.totalOrders} pedidos`}
              icon={BarChart2} color="gold"
            />
            <StatCard
              label="Activos"
              value={stats.activeOrders}
              sub={stats.activeOrders > 0 ? 'en curso' : 'Al día ✓'}
              icon={ClipboardList} color={stats.activeOrders > 0 ? 'amber' : 'green'}
            />
            <StatCard
              label="Por cobrar"
              value={formatCurrency(stats.totalDebt, settings.currencySymbol)}
              sub={stats.totalDebt > 0 ? 'pendiente' : 'Sin deudas ✓'}
              icon={CreditCard} color={stats.totalDebt > 0 ? 'red' : 'gold'}
            />
          </div>
        )}

        {/* Real profit (Premium) */}
        {!isLoading && isPremium && profit && profit.hasExpenses && (
          <button
            onClick={() => navigate('/gastos')}
            className={clsx(
              'w-full p-4 rounded-2xl border text-left active:scale-[0.99] transition-all',
              profit.realProfit >= 0 ? 'bg-primary-50 border-primary-200' : 'bg-red-50 border-red-200'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={15} className={profit.realProfit >= 0 ? 'text-primary-600' : 'text-red-500'} />
              <p className={clsx('text-xs font-bold', profit.realProfit >= 0 ? 'text-primary-700' : 'text-red-600')}>
                Ganancia real (descontando gastos)
              </p>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className={clsx('text-2xl font-display font-bold', profit.realProfit >= 0 ? 'text-primary-700' : 'text-red-600')}>
                  {formatCurrency(profit.realProfit, settings.currencySymbol)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ingresos {formatCurrency(stats.revenue, settings.currencySymbol)} − Gastos {formatCurrency(profit.expenseCost, settings.currencySymbol)}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-400 mb-1" />
            </div>
          </button>
        )}

        {/* Quick actions */}
        <div className="card dark:bg-gray-900 dark:border-gray-800">
          <p className="section-title">Acciones rápidas</p>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={Plus} label="Nueva comanda" onClick={() => navigate('/comandas/nueva')} color="green" />
            <QuickAction icon={ShoppingBag} label="Productos" onClick={() => navigate('/productos')} />
            <QuickAction icon={BarChart2} label="Stats" onClick={() => navigate('/estadisticas')} />
            <QuickAction icon={AlertTriangle} label="Stock bajo" onClick={() => navigate('/stock/alertas')} badge={stats?.lowStockCount ?? 0} />
          </div>
        </div>

        {/* Low stock alert */}
        {!isLoading && stats.lowStockCount > 0 && (
          <button
            onClick={() => navigate('/stock')}
            className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 active:scale-[0.99] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-700">
                {stats.lowStockCount} ingrediente{stats.lowStockCount !== 1 ? 's' : ''} con stock bajo
              </p>
              <p className="text-xs text-amber-600 truncate">{stats.lowStockNames.join(', ')}</p>
            </div>
            <ChevronRight size={16} className="text-amber-400 shrink-0" />
          </button>
        )}

        {/* Active orders */}
        <div className="card dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Comandas activas</p>
            <button onClick={() => navigate('/comandas')} className="flex items-center gap-1 text-xs font-semibold text-primary-600">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
                <ClipboardList size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Sin comandas activas</p>
              <p className="text-xs text-gray-400 mt-1">Las comandas aparecerán acá</p>
              <button onClick={() => navigate('/comandas/nueva')} className="btn-primary mt-4 text-sm py-2.5 px-5">
                + Nueva comanda
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeOrders.slice(0, 5).map((order) => {
                const sc = STATUS_CONFIG[order.status]
                const pm = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/comandas/${order.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-surface-50 dark:bg-gray-800 rounded-xl active:bg-surface-100 dark:active:bg-gray-700 transition-colors text-left"
                  >
                    <div className={clsx('w-2 h-2 rounded-full shrink-0', sc?.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{order.clientName || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sc?.label} · {pm?.icon} {pm?.label}
                        {order.deliveryTime && ` · ${order.deliveryTime}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gold-600 shrink-0">
                      {formatCurrency(order.total, settings.currencySymbol)}
                    </p>
                  </button>
                )
              })}
              {activeOrders.length > 5 && (
                <button onClick={() => navigate('/comandas')} className="w-full text-center text-sm font-semibold text-primary-600 py-2">
                  Ver {activeOrders.length - 5} más →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Insights */}
        {!isLoading && (stats.topRecipe || stats.peakHour !== null || stats.unpaidTotal > 0) && (
          <div className="card dark:bg-gray-900 dark:border-gray-800 space-y-2.5">
            <p className="section-title mb-0">Datos del período</p>
            {stats.topRecipe && (
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <Star size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Más vendido</p>
                  <p className="text-sm font-bold text-gray-900">{stats.topRecipe.name}</p>
                  <p className="text-xs text-primary-600">{stats.topRecipeQty} unidades</p>
                </div>
              </div>
            )}
            {stats.peakHour !== null && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Hora pico</p>
                  <p className="text-sm font-bold text-gray-900">{formatPeakHour(stats.peakHour)}</p>
                  <p className="text-xs text-blue-600">Más pedidos a esta hora</p>
                </div>
              </div>
            )}
            {stats.unpaidTotal > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <CreditCard size={16} className="text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Entregados sin cobrar</p>
                  <p className="text-sm font-bold text-red-600">
                    {formatCurrency(stats.unpaidTotal, settings.currencySymbol)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Widget */}
        {isPremium ? (
          <button
            onClick={() => navigate('/ia')}
            className="w-full bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-4 text-left active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-primary-200" />
              <p className="text-sm font-bold text-primary-100">Asistente IA</p>
              <span className="ml-auto text-xs text-primary-300">Premium</span>
            </div>
            <p className="text-base font-display font-bold text-white">Analizá tu negocio con IA</p>
            <p className="text-sm text-primary-200 mt-1 leading-relaxed">
              Sugerencias personalizadas basadas en tus ventas, costos y stock reales.
            </p>
            <div className="mt-3 flex items-center gap-1 text-primary-200 text-sm font-semibold">
              Ver análisis <ChevronRight size={14} />
            </div>
          </button>
        ) : (
          <div className="card border-amber-200 bg-amber-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-amber-600" />
              <p className="text-sm font-bold text-amber-700">Sugerencias IA</p>
              <PremiumBadge />
            </div>
            <p className="text-sm text-amber-600 leading-relaxed">
              Con Premium, la IA analiza tus patrones y te sugiere qué preparar, cuándo comprar y cómo aumentar tus ganancias.
            </p>
            <button onClick={() => navigate('/premium')} className="mt-3 text-sm font-bold text-amber-700 underline">
              Activar Premium →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
