import React, { useState } from 'react'
import { Plus, ClipboardList, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { useAppStore, formatCurrency } from '../store/appStore'
import {
  useOrders, useTodayOrderCount,
  STATUS_CONFIG, PAYMENT_METHODS, FREE_DAILY_LIMIT,
} from '../hooks/useOrders'
import clsx from 'clsx'

export default function OrdersPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const [filter, setFilter] = useState('active')

  const allOrders = useOrders()
  const todayCount = useTodayOrderCount()
  const atLimit = !isPremium && todayCount >= FREE_DAILY_LIMIT

  const filtered = allOrders.filter((o) => {
    if (filter === 'active')    return ['pending', 'preparing', 'ready'].includes(o.status)
    if (filter === 'delivered') return o.status === 'delivered'
    return true
  })

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title="Comandas"
        subtitle={`${allOrders.filter(o => ['pending','preparing','ready'].includes(o.status)).length} activas`}
        action={
          <button
            onClick={() => navigate('/comandas/nueva')}
            className={clsx(
              'flex items-center gap-1.5 text-sm py-2 px-4 rounded-2xl font-semibold transition-all active:scale-95',
              atLimit
                ? 'bg-amber-100 text-amber-700'
                : 'btn-primary'
            )}
          >
            <Plus size={16} />
            Nueva
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">

        {/* Filter tabs */}
        <div className="bg-white border-b border-surface-200 px-4 py-3 flex gap-2">
          {[
            { id: 'active',    label: 'Activas' },
            { id: 'delivered', label: 'Entregadas' },
            { id: 'all',       label: 'Todas' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={clsx(
                'px-4 py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                filter === id ? 'bg-primary-600 text-white' : 'bg-surface-100 text-gray-500'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Plan limit banner */}
        {!isPremium && (
          <div className={clsx(
            'mx-4 mt-3 px-4 py-3 rounded-2xl border flex items-center gap-2',
            atLimit ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'
          )}>
            <ClipboardList size={16} className={atLimit ? 'text-amber-500 shrink-0' : 'text-blue-500 shrink-0'} />
            <p className={clsx('text-xs font-medium flex-1', atLimit ? 'text-amber-700' : 'text-blue-600')}>
              Plan Gratis: <strong>{todayCount}/{FREE_DAILY_LIMIT}</strong> comandas hoy.
              {atLimit && ' ¡Límite alcanzado!'}
            </p>
            <button
              onClick={() => navigate('/premium')}
              className={clsx('text-xs font-bold underline shrink-0', atLimit ? 'text-amber-700' : 'text-blue-700')}
            >
              Mejorar
            </button>
          </div>
        )}

        {/* Orders list */}
        <div className="px-4 mt-4 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin comandas"
              description={
                filter === 'active'
                  ? '¡No hay pedidos activos. Creá tu primera comanda!'
                  : 'No hay comandas en este período.'
              }
              action={
                filter === 'active' && !atLimit && (
                  <button
                    onClick={() => navigate('/comandas/nueva')}
                    className="btn-primary text-sm py-2.5 px-6"
                  >
                    + Nueva comanda
                  </button>
                )
              }
            />
          ) : (
            filtered.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const payMethod = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/comandas/${order.id}`)}
                  className="card-hover w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">
                          {order.clientName || 'Sin nombre'}
                        </p>
                        <span className={clsx('badge', status.color)}>
                          <span className={clsx('w-1.5 h-1.5 rounded-full mr-1 inline-block', status.dot)} />
                          {status.label}
                        </span>
                        {order.isPaid && (
                          <span className="badge badge-green text-[10px]">✓ Pagado</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {payMethod?.icon} {payMethod?.label ?? 'Efectivo'}
                      </p>
                      {order.deliveryTime && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock size={11} />
                          Entrega: {order.deliveryTime}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary-600">
                        {formatCurrency(order.total, settings.currencySymbol)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
