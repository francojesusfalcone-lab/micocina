import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { db, initDB } from './db'
import { loadPlanFromDB } from './lib/mercadopago'
import { supabase } from './lib/supabase'
import BottomNav from './components/BottomNav'
import ToastContainer from './components/ToastContainer'
import LoginPage            from './pages/LoginPage'
import AuthCallback         from './pages/AuthCallback'
import OnboardingPage       from './pages/OnboardingPage'
import DashboardPage        from './pages/DashboardPage'
import ProductsPage         from './pages/ProductsPage'
import OrdersPage           from './pages/OrdersPage'
import StockPage            from './pages/StockPage'
import SettingsPage         from './pages/SettingsPage'
import PremiumPage          from './pages/PremiumPage'
import IngredientFormPage   from './pages/IngredientFormPage'
import IngredientDetailPage from './pages/IngredientDetailPage'
import UpdatePricesPage     from './pages/UpdatePricesPage'
import RecipeFormPage       from './pages/RecipeFormPage'
import RecipeDetailPage     from './pages/RecipeDetailPage'
import QuickPricePage       from './pages/QuickPricePage'
import OrderFormPage        from './pages/OrderFormPage'
import OrderDetailPage      from './pages/OrderDetailPage'
import ExpensesPage         from './pages/ExpensesPage'
import ExpenseFormPage      from './pages/ExpenseFormPage'
import ClientsPage          from './pages/ClientsPage'
import ClientDetailPage     from './pages/ClientDetailPage'
import ClientFormPage       from './pages/ClientFormPage'
import AIPage               from './pages/AIPage'
import StatsPage            from './pages/StatsPage'
import LowStockPage         from './pages/LowStockPage'
import EditBusinessNamePage from './pages/EditBusinessNamePage'
import EditCountryPage      from './pages/EditCountryPage'
import CombosPage           from './pages/CombosPage'
import ComboFormPage        from './pages/ComboFormPage'
import HowItWorksPage      from './pages/HowItWorksPage'
import InvitePage           from './pages/InvitePage'
import TermsPage            from './pages/TermsPage'
import SplashScreen         from './components/SplashScreen'
import PageTransition       from './components/PageTransition'
import { useStockNotifications } from './hooks/useStockNotifications'
import { useDarkMode } from './hooks/useDarkMode'

function LoadingScreen() {
  const [imgError, setImgError] = useState(false)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen"
         style={{background:'radial-gradient(ellipse at 40% 35%, #2a2a2a 0%, #1a1a1a 30%, #0d0d0d 60%, #050505 100%)'}}>
      {!imgError ? (
        <img
          src="/logo-full.png"
          alt="MiCuchina"
          className="w-72 object-contain mb-8 animate-scale-in"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-8xl mb-8">🍳</span>
      )}
      <p className="text-sm font-semibold tracking-widest uppercase animate-fade-in" style={{color:'#f4b92a'}}>
        Cargando...
      </p>
    </div>
  )
}

