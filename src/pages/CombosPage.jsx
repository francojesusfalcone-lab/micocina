import React from 'react'
import { Plus, Tag, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { useAppStore, formatCurrency } from '../store/appStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export default function CombosPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())

  const combos = useLiveQuery(() =>
    db.recipes.where('isPremiumCombo').equals(1).toArray()
  , [], [])

  // Gate Premium
  if (!isPremium) {
    return (
      <div className="flex flex-col min-h-full bg-app ">
        <PageHeader title="Combos" back />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-24">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mb-5">
            <Lock size={32} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-display font-bold text-app-primary  mb-2">Combos es Premium</h2>
          <p className="text-sm text-app-muted dark:text-app-faint leading-relaxed mb-6">
            Creá combos con precio especial — Hamburguesa + papas + gaseosa a precio fijo — y vendelos en tus comandas con un solo toque.
          </p>
          <button
            onClick={() => navigate('/premium')}
            className="btn-primary px-8 py-3"
          >
            Ver Premium →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-app ">
      <PageHeader
        title="Combos"
        subtitle={`${combos.length} combo${combos.length !== 1 ? 's' : ''}`}
        back
        action={
          <button
            onClick={() => navigate('/combos/nuevo')}
            className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"
          >
            <Plus size={16} />
            Nuevo
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 pt-4">
        {combos.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Sin combos aún"
            description="Creá combos con precio especial para atraer más clientes. Ej: Hamburguesa + papas + gaseosa a precio fijo."
            action={
              <button onClick={() => navigate('/combos/nuevo')} className="btn-primary text-sm py-2.5 px-6">
                + Crear combo
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {combos.map((combo) => (
              <button
                key={combo.id}
                onClick={() => navigate(`/combos/${combo.id}`)}
                className="card-hover  w-full flex items-center gap-3 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Tag size={20} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-app-primary truncate">{combo.name}</p>
                  <p className="text-xs text-app-muted mt-0.5">
                    {combo.comboItems?.length || 0} productos incluidos
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-amber-600">
                    {formatCurrency(combo.salePrice, settings.currencySymbol)}
                  </p>
                  <p className="text-xs text-app-faint">precio combo</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
