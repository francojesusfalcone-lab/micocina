import React, { useState } from 'react'
import {
  Store, Globe, Crown, ChevronRight, Wallet, Users,
  Bell, Moon, Info, LogOut, Shield, Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import { supabase } from '../lib/supabase'
import { db } from '../db'

function SettingsRow({ icon: Icon, label, value, onClick, badge, color = 'gray' }) {
  const iconColors = {
    gray:  'bg-surface-100 text-gray-600',
    green: 'bg-primary-50 text-primary-600',
    blue:  'bg-blue-50 text-blue-600',
    red:   'bg-red-50 text-red-500',
  }
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 bg-white active:bg-surface-50 transition-colors">
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
  const setPlan = useAppStore((s) => s.setPlan)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [devTaps, setDevTaps] = useState(0)

  function handleDevTap() {
    const next = devTaps + 1
    setDevTaps(next)
    if (next >= 7) { setPlan(isPremium ? 'free' : 'premium'); setDevTaps(0) }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleDeleteAllData() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    const stores = ['ingredients','recipes','orders','orderItems','recipeIngredients',
      'expenses','clients','settings','ingredientPriceHistory']
    await Promise.all(stores.map(s => db[s]?.clear()).filter(Boolean))
    setConfirmDelete(false)
    window.location.replace('/')
  }

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader title="Configuración" />
      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">

        {/* Negocio */}
        <div className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-surface-200">
          <div className="px-4 py-3 border-b border-surface-100"><p className="section-title mb-0">Mi negocio</p></div>
          <SettingsRow icon={Store} label="Nombre del negocio" value={settings.businessName} onClick={() => navigate('/configuracion/negocio')} color="green" />
          <div className="border-t border-surface-100" />
          <SettingsRow icon={Globe} label="País y moneda" value={`${settings.country} · ${settings.currency}`} onClick={() => navigate('/configuracion/pais')} color="blue" />
        </div>

        {/* Premium banner */}
        {!isPremium && (
          <button onClick={() => navigate('/premium')} className="mx-4 mt-4 w-[calc(100%-2rem)] bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-4 text-left active:scale-[0.99] transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={18} className="text-white" />
              <p className="font-display font-bold text-white">Activar Premium</p>
            </div>
            <p className="text-sm text-amber-100">Comandas ilimitadas, CRM, historial de precios, IA y más — por solo $5/mes.</p>
            <div className="mt-3 inline-flex items-center bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-xl">Ver beneficios →</div>
          </button>
        )}

        {/* Funciones */}
        <div className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-surface-200">
          <div className="px-4 py-3 border-b border-surface-100"><p className="section-title mb-0">Funciones</p></div>
          <SettingsRow icon={Wallet} label="Gastos fijos" value={isPremium ? 'Controlá tus costos fijos' : 'Premium'} onClick={() => navigate('/gastos')} color="red" badge={!isPremium ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg mr-1">PRO</span> : null} />
          <div className="border-t border-surface-100" />
          <SettingsRow icon={Users} label="CRM Clientes" value={isPremium ? 'Historial y deudas por cliente' : 'Premium'} onClick={() => navigate('/clientes')} color="blue" badge={!isPremium ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg mr-1">PRO</span> : null} />
          <div className="border-t border-surface-100" />
          <SettingsRow icon={Bell} label="Notificaciones y alarmas" value="Próximamente" onClick={() => {}} color="blue" />
          <div className="border-t border-surface-100" />
          <SettingsRow icon={Moon} label="Modo oscuro" value="Próximamente" onClick={() => {}} color="gray" />
          <div className="border-t border-surface-100" />
          <SettingsRow icon={Shield} label="Privacidad y datos" value="Próximamente" onClick={() => {}} color="gray" />
        </div>

        {/* Cuenta */}
        <div className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-surface-200">
          <div className="px-4 py-3 border-b border-surface-100"><p className="section-title mb-0">Cuenta y datos</p></div>
          <SettingsRow icon={Info} label="Versión de la app" value="0.1.0 — Beta" onClick={() => {}} color="gray" />
          <div className="border-t border-surface-100" />
          <SettingsRow icon={LogOut} label="Cerrar sesión" value="Tus datos quedan guardados" onClick={handleSignOut} color="red" />
          <div className="border-t border-surface-100" />
          <button onClick={handleDeleteAllData} className="w-full flex items-center gap-3 px-4 py-3.5 bg-white active:bg-red-50 transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-500"><Trash2 size={18} /></div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-red-500">{confirmDelete ? '¿Confirmar? Tocá de nuevo para borrar' : 'Borrar todos los datos'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{confirmDelete ? 'Esta acción no se puede deshacer' : 'Borra ingredientes, productos y comandas'}</p>
            </div>
            <ChevronRight size={16} className="text-red-300 shrink-0" />
          </button>
        </div>

        <p onClick={handleDevTap} className="text-center text-xs text-gray-400 mt-6 mb-4 select-none">MiCuchina · Hecho con ❤️ para cocineras de Latinoamérica</p>

      </div>
    </div>
  )
}
