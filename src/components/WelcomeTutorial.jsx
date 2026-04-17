import React, { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { db } from '../db'

const STEPS = [
  {
    emoji: '🥕',
    title: 'Cargá tus ingredientes',
    desc: 'En Stock agregá los ingredientes que usás con su precio y cantidad disponible. Es la base para calcular cuánto te cuesta cada plato.',
  },
  {
    emoji: '🍕',
    title: 'Armá recetas y combos',
    desc: 'En Productos creá cada plato que vendés indicando qué ingredientes lleva. MiCuchina calcula tu costo y ganancia automáticamente.',
  },
  {
    emoji: '📋',
    title: 'Registrá pedidos',
    desc: 'Cuando llegue un pedido cargalo en Comandas. Podés poner la hora de entrega y MiCuchina te avisa 15 minutos antes.',
  },
  {
    emoji: '💰',
    title: 'Marcá pagos y entregas',
    desc: 'Actualizá el estado de cada comanda: preparando, listo, entregado. También podés registrar si ya cobró o si quedó en deuda.',
  },
  {
    emoji: '📊',
    title: 'Revisá ganancias y gastos',
    desc: 'En Inicio y Estadísticas ves cuánto ganás por día, qué productos son más rentables y mucho más.',
  },
  {
    emoji: '⚙️',
    title: '¿Necesitás más ayuda?',
    desc: 'En Configuración tenés la guía completa y cómo instalar MiCuchina como app en tu celular, PC o laptop.',
    isLast: true,
  },
]

export default function WelcomeTutorial() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    db.settings.get('tutorialShown').then(r => {
      if (!r?.value) setVisible(true)
    }).catch(() => setVisible(true))
  }, [])

  async function handleClose() {
    await db.settings.put({ key: 'tutorialShown', value: true })
    setVisible(false)
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleClose()
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.75)'}}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{backgroundColor:'var(--bg-card)'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <p className="text-xs font-bold text-app-muted uppercase tracking-wider">Así de fácil funciona MiCuchina</p>
          <button onClick={handleClose} className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center">
            <X size={14} className="text-app-muted" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5 px-5 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'bg-primary-500 w-6' : i < step ? 'bg-primary-300 w-2' : 'bg-surface-200 w-2'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-5 pb-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 text-3xl">
              {current.emoji}
            </div>
            <div>
              <p className="text-base font-display font-bold text-app-primary mb-1">{current.title}</p>
              <p className="text-sm text-app-muted leading-relaxed">{current.desc}</p>
            </div>
          </div>

          <button onClick={handleNext} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
            {isLast ? '¡Empezar a usar MiCuchina!' : <><span>Siguiente</span><ChevronRight size={16} /></>}
          </button>

          {!isLast && (
            <button onClick={handleClose} className="w-full text-center text-xs text-app-faint py-1">
              Saltar tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
