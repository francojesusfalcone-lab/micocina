import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { db, initDB } from './db'
import { loadPlanFromDB } from './lib/mercadopago'

// Layout
import BottomNav from './components/BottomNav'
import ToastContainer from './components/ToastContainer'

// Pages
import OnboardingPage      from './pages/OnboardingPage'
import DashboardPage       from './pages/DashboardPage'
import ProductsPage        from './pages/ProductsPage'
import OrdersPage          from './pages/OrdersPage'
import StockPage           from './pages/StockPage'
import SettingsPage        from './pages/SettingsPage'
import PremiumPage         from './pages/PremiumPage'
import IngredientFormPage  from './pages/IngredientFormPage'
import IngredientDetailPage from './pages/IngredientDetailPage'
import UpdatePricesPage    from './pages/UpdatePricesPage'
import RecipeFormPage        from './pages/RecipeFormPage'
import RecipeDetailPage      from './pages/RecipeDetailPage'
import QuickPricePage        from './pages/QuickPricePage'
import OrderFormPage         from './pages/OrderFormPage'
import OrderDetailPage       from './pages/OrderDetailPage'
import ExpensesPage          from './pages/ExpensesPage'
import ExpenseFormPage        from './pages/ExpenseFormPage'
import ClientsPage           from './pages/ClientsPage'
import ClientDetailPage      from './pages/ClientDetailPage'
import ClientFormPage        from './pages/ClientFormPage'
import AIPage                from './pages/AIPage'

// ─── Loading screen ───────────────────────────────────────────────────────────
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

// ─── Main layout wrapper (with bottom nav) ────────────────────────────────────
function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative">
      <main className="flex-1">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true)
  const { onboardingDone, setOnboardingDone, updateSettings, setPlan } = useAppStore()

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDB()

        // Load persisted settings
        const [
          businessName, country, currency, currencySymbol,
          productionCapacity, onboarding, plan
        ] = await Promise.all([
          db.settings.get('businessName'),
          db.settings.get('country'),
          db.settings.get('currency'),
          db.settings.get('currencySymbol'),
          db.settings.get('productionCapacity'),
          db.settings.get('onboardingDone'),
          db.user.get('plan'),
        ])

        if (businessName) {
          updateSettings({
            businessName:       businessName.value,
            country:            country?.value       || 'AR',
            currency:           currency?.value      || 'ARS',
            currencySymbol:     currencySymbol?.value || '$',
            productionCapacity: productionCapacity?.value || 10,
          })
        }

        if (onboarding?.value) {
          setOnboardingDone(true)
        }

        const resolvedPlan = await loadPlanFromDB(db)
        setPlan(resolvedPlan)
      } catch (err) {
        console.error('Bootstrap error:', err)
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Onboarding — shown only if not done */}
        <Route
          path="/onboarding"
          element={
            onboardingDone
              ? <Navigate to="/" replace />
              : <OnboardingPage />
          }
        />

        {/* Redirect to onboarding if not done */}
        <Route
          path="/*"
          element={
            !onboardingDone
              ? <Navigate to="/onboarding" replace />
              : (
                <AppLayout>
                  <Routes>
                    <Route path="/"                          element={<DashboardPage />} />
                    <Route path="/productos"                  element={<ProductsPage />} />
                    <Route path="/comandas"                   element={<OrdersPage />} />
                    <Route path="/comandas/nueva"             element={<OrderFormPage />} />
                    <Route path="/comandas/:id"               element={<OrderDetailPage />} />
                    <Route path="/stock"                      element={<StockPage />} />
                    <Route path="/stock/nuevo"                element={<IngredientFormPage />} />
                    <Route path="/stock/editar/:id"           element={<IngredientFormPage />} />
                    <Route path="/stock/:id"                  element={<IngredientDetailPage />} />
                    <Route path="/stock/actualizar-precios"   element={<UpdatePricesPage />} />
                    <Route path="/productos/nuevo"           element={<RecipeFormPage />} />
                    <Route path="/productos/editar/:id"      element={<RecipeFormPage />} />
                    <Route path="/productos/:id"             element={<RecipeDetailPage />} />
                    <Route path="/precio-rapido"             element={<QuickPricePage />} />
                    <Route path="/configuracion"              element={<SettingsPage />} />
                    <Route path="/premium"                    element={<PremiumPage />} />
                    <Route path="/gastos"                      element={<ExpensesPage />} />
                    <Route path="/gastos/nuevo"                element={<ExpenseFormPage />} />
                    <Route path="/gastos/editar/:id"           element={<ExpenseFormPage />} />
                    <Route path="/clientes"                    element={<ClientsPage />} />
                    <Route path="/clientes/nuevo"              element={<ClientFormPage />} />
                    <Route path="/clientes/editar/:id"         element={<ClientFormPage />} />
                    <Route path="/clientes/:id"                element={<ClientDetailPage />} />
                    <Route path="/ia"                          element={<AIPage />} />
                    <Route path="/premium/success"             element={<Navigate to="/premium?status=approved" replace />} />
                    <Route path="/premium/failure"             element={<Navigate to="/premium?status=failure" replace />} />
                    <Route path="/premium/pending"             element={<Navigate to="/premium?status=pending" replace />} />
                    {/* Fallback */}
                    <Route path="*"                           element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
