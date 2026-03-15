# MiCocina — PWA para vendedores de comida casera

## ¿Cómo levantar el proyecto?

### 1. Requisitos previos
- Node.js 18+ instalado
- Una terminal (CMD, PowerShell, o Terminal en Mac/Linux)

### 2. Instalar dependencias
```bash
npm install
```

### 3. Correr en modo desarrollo
```bash
npm run dev
```
Abrí http://localhost:5173 en tu navegador (o en el celular conectado a la misma red WiFi).

### 4. Build para producción
```bash
npm run build
```
Los archivos quedan en la carpeta `dist/` listos para subir a Vercel o Railway.

---

## Estructura del proyecto
```
src/
├── components/       # Componentes reutilizables
│   ├── BottomNav.jsx     → Navegación inferior
│   ├── BottomSheet.jsx   → Modal desde abajo
│   ├── EmptyState.jsx    → Estado vacío
│   ├── PageHeader.jsx    → Header de cada pantalla
│   ├── PremiumGate.jsx   → Bloqueo de funciones premium
│   └── ToastContainer.jsx → Notificaciones
├── pages/            # Pantallas de la app
│   ├── DashboardPage.jsx   → Inicio / resumen
│   ├── ProductsPage.jsx    → Módulo de productos
│   ├── OrdersPage.jsx      → Módulo de comandas
│   ├── StockPage.jsx       → Módulo de stock/ingredientes
│   ├── SettingsPage.jsx    → Configuración
│   ├── OnboardingPage.jsx  → Flujo de bienvenida
│   └── PremiumPage.jsx     → Pantalla de upgrade
├── store/
│   └── appStore.js   → Estado global (Zustand)
├── db.js             → Base de datos local offline (Dexie/IndexedDB)
├── App.jsx           → Enrutamiento principal
├── main.jsx          → Punto de entrada
└── index.css         → Estilos globales + Tailwind
```

## Módulos completados
- [x] Estructura base + navegación + PWA config
- [x] Onboarding (4 pasos)
- [x] Dashboard (estructura, pendiente datos reales)
- [x] Ingredientes — CRUD completo + historial de precios + actualizador rápido + stock
- [x] Recetas/Productos — formulario, detalle, precio rápido
- [x] Comandas — nueva comanda, flujo de estados, WhatsApp, cancelación con stock
- [ ] Dashboard con datos reales
- [ ] Módulo de gastos fijos (Premium)
- [ ] CRM de clientes (Premium)
- [ ] Integración MercadoPago
- [ ] Sugerencias IA (Claude API)
