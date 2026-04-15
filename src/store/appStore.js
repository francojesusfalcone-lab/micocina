import { create } from 'zustand'

// ─── App Store ───────────────────────────────────────────────────────────────
export const useAppStore = create((set, get) => ({
  // Plan del usuario
  plan: 'free', // 'free' | 'premium'
  setPlan: (plan) => set((s) => s.plan === plan ? s : { plan }),
  isPremium: () => get().plan === 'premium',

  // Configuración del negocio
  settings: {
    businessName: 'Mi Cocina',
    country: 'AR',
    currency: 'ARS',
    currencySymbol: '$',
    productionCapacity: 10,
    language: 'es',
  },
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),

  // UI State
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Onboarding
  onboardingDone: false,
  setOnboardingDone: (val) => set({ onboardingDone: val }),

  // Bottom sheet / modal state
  bottomSheet: null, // { type: string, data?: any }
  openBottomSheet: (sheet) => set({ bottomSheet: sheet }),
  closeBottomSheet: () => set({ bottomSheet: null }),

  // Toast notifications
  toasts: [],
  addToast: (toast) => {
    const id = Date.now()
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, toast.duration || 3000)
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const formatCurrency = (amount, symbol = '$') => {
  if (amount === null || amount === undefined) return `${symbol}0`
  return `${symbol}${Number(amount).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
