import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Zap } from 'lucide-react'

export default function UpgradeWall({ type = 'comandas' }) {
  const navigate = useNavigate()

  const content = {
    comandas: {
      emoji: '📋',
      titulo: '¡Llegaste al límite de comandas!',
      desc: 'Con el plan gratis podés hacer hasta 10 comandas por día.',
      beneficio: 'Con Premium tenés comandas ilimitadas y mucho más.',
    },
    recetas: {
      emoji: '🍳',
      titulo: '¡Llegaste al límite de productos!',
      desc: 'Con el plan gratis podés cargar hasta 8 productos.',
      beneficio: 'Con Premium tenés productos ilimitados y mucho más.',
    },
  }

  const c = content[type] || content.comandas

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-5">
      <div className="text-6xl">{c.emoji}</div>

      <div>
        <h2 className="text-xl font-display font-bold text-app-primary">{c.titulo}</h2>
        <p className="text-sm text-app-muted mt-2 leading-relaxed">{c.desc}</p>
      </div>

      <div className="w-full rounded-2xl p-4 text-left space-y-2"
           style={{backgroundColor:'var(--bg-card)', border:'1px solid var(--border))'}}>
        <div className="flex items-center gap-2 mb-3">
          <Crown size={18} className="text-amber-500" />
          <p className="text-sm font-bold text-amber-600">Actualizá a Premium</p>
        </div>
        <p className="text-sm text-app-secondary leading-relaxed">{c.beneficio}</p>
        <div className="space-y-1.5 mt-3">
          {['Comandas ilimitadas', 'Productos ilimitados', 'Combos', 'Análisis IA diario', 'Historial de clientes', 'Gastos fijos'].map(f => (
            <div key={f} className="flex items-center gap-2">
              <Zap size={13} className="text-amber-500 shrink-0" />
              <p className="text-xs text-app-secondary">{f}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/premium')}
        className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-display font-bold text-base py-4 rounded-2xl active:scale-[0.99] transition-all shadow-lg"
      >
        ⭐ Actualizá a Premium — USD 9.99/mes
      </button>

      <button
        onClick={() => navigate(-1)}
        className="text-sm text-app-muted underline"
      >
        Volver a mi negocio
      </button>
    </div>
  )
}