function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative">
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  useStockNotifications()
  useDarkMode()
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  // Splash solo una vez por sesión del browser
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashShown') === '1'
  )
  const { onboardingDone, setOnboardingDone, updateSettings, setPlan } = useAppStore()

  useEffect(() => {
    let booted = false

    async function init(session) {
      if (booted) return
      booted = true
      console.log('[boot] init start, session:', !!session)
      try {
        await initDB()
        console.log('[boot] db ok')
        const [bn, co, cu, cs, pc, ob] = await Promise.all([
          db.settings.get('businessName'), db.settings.get('country'),
          db.settings.get('currency'), db.settings.get('currencySymbol'),
          db.settings.get('productionCapacity'), db.settings.get('onboardingDone'),
        ])
        console.log('[boot] settings ok, onboarding:', ob?.value)
        if (bn) updateSettings({ businessName: bn.value, country: co?.value||'AR', currency: cu?.value||'ARS', currencySymbol: cs?.value||'$', productionCapacity: pc?.value||10 })
        if (ob?.value) setOnboardingDone(true)
        if (session) {
          try {
            const { data } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single()
            // Si Supabase tiene plan premium, usar ese. Si no, usar el local (permite dev toggle)
            if (data?.plan === 'premium') {
              setPlan('premium')
            } else {
              setPlan(await loadPlanFromDB(db))
            }
          } catch { setPlan(await loadPlanFromDB(db)) }
        } else {
          setPlan(await loadPlanFromDB(db))
        }
        console.log('[boot] plan ok')
      } catch(e) { console.error('[boot] error:', e) }
      finally { console.log('[boot] done, ready=true'); setHasSession(!!session); setReady(true) }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (booted) setHasSession(!!session)
    })

    supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (error || !data?.session) {
          Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k) })
          init(null)
          return
        }
        // Siempre forzar re-auth: invalidar token en servidor y limpiar local
        // Esto evita que Supabase renueve el token silenciosamente via Google session
        try { await supabase.auth.signOut({ scope: 'global' }) } catch (_) {}
        Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k) })
        init(null)
      })
      .catch(() => init(null))

    return () => subscription.unsubscribe()
  }, [])

  if (!ready || !splashDone) return (
    <>
      <LoadingScreen />
      <SplashScreen onDone={() => { sessionStorage.setItem('splashShown', '1'); setSplashDone(true) }} />
    </>
  )

  if (!hasSession) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={onboardingDone ? <Navigate to="/" replace /> : <OnboardingPage />} />
        <Route path="/*" element={!onboardingDone ? <Navigate to="/onboarding" replace /> : (
          <AppLayout>
            <Routes>
              <Route path="/"                         element={<DashboardPage />} />
              <Route path="/productos"                element={<ProductsPage />} />
              <Route path="/comandas"                 element={<OrdersPage />} />
              <Route path="/comandas/nueva"           element={<OrderFormPage />} />
              <Route path="/comandas/:id"             element={<OrderDetailPage />} />
              <Route path="/stock"                    element={<StockPage />} />
              <Route path="/stock/nuevo"              element={<IngredientFormPage />} />
              <Route path="/stock/editar/:id"         element={<IngredientFormPage />} />
              <Route path="/stock/:id"                element={<IngredientDetailPage />} />
              <Route path="/stock/actualizar-precios" element={<UpdatePricesPage />} />
              <Route path="/productos/nuevo"          element={<RecipeFormPage />} />
              <Route path="/productos/editar/:id"     element={<RecipeFormPage />} />
              <Route path="/productos/:id"            element={<RecipeDetailPage />} />
              <Route path="/precio-rapido"            element={<QuickPricePage />} />
              <Route path="/configuracion"             element={<SettingsPage />} />
              <Route path="/configuracion/negocio"     element={<EditBusinessNamePage />} />
              <Route path="/configuracion/pais"        element={<EditCountryPage />} />
              <Route path="/premium"                  element={<PremiumPage />} />
              <Route path="/gastos"                   element={<ExpensesPage />} />
              <Route path="/gastos/nuevo"             element={<ExpenseFormPage />} />
              <Route path="/gastos/editar/:id"        element={<ExpenseFormPage />} />
              <Route path="/clientes"                 element={<ClientsPage />} />
              <Route path="/clientes/nuevo"           element={<ClientFormPage />} />
              <Route path="/clientes/editar/:id"      element={<ClientFormPage />} />
              <Route path="/clientes/:id"             element={<ClientDetailPage />} />
              <Route path="/estadisticas"             element={<StatsPage />} />
              <Route path="/stock/alertas"            element={<LowStockPage />} />
              <Route path="/combos"                   element={<CombosPage />} />
              <Route path="/combos/nuevo"             element={<ComboFormPage />} />
              <Route path="/combos/:id"               element={<ComboFormPage />} />
              <Route path="/como-funciona"             element={<HowItWorksPage />} />
              <Route path="/invitar"                   element={<InvitePage />} />
              <Route path="/terminos"                 element={<TermsPage />} />
              <Route path="/ia"                       element={<AIPage />} />
              <Route path="/premium/success"          element={<Navigate to="/premium?status=approved" replace />} />
              <Route path="/premium/failure"          element={<Navigate to="/premium?status=failure" replace />} />
              <Route path="/premium/pending"          element={<Navigate to="/premium?status=pending" replace />} />
              <Route path="*"                         element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        )} />
      </Routes>
    </BrowserRouter>
  )
}
