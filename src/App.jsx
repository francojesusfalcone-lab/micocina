import React, { useEffect, useState, useRef } from 'react'
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

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 animate-pulse">
        <span className="text-white text-2xl">🍳</span>
      </div>
      <p className="text-primary-600 font-semibold text-sm">Cargando MiCocina...</p>
    </div>
  )
}

function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative">
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [appReady, setAppReady] = useState(false)
  const bootstrapped = useRef(false)
  const { onboardingDone, setOnboardingDone, updateSettings, setPlan } = useAppStore()

  // Sesion de Supabase — solo una vez al montar
  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data?.session ?? null)
    }).catch(() => { if (active) setSession(null) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) setSession(s ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Bootstrap DB — solo una vez, cuando session deja de ser undefined
  useEffect(() => {
    if (session === undefined) return
    if (bootstrapped.current) return
    bootstrapped.current = true

    async function bootstrap() {
      try {
        await initDB()
        const [businessName, country, currency, currencySymbol, productionCapacity, onboarding] =
          await Promise.all([
            db.settings.get('businessName'),
            db.settings.get('country'),
            db.settings.get('currency'),
            db.settings.get('currencySymbol'),
            db.settings.get('productionCapacity'),
            db.settings.get('onboardingDone'),
          ])

        if (businessName) {
          updateSettings({
            businessName:       businessName.value,
            country:            country?.value        || 'AR',
            currency:           currency?.value       || 'ARS',
            currencySymbol:     currencySymbol?.value  || '$',
            productionCapacity: productionCapacity?.value || 10,
          })
        }

        if (onboarding?.value) setOnboardingDone(true)

        if (session) {
          try {
            const { data: profile } = await supabase
              .from('profiles').select('plan').eq('id', session.user.id).single()
            setPlan(profile?.plan === 'premium' ? 'premium' : 'free')
          } catch {
            setPlan(await loadPlanFromDB(db))
          }
        } else {
          setPlan(await loadPlanFromDB(db))
        }
      } catch (err) {
        console.error('Bootstrap error:', err)
      } finally {
        setAppReady(true)
      }
    }

    bootstrap()
  }, [session])

  if (session === undefined || !appReady) return <LoadingScreen />

  if (session === null) {
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
        <Route path="/*" element={
          !onboardingDone ? <Navigate to="/onboarding" replace /> : (
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
                <Route path="/configuracion"            element={<SettingsPage />} />
                <Route path="/premium"                  element={<PremiumPage />} />
                <Route path="/gastos"                   element={<ExpensesPage />} />
                <Route path="/gastos/nuevo"             element={<ExpenseFormPage />} />
                <Route path="/gastos/editar/:id"        element={<ExpenseFormPage />} />
                <Route path="/clientes"                 element={<ClientsPage />} />
                <Route path="/clientes/nuevo"           element={<ClientFormPage />} />
                <Route path="/clientes/editar/:id"      element={<ClientFormPage />} />
                <Route path="/clientes/:id"             element={<ClientDetailPage />} />
                <Route path="/ia"                       element={<AIPage />} />
                <Route path="/premium/success"          element={<Navigate to="/premium?status=approved" replace />} />
                <Route path="/premium/failure"          element={<Navigate to="/premium?status=failure" replace />} />
                <Route path="/premium/pending"          element={<Navigate to="/premium?status=pending" replace />} />
                <Route path="*"                         element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}
