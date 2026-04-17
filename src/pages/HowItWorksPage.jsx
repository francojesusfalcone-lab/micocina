import React, { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { ChevronDown, ChevronUp } from 'lucide-react'

const SECTIONS = [
  {
    emoji: '🌅',
    title: 'Cómo funciona el estado del día',
    content: `MiCuchina detecta sola cuándo estás trabajando. No necesitás tocar nada.\n\n🟢 En actividad — aparece automáticamente cuando creás tu primer pedido del día. La app empieza a contar ganancias desde ese momento.\n\n⚪ Sin actividad — si pasaron más de 7 horas sin pedidos, la app entra en este estado sola. Sigue mostrando el último resultado.\n\n🔒 Día cerrado — si vos querés cerrar el día manualmente, tocá "En actividad" y luego "Cerrar día". Útil para ver el resumen y empezar uno nuevo limpio.\n\nSi trabajás de madrugada o en horarios irregulares, no hay problema: el contador es por inactividad, no por hora. No te corta a medianoche.`,
  },
  {
    emoji: '🛒',
    title: 'Cargá tus compras (stock real)',
    content: `Antes de abrir o cuando volvés del súper, agregá lo que compraste (ej: 10 kg carne $122.000, 50 bollos $5.000). Lo que sobró del día anterior se suma automático.\n\nSi tiraste algo (se echó a perder), ajustás la cantidad. Poné una alarma para que te avise cuando queden pocos (ej: "Avisame con 5 bollos"). Al vender, la app descuenta sola los gramos o unidades de cada receta.`,
  },
  {
    emoji: '📋',
    title: 'Armá tus recetas una sola vez',
    content: `Ejemplo: Hamburguesa = 200 g carne + 1 bollo + 30 g tomate. La app calcula el costo real con los precios que cargaste.\n\nElegís el precio de venta:\n• Fijo (siempre $8.000)\n• O con % de ganancia (ej: 100% sobre costo)\n\nSi los insumos suben mañana, ves el nuevo costo y decidís si cambiás el precio.`,
  },
  {
    emoji: '📦',
    title: 'Vendé rápido con comandas',
    content: `Cargá el pedido en segundos: cliente, productos, cantidad, notas y hora. Elegí el método de pago: efectivo, transferencia o MercadoPago.\n\nEstados: pendiente → preparando → listo → entregado. Copiá el texto listo para pegar en WhatsApp.\n\nSi cancelan: decidís si devolvés al stock (gaseosa sí, hamburguesa hecha no).`,
  },
  {
    emoji: '👥',
    title: 'Perfil de clientes',
    content: `Guardá nombre, teléfono, dirección y notas importantes: "Sin tomate", "celíaco", "diabetes", "timbre roto, llamar al llegar".\n\nVés el historial de pedidos y preferencias de cada cliente. Así cocinás y entregás perfecto sin preguntar cada vez.`,
  },
  {
    emoji: '📊',
    title: 'Al cerrar el día: ves todo claro',
    content: `• Ganancia bruta (lo que entró)\n• Costo real de insumos gastados\n• Ganancia neta (en Premium incluye luz, gas, alquiler y delivery repartidos por día)\n• Gráfico con gastos, ganancia neta y total (día / semana / mes / año)`,
  },
  {
    emoji: '⭐',
    title: '¿Free o Premium?',
    content: `Podés usar la versión free desde el primer día para cargar compras, armar recetas, vender y cerrar días básicos.\n\nPero para un análisis crítico y profundo de tu negocio — ganancia neta real con todos los gastos fijos, consejos accionables de IA y gráficos detallados — es esencial pasar a Premium.`,
  },
]

function Section({ emoji, title, content }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-2xl border border-app overflow-hidden active:opacity-70 transition-opacity"
      style={{backgroundColor:'var(--bg-card)'}}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="text-2xl">{emoji}</span>
        <p className="flex-1 text-sm font-bold text-app-primary">{title}</p>
        {open ? <ChevronUp size={16} className="text-app-faint shrink-0" /> : <ChevronDown size={16} className="text-app-faint shrink-0" />}
      </div>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-app">
          <p className="text-sm text-app-secondary leading-relaxed whitespace-pre-line mt-3">{content}</p>
        </div>
      )}
    </button>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader title="¿Cómo funciona MiCuchina?" back />
      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 px-4 py-4 space-y-3">

        {/* Bienvenida */}
        <div className="rounded-2xl p-4" style={{backgroundColor:'var(--bg-card)', border:'1px solid var(--border)'}}>
          <p className="text-lg font-display font-bold text-app-primary mb-1">¡Hola! 👋</p>
          <p className="text-sm text-app-secondary leading-relaxed">
            Soy MiCuchina, tu asistente para que sepas siempre cuánto ganás de verdad y cómo mejorar tu negocio de comida casera, sin complicarte la vida.
          </p>
        </div>

        {/* Secciones acordeón */}
        {SECTIONS.map((s) => (
          <Section key={s.title} {...s} />
        ))}

        {/* CTA */}
        <div className="rounded-2xl p-4 text-center" style={{backgroundColor:'var(--bg-card)', border:'1px solid var(--border)'}}>
          <p className="text-sm font-bold text-primary-600">¡Empezá ya!</p>
          <p className="text-xs text-app-muted mt-1">Cargá tus primeros ingredientes y abrí tu negocio.</p>
        </div>

      </div>
    </div>
  )
}
