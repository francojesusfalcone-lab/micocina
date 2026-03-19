import React, { useState } from 'react'
import { Share2, Copy, Check, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'

const APP_URL = 'https://micocina-eta.vercel.app'

const SHARE_TEXT = `🍳 ¡Encontré una app genial para manejar mi negocio de comida casera!

MiCuchina me ayuda a saber exactamente cuánto gano con cada plato, controlar mi stock y gestionar mis pedidos.

Es gratis y funciona desde el celular. ¡Probala!
👉 ${APP_URL}`

export default function InvitePage() {
  const [copied, setCopied] = useState(false)
  const settings = useAppStore((s) => s.settings)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MiCuchina — App para cocineras',
          text: SHARE_TEXT,
          url: APP_URL,
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(SHARE_TEXT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader title="Invitar amigos" back />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-6 space-y-5">

        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 border-2 border-primary-100 flex items-center justify-center">
            <Users size={36} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-app-primary">Compartí MiCuchina</h2>
            <p className="text-sm text-app-muted mt-1 leading-relaxed max-w-xs mx-auto">
              Si conocés a alguien que cocina para vender, ayudala a saber cuánto gana de verdad.
            </p>
          </div>
        </div>

        {/* Preview del mensaje */}
        <div className="card bg-app border border-app">
          <p className="text-xs font-bold text-app-muted uppercase tracking-wide mb-3">Mensaje a compartir</p>
          <p className="text-sm text-app-secondary leading-relaxed whitespace-pre-line">{SHARE_TEXT}</p>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
          >
            <Share2 size={18} />
            Compartir por WhatsApp / Redes
          </button>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-app bg-white text-app-secondary font-semibold text-sm active:scale-[0.99] transition-all"
          >
            {copied ? <Check size={18} className="text-primary-600" /> : <Copy size={18} />}
            {copied ? '¡Copiado!' : 'Copiar mensaje'}
          </button>
        </div>

        <p className="text-center text-xs text-app-faint px-4">
          Cada persona que uses MiCuchina ayuda a que sigamos mejorando la app 🙌
        </p>

      </div>
    </div>
  )
}
