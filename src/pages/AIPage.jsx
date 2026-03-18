import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, RefreshCw, Lock, TrendingUp, AlertTriangle,
  ShoppingBag, Settings, Megaphone, ChevronRight,
  Sparkles, Star
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAppStore, formatCurrency } from '../store/appStore'
import { buildAIContext, buildSystemPrompt, buildUserPrompt } from '../hooks/useAIContext'

// ─── Type → icon + color ──────────────────────────────────────────────────────
const TYPE_CONFIG = {
  revenue:    { Icon: TrendingUp,  bg: 'bg-primary-50',  text: 'text-primary-600',  border: 'border-primary-100' },
  cost:       { Icon: Settings,    bg: 'bg-amber-50',    text: 'text-amber-600',    border: 'border-amber-100' },
  stock:      { Icon: ShoppingBag, bg: 'bg-blue-50',     text: 'text-blue-600',     border: 'border-blue-100' },
  marketing:  { Icon: Megaphone,   bg: 'bg-purple-50',   text: 'text-purple-600',   border: 'border-purple-100' },
  operations: { Icon: Settings,    bg: 'bg-surface-100', text: 'text-gray-600',     border: 'border-surface-200' },
}

const PRIORITY_DOT = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
}

// ─── Suggestion card ──────────────────────────────────────────────────────────
function SuggestionCard({ s, onAction, navigate }) {
  const cfg = TYPE_CONFIG[s.type] || TYPE_CONFIG.operations
  const { Icon } = cfg

  return (
    <div className={`card border ${cfg.border} space-y-3`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
          <span className="text-xl leading-none">{s.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900">{s.title}</p>
            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[s.priority]}`} />
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.body}</p>
        </div>
      </div>
      {s.action && (
        <button
          onClick={() => onAction(s)}
          className={`w-full text-center text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] ${cfg.bg} ${cfg.text}`}
        >
          {s.action} →
        </button>
      )}
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-surface-200 rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-surface-200 rounded-2xl" />
        ))}
      </div>
      <p className="text-center text-sm text-gray-400 animate-pulse">
        Analizando tu negocio...
      </p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AIPage() {
  const navigate  = useNavigate()
  const settings  = useAppStore((s) => s.settings)
  const isPremium = useAppStore((s) => s.isPremium())
  const addToast  = useAppStore((s) => s.addToast)

  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState(null)  // parsed AI response
  const [lastUpdated,  setLastUpdated]  = useState(null)
  const [error,        setError]        = useState(null)

  // ── Premium gate ──────────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <div className="flex flex-col min-h-full bg-surface-50">
        <PageHeader title="Asistente IA" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5 pb-24">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Sparkles size={40} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">
              Tu asesora de negocio con IA
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Analizá tus ventas, costos y patrones en segundos. La IA te dice exactamente qué hacer para ganar más con tu cocina.
            </p>
          </div>
          <div className="w-full space-y-2.5 text-left">
            {[
              '📈 Detecta qué platos te dan más ganancia real',
              '⏰ Te dice cuándo es tu hora pico de pedidos',
              '🛒 Alerta si vas a quedarte sin stock',
              '💡 Sugiere acciones concretas con tus números',
              '📉 Identifica gastos que se comen tu ganancia',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-xl px-3 py-2.5 border border-surface-200">
                {f}
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/premium')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-4 rounded-2xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-md"
          >
            <Star size={18} />
            Activar Premium — $5/mes
          </button>
        </div>
      </div>
    )
  }

  // ── Fetch analysis ────────────────────────────────────────────────────────
  async function runAnalysis() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const context = await buildAIContext(settings)

      // Verificar que haya datos suficientes para analizar
      const hasData = context.recipes?.length > 0 || context.orders?.length > 0 || context.ingredients?.length > 0
      if (!hasData) {
        setError('Todavía no tenés datos cargados. Agregá ingredientes, productos o comandas para que la IA pueda analizar tu negocio.')
        setLoading(false)
        return
      }
      const systemPrompt = buildSystemPrompt(context)
      const userPrompt   = buildUserPrompt(context)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     systemPrompt,
          messages:   [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) throw new Error(`Error API: ${response.status}`)

      const data = await response.json()
      const raw  = data.content?.find((b) => b.type === 'text')?.text ?? ''

      // Parse JSON — strip any accidental markdown fences
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      setResult(parsed)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('AI error:', err)
      setError('No se pudo obtener el análisis. Revisá tu conexión e intentá de nuevo.')
      addToast({ type: 'error', message: 'Error al consultar la IA' })
    } finally {
      setLoading(false)
    }
  }

  function handleSuggestionAction(s) {
    // Map suggestion types to routes
    const routes = {
      revenue:    '/productos',
      cost:       '/gastos',
      stock:      '/stock',
      marketing:  '/clientes',
      operations: '/comandas',
    }
    navigate(routes[s.type] || '/')
  }

  function formatTime(date) {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col min-h-full bg-surface-50">
      <PageHeader
        title="Asistente IA"
        subtitle="Análisis de tu negocio"
        action={
          result && !loading && (
            <button
              onClick={runAnalysis}
              className="flex items-center gap-1.5 bg-surface-100 text-gray-600 text-sm font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
              Actualizar
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-none pb-28 px-4 py-4 space-y-4">

        {/* ── Initial state ── */}
        {!loading && !result && !error && (
          <div className="flex flex-col items-center text-center py-10 gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
              <Sparkles size={36} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-gray-900">
                ¿Qué está pasando en tu negocio?
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">
                La IA analiza tus ventas, costos, stock y clientes para darte sugerencias concretas y personalizadas.
              </p>
            </div>
            <div className="w-full space-y-2 text-left text-sm text-gray-500">
              <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide px-1">¿Qué analiza?</p>
              {[
                '📊 Últimos 30 días de ventas',
                '🏆 Platos más vendidos y rentables',
                '⚠️ Stock bajo y compras urgentes',
                '💸 Gastos fijos vs ganancias reales',
                '🕐 Hora pico y patrones de pedidos',
              ].map((item) => (
                <div key={item} className="bg-white rounded-xl px-3 py-2.5 border border-surface-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <LoadingSkeleton />}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">No se pudo analizar</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <>
            {/* Greeting */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-primary-200" />
                <p className="text-xs font-bold text-primary-200 uppercase tracking-wide">Análisis IA</p>
                {lastUpdated && (
                  <p className="text-xs text-primary-300 ml-auto">{formatTime(lastUpdated)}</p>
                )}
              </div>
              <p className="text-base font-bold leading-snug">{result.greeting}</p>
              <p className="text-sm text-primary-100 mt-2 leading-relaxed">{result.summary}</p>
            </div>

            {/* Alert (si hay) */}
            {result.alert && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
                result.alert.severity === 'danger'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <AlertTriangle size={18} className={result.alert.severity === 'danger' ? 'text-red-500' : 'text-amber-500'} />
                <p className={`text-sm font-semibold ${result.alert.severity === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>
                  {result.alert.message}
                </p>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                {result.suggestions?.length} sugerencias personalizadas
              </p>
              {result.suggestions?.map((s) => (
                <SuggestionCard
                  key={s.id}
                  s={s}
                  onAction={handleSuggestionAction}
                  navigate={navigate}
                />
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 text-center px-4 leading-relaxed">
              Análisis basado en los datos registrados en MiCocina. Las sugerencias son orientativas.
            </p>
          </>
        )}

      </div>

      {/* ── Fixed CTA ── */}
      {!loading && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-surface-200 px-4 py-3 z-30">
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-4 rounded-2xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base shadow-sm disabled:opacity-50"
          >
            <Sparkles size={20} />
            {result ? 'Nuevo análisis' : 'Analizar mi negocio'}
          </button>
        </div>
      )}
    </div>
  )
}
