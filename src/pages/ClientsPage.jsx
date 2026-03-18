import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Lock,
  ChevronRight, AlertCircle
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useClients } from '../hooks/useClients'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

// Stats per client via batch query
function useClientsWithStats(clients) {
  return useLiveQuery(
    async () => {
      if (!clients || clients.length === 0) return {}
      const result = {}
      for (const c of clients) {
        const orders = await db.orders.where('clientId').equals(c.id).toArray()
        const delivered = orders.filter((o) => o.status === 'delivered')
        const totalSpent = delivered.reduce((s, o) => s + (o.total || 0), 0)
        const debt = orders
          .filter((o) => o.paymentMethod === 'debt' && !o.isPaid && o.status !== 'cancelled')
          .reduce((s, o) => s + (o.total || 0), 0)
        result[c.id] = { totalOrders: orders.length, totalSpent, debt }
      }
      return result
    },
    [clients?.length],
    {}
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const navigate   = useNavigate()
  const settings   = useAppStore((s) => s.settings)
  const isPremium  = useAppStore((s) => s.isPremium())
  const [search, setSearch] = useState('')

  const clients    = useClients()
  const stats      = useClientsWithStats(clients)

  const sym = settings.currencySymbol

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  )

  // ── Premium gate ──────────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <div className="flex flex-col min-h-full bg-surface-50">
        <PageHeader title="Clientes" back />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
            <Lock size={32} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">CRM de Clientes</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Guardá el historial de pedidos, teléfonos, direcciones y deudas de cada cliente. Sabé quién es tu mejor clienta con un vistazo. Incluido en Premium.
            </p>
          </div>
          <div className="w-full space-y-2 text-left">
            {['📋 Historial completo de pedidos por cliente', '💰 Total gastado y deudas pendientes', '⭐ Producto favorito de cada cliente', '📱 Llamar o enviar WhatsApp directo'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <span>{f}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/premium')}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
          >
            <Users size={18} />
            Activar Premium — $5/mes
          </button>
        </div>
      </div>
    )
  }

  // ── Main list ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} registrado${clients.length !== 1 ? 's' : ''}`}
        back
        action={
          <button
            onClick={() => navigate('/clientes/nuevo')}
            className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"
          >
            <Plus size={16} />
            Nuevo
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">

        {/* Search */}
        {clients.length > 0 && (
          <div className="px-4 pt-4">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 text-sm py-2.5"
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="px-4 mt-4 space-y-3">
          {clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin clientes aún"
              description="Los clientes se crean automáticamente cuando hacés una comanda, o podés agregarlos manualmente."
              action={
                <button
                  onClick={() => navigate('/clientes/nuevo')}
                  className="btn-primary text-sm py-2.5 px-6"
                >
                  + Agregar cliente
                </button>
              }
            />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No se encontró "{search}"</p>
            </div>
          ) : (
            filtered.map((client) => {
              const s = stats[client.id]
              const initials = client.name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join('')

              return (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clientes/${client.id}`)}
                  className="card-hover w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-700">{initials}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate">{client.name}</p>
                        {s?.debt > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-lg shrink-0">
                            <AlertCircle size={10} />
                            Debe
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s?.totalOrders ?? 0} pedido{s?.totalOrders !== 1 ? 's' : ''}
                        {s?.totalSpent > 0 && ` · ${formatCurrency(s.totalSpent, sym)} total`}
                      </p>
                      {client.phone && (
                        <p className="text-xs text-gray-400 mt-0.5">{client.phone}</p>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
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
