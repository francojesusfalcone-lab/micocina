import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, AlertTriangle, ShoppingBag,
  Settings, Megaphone, Sparkles, Star, Clock
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/appStore'
import { buildAIContext, buildSystemPrompt, buildUserPrompt } from '../hooks/useAIContext'
import { db } from '../db'

const TYPE_CONFIG = {
  revenue:    { bg: 'bg-primary-50',  text: 'text-primary-600',  border: 'border-primary-100' },
  cost:       { bg: 'bg-amber-50',    text: 'text-amber-600',    border: 'border-amber-100' },
  stock:      { bg: 'bg-blue-50',     text: 'text-blue-600',     border: 'border-blue-100' },
  marketing:  { bg: 'bg-purple-50',   text: 'text-purple-600',   border: 'border-purple-100' },
  operations: { bg: 'bg-surface-100', text: 'text-gray-600',     border: 'border-surface-200' },
}

const PRIORITY_DOT = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-gray-300' }
const HOURS_24 = 24 * 60 * 60 * 1000

function SuggestionCard({ s, onAction }) {
  const cfg = TYPE_CONFIG[s.type] || TYPE_CONFIG.operations
  return (
    <div className={`card border ${cfg.border} space-y-3`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
          <span className="text-xl leading-none">{s.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-app-primary">{s.title}</p>
            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[s.priority]}`} />
          </div>
          <p className="text-xs text-app-muted mt-1 leading-relaxed">{s.body}</p>
        </div>
      </div>
      {s.action && (
        <button onClick={() => onAction(s)} className={`w-full text-center text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] ${cfg.bg} ${cfg.text}`}>
          {s.action} →
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-surface-200 rounded-2xl" />
        {[1,2,3].map(i => <div key={i} className="h-32 bg-surface-200 rounded-2xl" />)}
      </div>
      <p className="text-center text-sm text-app-faint animate-pulse">Analizando tu negocio...</p>
    </div>
  )
}

export default function AIPage() {
  const navigate  = useNavigate()
  const settings  = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const addToast  = useAppStore((s) => s.addToast)

  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState(null)
  const [analyzedAt,  setAnalyzedAt]  = useState(null)
  const [error,       setError]       = useState(null)
  const [hoursLeft,   setHoursLeft]   = useState(0)

  // Cargar análisis guardado al entrar
  useEffect(() => {
    db.settings.get('aiAnalysis').then(record => {
      if (!record) return
      const { result: saved, timestamp } = record.value
      const age = Date.now() - timestamp
      if (age < HOURS_24) {
        setResult(saved)
        setAnalyzedAt(new Date(timestamp))
        setHoursLeft(Math.ceil((HOURS_24 - age) / (1000 * 60 * 60)))
      }
    })
  }, [])

  // Premium gate
  if (!isPremium) {
    return (
      <div className="flex flex-col min-h-full bg-app">
        <PageHeader title="Asistente IA" back />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5 pb-24">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Sparkles size={40} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-app-primary mb-2">Tu asesora de negocio con IA</h2>
            <p className="text-sm text-app-muted leading-relaxed">Analizá tus ventas, costos y patrones en segundos.</p>
          </div>
          <div className="w-full space-y-2.5 text-left">
            {['📈 Detecta qué platos te dan más ganancia real','⏰ Te dice cuándo es tu hora pico de pedidos','🛒 Alerta si vas a quedarte sin stock','💡 Sugiere acciones concretas con tus números','📉 Identifica gastos que se comen tu ganancia'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-app-muted bg-white rounded-xl px-3 py-2.5 border border-app">{f}</div>
            ))}
          </div>
          <button onClick={() => navigate('/premium')} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-4 rounded-2xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-md">
            <Star size={18} /> Activar Premium — $5/mes
          </button>
        </div>
      </div>
    )
  }

  const canAnalyze = !result && !loading
  const isBlocked  = !!result && hoursLeft > 0

  async function runAnalysis() {
    if (isBlocked || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const context = await buildAIContext(settings)
      const hasData = context.recipes?.length > 0 || context.orders?.length > 0 || context.ingredients?.length > 0
      if (!hasData) {
        setError('sin_datos')
        setLoading(false)
        return
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(context),
          messages: [{ role: 'user', content: buildUserPrompt(context) }],
        }),
      })

      if (!response.ok) throw new Error(`Error API: ${response.status}`)
      const data   = await response.json()
      const raw    = data.content?.find(b => b.type === 'text')?.text ?? ''
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

      const now = Date.now()
      await db.settings.put({ key: 'aiAnalysis', value: { result: parsed, timestamp: now } })
      setResult(parsed)
      setAnalyzedAt(new Date(now))
      setHoursLeft(24)
    } catch (err) {
      console.error('AI error:', err)
      setError('api')
      addToast({ type: 'error', message: 'Error al consultar la IA' })
    } finally {
      setLoading(false)
    }
  }

  function handleAction(s) {
    const routes = { revenue: '/productos', cost: '/gastos', stock: '/stock', marketing: '/clientes', operations: '/comandas' }
    navigate(routes[s.type] || '/')
  }

  function formatTime(date) {
    return date?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col min-h-full bg-app">
      <PageHeader title="Asistente IA" subtitle="Análisis de tu negocio" back />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-28 px-4 py-4 space-y-4">

        {/* Estado inicial sin resultado */}
        {!loading && !result && error !== 'sin_datos' && !error && (
          <div className="flex flex-col items-center text-center py-10 gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
              <Sparkles size={36} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-app-primary">¿Qué está pasando en tu negocio?</h2>
              <p className="text-sm text-app-muted mt-2 leading-relaxed max-w-xs mx-auto">La IA analiza tus ventas, costos, stock y clientes para darte sugerencias concretas.</p>
            </div>
            <div className="w-full space-y-2 text-left text-sm text-app-muted">
              {['📊 Últimos 30 días de ventas','🏆 Platos más vendidos y rentables','⚠️ Stock bajo y compras urgentes','💸 Gastos fijos vs ganancias reales','🕐 Hora pico y patrones de pedidos'].map(item => (
                <div key={item} className="bg-white rounded-xl px-3 py-2.5 border border-app">{item}</div>
              ))}
            </div>
          </div>
        )}

        {loading && <LoadingSkeleton />}

        {/* Error sin datos */}
        {error === 'sin_datos' && !loading && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700">No hay datos suficientes</p>
                <p className="text-xs text-amber-600 mt-1">Necesitás al menos un ingrediente, un producto y una comanda entregada.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['🧂','Ingrediente','/stock/nuevo'],['🍳','Producto','/productos/nuevo'],['📋','Comanda','/comandas/nueva']].map(([emoji,label,path]) => (
                <button key={path} onClick={() => navigate(path)} className="card text-center py-3 active:scale-95 transition-all">
                  <p className="text-xl mb-1">{emoji}</p>
                  <p className="text-xs font-semibold text-app-secondary">{label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error API */}
        {error === 'api' && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-700">No se pudo conectar con la IA. Revisá tu conexión.</p>
          </div>
        )}

        {/* Resultado */}
        {result && !loading && (
          <>
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-primary-200" />
                <p className="text-xs font-bold text-primary-200 uppercase tracking-wide">Análisis IA</p>
                {analyzedAt && <p className="text-xs text-primary-300 ml-auto">{formatTime(analyzedAt)}</p>}
              </div>
              <p className="text-base font-bold leading-snug">{result.greeting}</p>
              <p className="text-sm text-primary-100 mt-2 leading-relaxed">{result.summary}</p>
            </div>

            {result.alert && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${result.alert.severity === 'danger' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <AlertTriangle size={18} className={result.alert.severity === 'danger' ? 'text-red-500' : 'text-amber-500'} />
                <p className={`text-sm font-semibold ${result.alert.severity === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>{result.alert.message}</p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-bold text-app-muted uppercase tracking-wide px-1">{result.suggestions?.length} sugerencias personalizadas</p>
              {result.suggestions?.map(s => <SuggestionCard key={s.id} s={s} onAction={handleAction} />)}
            </div>

            {/* Aviso de bloqueo */}
            {isBlocked && (
              <div className="flex items-center gap-2 bg-surface-100 rounded-2xl px-4 py-3">
                <Clock size={16} className="text-app-faint shrink-0" />
                <p className="text-xs text-app-muted">Próximo análisis disponible en <span className="font-bold text-app-secondary">{hoursLeft}hs</span></p>
              </div>
            )}

            <p className="text-xs text-app-faint text-center px-4 leading-relaxed">Análisis basado en los datos registrados en MiCuchina.</p>
          </>
        )}
      </div>

      {/* Botón CTA — solo visible si puede analizar */}
      {!loading && canAnalyze && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-app px-4 py-3 z-30">
          <button onClick={runAnalysis} className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-4 rounded-2xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-sm">
            <Sparkles size={20} /> Analizar mi negocio
          </button>
        </div>
      )}
    </div>
  )
}
