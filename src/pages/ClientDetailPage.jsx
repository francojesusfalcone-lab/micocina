import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Phone, MapPin, MessageSquare, Edit2, Trash2,
  ShoppingBag, Star, Clock, ChevronRight,
  AlertCircle, CheckCircle, TrendingUp
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomSheet from '../components/BottomSheet'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useClient, useClientOrders, useClientStats, deleteClient } from '../hooks/useClients'
import { STATUS_CONFIG } from '../hooks/useOrders'
import clsx from 'clsx'

// ─── Stat mini card ───────────────────────────────────────────────────────────
function MiniStat({ label, value, color = 'gray' }) {
  const colors = {
    gray:   'bg-surface-50 text-gray-700',
    green:  'bg-primary-50 text-primary-700',
    red:    'bg-red-50 text-red-600',
    amber:  'bg-amber-50 text-amber-700',
  }
  return (
    <div className={clsx('flex-1 rounded-xl p-3 text-center', colors[color])}>
      <p className="text-lg font-display font-bold">{value}</p>
      <p className="text-[10px] font-semibold mt-0.5 opacity-70">{label}</p>
    </div>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────
function DeleteSheet({ isOpen, name, onClose, onConfirm }) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Eliminar cliente">
      <div className="px-5 py-5 space-y-4">
        <p className="text-sm text-gray-600">
          ¿Eliminás a <strong>{name}</strong>? Sus pedidos no se borran, solo se desvinculan.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary py-3">Cancelar</button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-2xl active:scale-95 transition-all"
          >
            Eliminar
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)

  const client = useClient(Number(id))
  const orders = useClientOrders(Number(id))
  const stats  = useClientStats(Number(id))

  const [deleteOpen, setDeleteOpen] = useState(false)

  const sym = settings.currencySymbol

  if (!client) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader title="Cliente" back />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  const initials = client.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')

  async function handleDelete() {
    await deleteClient(Number(id))
    addToast({ type: 'success', message: `"${client.name}" eliminado` })
    navigate('/clientes', { replace: true })
  }

  function openWhatsApp() {
    const phone = client.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  function formatRelativeDate(iso) {
    const date = new Date(iso)
    const now  = new Date()
    const days = Math.floor((now - date) / 86400000)
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    if (days < 7)  return `Hace ${days} días`
    if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title={client.name}
        back
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/clientes/editar/${id}`)}
              className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center active:scale-90 transition-all"
            >
              <Edit2 size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center active:scale-90 transition-all"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-4 space-y-4">

        {/* ── Avatar + contact ── */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary-700">{initials}</span>
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-gray-900">{client.name}</h2>
              {stats?.lastOrder && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Último pedido: {formatRelativeDate(stats.lastOrder.createdAt)}
                </p>
              )}
            </div>
          </div>

          {/* Contact actions */}
          {(client.phone || client.address) && (
            <div className="space-y-2">
              {client.phone && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-2 flex-1 p-2.5 bg-surface-50 rounded-xl active:bg-surface-100 transition-colors"
                  >
                    <Phone size={14} className="text-gray-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{client.phone}</span>
                  </a>
                  {client.phone.replace(/\D/g, '').length >= 8 && (
                    <button
                      onClick={openWhatsApp}
                      className="px-3 py-2.5 bg-[#25D366] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shrink-0"
                    >
                      WhatsApp
                    </button>
                  )}
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 p-2.5 bg-surface-50 rounded-xl">
                  <MapPin size={14} className="text-gray-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{client.address}</span>
                </div>
              )}
            </div>
          )}

          {client.notes && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl mt-2">
              <MessageSquare size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 italic">{client.notes}</span>
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        {stats && (
          <>
            <div className="flex gap-3">
              <MiniStat
                label="Pedidos"
                value={stats.totalOrders}
                color="gray"
              />
              <MiniStat
                label="Total gastado"
                value={formatCurrency(stats.totalSpent, sym)}
                color="green"
              />
              {stats.totalDebt > 0 && (
                <MiniStat
                  label="Debe"
                  value={formatCurrency(stats.totalDebt, sym)}
                  color="red"
                />
              )}
            </div>

            {/* Favorito */}
            {stats.favRecipe && (
              <div className="flex items-center gap-3 p-3.5 bg-primary-50 rounded-2xl border border-primary-100">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <Star size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Producto favorito</p>
                  <p className="text-sm font-bold text-gray-900">{stats.favRecipe.name}</p>
                  <p className="text-xs text-primary-600">{stats.favRecipeQty} unidades pedidas</p>
                </div>
              </div>
            )}

            {/* Deuda warning */}
            {stats.totalDebt > 0 && (
              <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">Deuda pendiente</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    {formatCurrency(stats.totalDebt, sym)} en pedidos marcados como "Debe"
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Order history ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Historial de pedidos</p>
            <span className="text-xs text-gray-400">{orders.length} en total</span>
          </div>

          {orders.length === 0 ? (
            <div className="py-6 text-center">
              <ShoppingBag size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin pedidos todavía</p>
            </div>
          ) : (
            <div className="space-y-0 -mx-1">
              {orders.slice(0, 20).map((order) => {
                const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                const isDelivered = order.status === 'delivered'
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/comandas/${order.id}`)}
                    className="w-full flex items-center gap-3 px-1 py-3 border-b border-surface-100 last:border-0 active:bg-surface-50 transition-colors text-left rounded-xl"
                  >
                    <div className={clsx('w-2 h-2 rounded-full shrink-0', sc.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {formatCurrency(order.total, sym)}
                        </p>
                        <span className={clsx('badge text-[10px]', sc.color)}>
                          {sc.label}
                        </span>
                        {isDelivered && order.isPaid && (
                          <CheckCircle size={12} className="text-primary-500" />
                        )}
                        {isDelivered && !order.isPaid && (
                          <AlertCircle size={12} className="text-red-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelativeDate(order.createdAt)}
                        {order.deliveryTime && ` · Entrega ${order.deliveryTime}`}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Nueva comanda para este cliente */}
        <button
          onClick={() => navigate('/comandas/nueva', { state: { prefillClient: client } })}
          className="w-full btn-primary flex items-center justify-center gap-2 py-4"
        >
          <TrendingUp size={18} />
          Nueva comanda para {client.name.split(' ')[0]}
        </button>

      </div>

      <DeleteSheet
        isOpen={deleteOpen}
        name={client.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
