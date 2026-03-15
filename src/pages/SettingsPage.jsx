import React from 'react'
import {
  Store, Globe, Sliders, Crown, ChevronRight, Wallet, Users, Sparkles,
  Bell, Moon, Info, LogOut, Shield
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import { PremiumBadge } from '../components/PremiumGate'

function SettingsRow({ icon: Icon, label, value, onClick, badge, color = 'gray' }) {
  const iconColors = {
    gray:   'bg-surface-100 text-gray-600',
    green:  'bg-primary-50 text-primary-600',
    amber:  'bg-amber-50 text-amber-600',
    blue:   'bg-blue-50 text-blue-600',
    red:    'bg-red-50 text-red-500',
  }
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 bg-white active:bg-surface-50 transition-colors"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {value && <p className="text-xs text-gray-500 mt-0.5 truncate">{value}</p>}
      </div>
      {badge && badge}
      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </button>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const settings = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader title="Configuración" />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">

        {/* Business info */}
        <div className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-surface-200">
          <div className="px-4 py-3 border-b border-surface-100">
            <p className="section-title mb-0">Mi negocio</p>
          </div>
          <SettingsRow
            icon={Store}
            label="Nombre del negocio"
            value={settings.businessName}
            onClick={() => navigate('/configuracion/negocio')}
            color="green"
          />
          <div className="border-t border-surface-100" />
          <SettingsRow
            icon={Globe}
            label="País y moneda"
            value={`${settings.country} · ${settings.currency}`}
            onClick={() => navigate('/configuracion/pais')}
            color="blue"
          />
          <div className="border-t border-surface-100" />
          <SettingsRow
            icon={Sliders}
            label="Capacidad de producción"
            value={`${settings.productionCapacity} platos simultáneos`}
            onClick={() => navigate('/configuracion/capacidad')}
            color="gray"
          />
        </div>

        {/* Premium */}
        {!isPremium && (
          <button
            onClick={() => navigate('/premium')}
            className="mx-4 mt-4 w-[calc(100%-2rem)] bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-4 text-left active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown size={18} className="text-white" />
              <p className="font-display font-bold text-white">Activar Premium</p>
            </div>
            <p className="text-sm text-amber-100">
              Comandas ilimitadas, CRM, historial de precios, IA y más — por solo $5/mes.
            </p>
            <div className="mt-3 inline-flex items-center bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-xl">
              Ver beneficios →
            </div>
          </button>
        )}

        {/* App settings */}
        <div className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-surface-200">
          <div className="px-4 py-3 border-b border-surface-100">
            <p className="section-title mb-0">Funciones</p>
          </div>
          <SettingsRow
            icon={Wallet}
            label="Gastos fijos"
            value={isPremium ? 'Controlá tus costos fijos' : 'Premium'}
            onClick={() => navigate('/gastos')}
            color="red"
            badge={!isPremium ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg mr-1">PRO</span> : null}
          />
          <div className="border-t border-surface-100" />
          <SettingsRow
            icon={Users}
            label="CRM Clientes"
            value={isPremium ? 'Historial y deudas por cliente' : 'Premium'}
            onClick={() => navigate('/clientes')}
            color="blue"
            badge={!isPremium ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg mr-1">PRO</span> : null}
          />
          <div className="border-t border-surface-100" />
          <SettingsRow
            icon={Bell}
            label="Notificaciones y alarmas"
            onClick={() => navigate('/configuracion/notificaciones')}
            color="blue"
          />
          <div className="border-t border-surface-100" />
          <SettingsRow
            icon={Moon}
            label="Modo oscuro"
            value="Próximamente"
            onClick={() => {}}
            color="gray"
          />
          <div className="border-t border-surface-100" />
          <SettingsRow
            icon={Shield}
            label="Privacidad y datos"
            onClick={() => navigate('/configuracion/privacidad')}
            color="gray"
          />
        </div>

        {/* About */}
        <div className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-surface-200">
          <div className="px-4 py-3 border-b border-surface-100">
            <p className="section-title mb-0">Acerca de</p>
          </div>
          <SettingsRow
            icon={Info}
            label="Versión de la app"
            value="0.1.0 — Beta"
            onClick={() => {}}
            color="gray"
          />
          <div className="border-t border-surface-100" />
          <SettingsRow
            icon={LogOut}
            label="Cerrar sesión"
            onClick={() => {}}
            color="red"
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 mb-2">
          MiCocina · Hecho con ❤️ para cocineras de Latinoamérica
        </p>

      </div>
    </div>
  )
}
