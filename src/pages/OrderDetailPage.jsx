import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Copy, X, ChevronRight, Clock, CheckCircle,
  Phone, MapPin, CreditCard, MessageSquare, AlertTriangle
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomSheet from '../components/BottomSheet'
import { useAppStore, formatCurrency } from '../store/appStore'
import {
  useOrder, useOrderItems,
  updateOrderStatus, cancelOrder, markOrderPaid,
  buildWhatsAppText,
  STATUS_CONFIG, STATUS_FLOW, PAYMENT_METHODS,
} from '../hooks/useOrders'
import clsx from 'clsx'

// ─── Status stepper ───────────────────────────────────────────────────────────
function StatusStepper({ currentStatus, onAdvance, advancing }) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus)

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STATUS_FLOW.map((s, i) => (
          <React.Fragment key={s}>
            <div className={clsx(
              'h-2 flex-1 rounded-full transition-all duration-300',
              i <= currentIdx ? 'bg-primary-500' : 'bg-surface-200'
            )} />
            {i < STATUS_FLOW.length - 1 && (
              <ChevronRight size={12} className={i < currentIdx ? 'text-primary-400' : 'text-surface-300'} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between">
        {STATUS_FLOW.map((s, i) => {
          const config = STATUS_CONFIG[s]
          return (
            <div key={s} className="flex flex-col items-center gap-0.5" style={{ width: '22%' }}>
              <div className={clsx(
                'w-2 h-2 rounded-full',
                i <= currentIdx ? config.dot : 'bg-surface-300'
              )} />
              <p className={clsx(
                'text-[10px] font-semibold text-center',
                i === currentIdx ? 'text-gray-800' : 'text-gray-400'
              )}>
                {config.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Advance button */}
      {currentIdx < STATUS_FLOW.length - 1 && (
        <button
          onClick={onAdvance}
          disabled={advancing}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm"
        >
          {advancing ? 'Actualizando...' : (
            <>
              Marcar como "{STATUS_CONFIG[STATUS_FLOW[currentIdx + 1]]?.label}"
              <ChevronRight size={16} />
            </>
          )}
        </button>
      )}

      {currentStatus === 'delivered' && (
        <div className="flex items-center justify-center gap-2 py-3 bg-primary-50 rounded-2xl">
          <CheckCircle size={18} className="text-primary-600" />
          <p className="text-sm font-bold text-primary-700">¡Pedido entregado!</p>
        </div>
      )}
    </div>
  )
}

// ─── Cancel sheet ─────────────────────────────────────────────────────────────
function CancelSheet({ isOpen, onClose, onConfirm }) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="¿Qué pasó con este pedido?">
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-gray-500">Elegí la opción correcta para actualizar el stock:</p>

        <button
          onClick={() => onConfirm('restore')}
          className="w-full flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-2xl active:scale-[0.99] transition-all text-left"
        >
          <span className="text-xl">🔄</span>
          <div>
            <p className="text-sm font-bold text-primary-700">No se entregó — vuelve al stock</p>
            <p className="text-xs text-primary-600 mt-0.5">Ej: cliente canceló, la gaseosa vuelve a la heladera</p>
          </div>
        </button>

        <button
          onClick={() => onConfirm('wasted')}
          className="w-full flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl active:scale-[0.99] transition-all text-left"
        >
          <span className="text-xl">🗑️</span>
          <div>
            <p className="text-sm font-bold text-red-600">No se entregó — inutilizado</p>
            <p className="text-xs text-red-500 mt-0.5">Ej: la hamburguesa ya estaba hecha, no se puede reutilizar</p>
          </div>
        </button>

        <button onClick={onClose} className="w-full btn-secondary py-3 text-sm">
          Cancelar
        </button>
      </div>
    </BottomSheet>
  )
}

// ─── Main detail page ─────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const addToast = useAppStore((s) => s.addToast)

  const order = useOrder(Number(id))
  const items = useOrderItems(Number(id))

  const [advancing, setAdvancing] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [copying, setCopying] = useState(false)

  if (!order) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader title="Comanda" back />
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelled' || order.status === 'cancelled_wasted'
  const isDelivered = order.status === 'delivered'
  const isDone = isCancelled || isDelivered

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const payLabel = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)?.label ?? 'Efectivo'
  const payIcon  = PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)?.icon ?? '💵'

  async function handleAdvance() {
    const currentIdx = STATUS_FLOW.indexOf(order.status)
    if (currentIdx >= STATUS_FLOW.length - 1) return
    setAdvancing(true)
    try {
      const nextStatus = STATUS_FLOW[currentIdx + 1]
      await updateOrderStatus(Number(id), nextStatus)
      addToast({
        type: 'success',
        message: `Pedido marcado como "${STATUS_CONFIG[nextStatus].label}" ✓`,
      })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setAdvancing(false)
    }
  }

  async function handleCancel(mode) {
    try {
      await cancelOrder(Number(id), mode)
      const msg = mode === 'restore' ? 'Stock devuelto ✓' : 'Comanda marcada como inutilizada'
      addToast({ type: 'success', message: msg })
      setCancelOpen(false)
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    }
  }

  async function handleCopyWhatsApp() {
    setCopying(true)
    try {
      const text = await buildWhatsAppText(Number(id), settings)
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        addToast({ type: 'success', message: 'Copiado al portapapeles ✓' })
      }
    } catch (err) {
      addToast({ type: 'error', message: 'No se pudo copiar' })
    } finally {
      setCopying(false)
    }
  }

  async function handleTogglePaid() {
    await markOrderPaid(Number(id), !order.isPaid)
    addToast({
      type: 'success',
      message: order.isPaid ? 'Marcado como no pagado' : 'Marcado como pagado ✓',
    })
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title={order.clientName || 'Pedido sin nombre'}
        subtitle={`${formatDate(order.createdAt)} · ${formatTime(order.createdAt)}`}
        back
        action={
          !isDone && (
            <button
              onClick={() => setCancelOpen(true)}
              className="flex items-center gap-1.5 bg-red-50 text-red-500 text-sm font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
            >
              <X size={15} />
              Cancelar
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-28 px-4 py-4 space-y-4">

        {/* ── Status badge ── */}
        <div className="flex items-center gap-2">
          <span className={clsx('badge text-sm px-3 py-1.5', statusCfg.color)}>
            <span className={clsx('w-2 h-2 rounded-full mr-1.5 inline-block', statusCfg.dot)} />
            {statusCfg.label}
          </span>
          {order.deliveryTime && (
            <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
              <Clock size={12} />
              Entrega: {order.deliveryTime}
            </span>
          )}
        </div>

        {/* ── Status stepper ── */}
        {!isCancelled && (
          <div className="card">
            <p className="text-sm font-bold text-gray-700 mb-4">Estado del pedido</p>
            <StatusStepper
              currentStatus={order.status}
              onAdvance={handleAdvance}
              advancing={advancing}
            />
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600 font-medium">Este pedido fue cancelado.</p>
          </div>
        )}

        {/* ── Order items ── */}
        <div className="card">
          <p className="text-sm font-bold text-gray-700 mb-3">
            Detalle del pedido ({items.length} producto{items.length !== 1 ? 's' : ''})
          </p>
          <div className="space-y-0">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-surface-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary-600 w-6 text-center">
                    {item.quantity}x
                  </span>
                  <p className="text-sm font-semibold text-gray-900">{item.recipe?.name ?? '—'}</p>
                </div>
                <p className="text-sm font-bold text-gray-700">
                  {formatCurrency(item.unitPrice * item.quantity, settings.currencySymbol)}
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-surface-200">
            <p className="text-base font-bold text-gray-900">Total</p>
            <p className="text-xl font-display font-bold text-primary-600">
              {formatCurrency(order.total, settings.currencySymbol)}
            </p>
          </div>
        </div>

        {/* ── Payment ── */}
        <div className="card space-y-3">
          <p className="text-sm font-bold text-gray-700">Pago</p>

          <div className="flex items-center gap-2">
            <span className="text-lg">{payIcon}</span>
            <p className="text-sm font-semibold text-gray-700">{payLabel}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {order.isPaid ? '✅ Pagado' : '⏳ Pendiente de pago'}
              </p>
              <p className="text-xs text-gray-400">Tocá para cambiar</p>
            </div>
            <button
              onClick={handleTogglePaid}
              className={`w-12 h-6 rounded-full transition-all relative ${order.isPaid ? 'bg-primary-500' : 'bg-surface-300'}`}
            >
              <div
                className="w-5 h-5 rounded-full bg-white shadow transition-all absolute top-0.5"
                style={{ left: order.isPaid ? '26px' : '2px' }}
              />
            </button>
          </div>
        </div>

        {/* ── Client info ── */}
        {(order.clientPhone || order.clientAddress || order.notes) && (
          <div className="card space-y-2.5">
            <p className="text-sm font-bold text-gray-700">Información del cliente</p>
            {order.clientPhone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <a href={`tel:${order.clientPhone}`} className="font-medium underline">
                  {order.clientPhone}
                </a>
              </div>
            )}
            {order.clientAddress && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <p>{order.clientAddress}</p>
              </div>
            )}
            {order.notes && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="italic">{order.notes}</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Fixed footer ── */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-surface-200 px-4 py-3 z-30">
        <button
          onClick={handleCopyWhatsApp}
          disabled={copying}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-2xl active:scale-[0.99] transition-all text-sm"
        >
          <Copy size={17} />
          {copying ? 'Copiando...' : 'Copiar pedido para WhatsApp'}
        </button>
      </div>

      <CancelSheet
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />
    </div>
  )
}
