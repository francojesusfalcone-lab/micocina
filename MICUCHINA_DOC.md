# MiCuchina — Documento Técnico y Funcional Completo

## Resumen General

**MiCuchina** es una Progressive Web App (PWA) para emprendedores gastronómicos informales de Latinoamérica (principalmente Argentina). Permite gestionar recetas, comandas, stock, gastos, clientes y rentabilidad desde el celular. Tiene modelo freemium con pagos vía MercadoPago.

- **Producción:** https://www.micuchina.com
- **Stack:** React + Vite + Tailwind + Dexie (IndexedDB) + Supabase (auth + sync) + Vercel
- **Repositorio:** https://github.com/francojesusfalcone-lab/micocina
- **Supabase proyecto:** nlbetqmmossvdxaqimjr
- **Target:** Cocineros/as caseros, emprendedores gastronómicos, pequeños negocios de comida

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Base de datos local | Dexie (IndexedDB) — funciona offline |
| Auth | Supabase Auth (Google OAuth) |
| Sync cross-device | Supabase Postgres (8 tablas con RLS) |
| Pagos | MercadoPago Checkout Pro |
| Deploy | Vercel (git push → auto deploy) |
| IA | Anthropic Claude API (claude-sonnet-4) |
| PWA | Service Worker + manifest |

---

## Modelo de Planes

### Plan Gratis (Free)
- Hasta 10 comandas por día
- Hasta 8 recetas/productos
- Stock e ingredientes ilimitados
- Sin CRM de clientes
- Sin gastos fijos
- Sin análisis IA
- Sin historial de precios de ingredientes
- Sin combos

### Plan Premium — USD 9.99/mes o USD 89.99/año (-25%)
- Comandas ilimitadas
- Recetas y productos ilimitados
- **CRM de clientes** con historial y deudas (fiado)
- **Gastos fijos** con normalización mensual
- **Análisis IA** del negocio (manual, cooldown 24hs)
- **Historial de precios** de ingredientes
- **Combos** (precio fijo, descuenta stock de sub-productos)
- Sync cross-device vía Supabase

**Pago:** MercadoPago Checkout Pro → webhook activa plan en Supabase → `profiles` table → sincroniza en boot

---

## Flujo de Usuario

### Primera vez
1. Entra a micuchina.com → LoginPage (Google OAuth)
2. OnboardingPage: elige país + escribe nombre del negocio → "¡Empezar!"
3. Tutorial de bienvenida (modal, 6 pasos) aparece automáticamente
4. Dashboard principal

### Uso diario
1. Abrir jornada → cargar ingredientes/recetas si es nuevo
2. Recibir pedidos → crear comandas → actualizar estado
3. Ver ganancias del día en dashboard
4. A las 21hs → notificación de resumen del día (si hubo entregas)

---

## Pantallas y Funcionalidades

### 1. LoginPage (`/`)
- Logo MiCuchina + botón "Continuar con Google"
- Google OAuth vía Supabase
- Redirección a `/auth/callback` → App

### 2. OnboardingPage (`/onboarding`)
- **1 sola pantalla:** nombre del negocio (opcional) + grilla de países (requerido)
- 13 países de Latinoamérica + España + "Otro"
- Guarda en IndexedDB: businessName, country, currency, currencySymbol
- Botón "¡Empezar!" habilitado solo si se seleccionó país
- **Solo aparece una vez**

### 3. WelcomeTutorial (modal)
- Aparece sobre el Dashboard la primera vez
- 6 pasos: Ingredientes → Recetas/Combos → Registrar pedidos → Pagos/Entregas → Ganancias → Ayuda en Config
- Guardado en IndexedDB `tutorialShown`
- Botón "Saltar tutorial" disponible en pasos 1-5

### 4. Dashboard (`/`)
**Siempre visible:**
- Header: logo + nombre del negocio + botón jornada + badge plan
- Banner "Jornada cerrada" si no está activa
- **Stat principal:** Ganado hoy (revenue del período + pedidos entregados + % cambio vs anterior + margen del día)
- **Acciones rápidas:** Nueva comanda, Productos, Stats, Stock bajo
- **Alerta stock bajo** (si hay ingredientes críticos)
- **Comandas activas** (lista de las 5 más recientes con estado, pago, hora)
- **Datos del período:** producto más vendido, hora pico, total sin cobrar

**Solo Premium:**
- **Ganancia real** (ingresos − gastos fijos del día)
- **Widget IA:** acceso rápido a análisis

**Sistema de Jornada:**
- Botón "Abrir/Cerrar" en header
- Stats del dashboard se calculan dentro del período de jornada activa
- Al cerrar jornada, stats quedan "congeladas" del último período

### 5. Productos (`/productos`)
- Tabs: Con receta / Sin receta / Combos (Premium)
- **Plan Free:** contador 0/8 visible
- Lista de recetas con nombre, categoría, precio de venta, costo calculado, margen
- Búsqueda en tiempo real
- Botón "+ Agregar"
- Acceso a **Generador de precio rápido** (sin armar receta completa)

### 6. Formulario de Receta (`/productos/nuevo`, `/productos/editar/:id`)
- Nombre, categoría (12 categorías predefinidas), precio de venta
- Lista de ingredientes con cantidad y unidad
- Cálculo automático de costo total y margen
- Conversiones de unidades (g↔kg, ml↔l, tazas, cucharadas)
- Toggle activo/inactivo

### 7. Combos (`/combos`) — Solo Premium
- Precio fijo para un conjunto de productos
- Al entregar una comanda con combo, descuenta stock de los sub-productos proporcionalmente

### 8. Comandas (`/comandas`)
- Tabs: Activas / Entregadas / Todas
- **Plan Free:** contador 0/10 hoy visible
- Lista con estado (punto de color), cliente, método de pago, hora de entrega, total
- Búsqueda

**Estados de comanda (3 estados de cancelación):**
- pending → preparing → ready → delivered
- cancelled (vuelve al stock)
- cancelled_wasted (inutilizado, no vuelve)

### 9. Formulario de Comanda (`/comandas/nueva`)
- Selector de productos con buscador (bottom sheet)
- Stepper de cantidad por producto
- **Autocompletado de clientes** desde CRM (busca al escribir nombre)
- Método de pago: Efectivo / Transferencia / MercadoPago / Debe
- Toggle "¿Ya pagó?"
- Hora de entrega (time picker) → programa notificación automáticamente
- Campos opcionales colapsables: teléfono, dirección, notas
- Total calculado en tiempo real en footer fijo

### 10. Detalle de Comanda (`/comandas/:id`)
- Estado actual + botones de avance de estado
- Items con precio unitario y cantidad
- Datos del cliente (si tiene CRM vinculado)
- Botón WhatsApp (genera mensaje formateado)
- Cancelación con 2 opciones (vuelve al stock / inutilizado)
- Marcar como pagado

### 11. Stock (`/stock`)
- Lista de ingredientes con precio/unidad, stock actual
- Badge "Stock bajo" si está por debajo del mínimo configurado
- Alerta de stock bajo al tope si hay críticos
- Búsqueda

### 12. Formulario de Ingrediente (`/stock/nuevo`, `/stock/editar/:id`)
- Nombre, categoría (11 categorías), unidad (8 opciones), precio por unidad
- Stock actual + stock mínimo de alerta
- Al guardar: guarda historial de precios si cambió

### 13. Detalle de Ingrediente (`/stock/:id`)
- Gráfico/historial de precios
- Recetas que usan este ingrediente
- Actualización rápida de stock

### 14. CRM Clientes (`/clientes`) — Solo Premium
- Lista de clientes ordenada por nombre
- Búsqueda
- Estadísticas por cliente: total gastado, pedidos, producto favorito, deuda (fiado)

### 15. Detalle de Cliente (`/clientes/:id`)
- Historial completo de pedidos
- Total gastado, pedidos entregados, promedio por pedido
- Deuda total (comandas "Debe" no pagadas)
- Producto favorito con cantidad

### 16. Gastos Fijos (`/gastos`) — Solo Premium
- Lista de gastos con categoría, monto, frecuencia
- Normalización a costo mensual y diario equivalente
- 10 categorías: gas, luz, agua, alquiler, packaging, transporte, teléfono, sueldos, limpieza, otros
- Frecuencias: mensual, semanal, diario, anual, único

### 17. Estadísticas (`/estadisticas`)
- Revenue por período (día / semana / mes)
- Productos más vendidos ranking
- Hora pico de pedidos
- Margen promedio
- Comparativo vs período anterior

### 18. Asistente IA (`/ia`) — Solo Premium
- **Estado inicial:** descripción de qué analiza + aviso "mínimo 2 días de datos" + disclaimer "orientativo, la decisión final es tuya"
- **Botón manual:** "Analizar mi negocio" — nunca automático
- **Cooldown:** 24 horas entre análisis
- **Resultado fijo** hasta que vuelva a pedir uno nuevo
- **Análisis incluye:** greeting personalizado, resumen del negocio, alerta prioritaria (si hay), 3-5 sugerencias concretas con tipo (revenue/cost/stock/marketing/operations), prioridad (high/medium/low) y acción directa
- **Disclaimer al pie:** "Análisis orientativo. La decisión final siempre es tuya."

**Sin datos:** muestra error con accesos directos a crear ingrediente/producto/comanda

### 19. Premium (`/premium`)
**Pantalla Free:**
- Hero con gradiente dorado: precio USD 9.99/mes o USD 89.99/año
- Tabla comparativa Free vs Premium (8 funciones)
- Selector Mensual/Anual
- Botón "Pagar con MercadoPago" → crea preferencia en backend → redirige a MP Checkout

**Pantalla Premium activo:**
- "¡Ya sos Premium! ⭐"
- Tabla de funciones incluidas
- Bloque renovar plan (selector mensual/anual + botón Renovar)
- Botón "Ir al dashboard"

**Pantalla éxito post-pago (`?status=approved`):**
- "¡Bienvenida a Premium! 🎉" con fondo oscuro y corona dorada

**Pantalla pago pendiente:**
- Aviso de procesamiento

### 20. Configuración (`/configuracion`)
**Mi negocio:**
- Nombre del negocio (editable)
- País y moneda (editable con 13 opciones)

**Funciones:**
- Mi plan Premium (si aplica)
- Gastos fijos (con badge PRO si es free)
- CRM Clientes (con badge PRO si es free)
- Notificaciones: "Funcionan solo con la app abierta"
- Modo oscuro (toggle)
- Privacidad y datos

**Cuenta y datos:**
- ¿Cómo funciona MiCuchina? → HowItWorksPage
- Versión 0.1.0 Beta
- Instalar como app (PWA prompt o instrucciones manual)
- Invitar amigos
- Términos y condiciones
- Cerrar sesión
- Borrar todos los datos (con confirmación doble)

**Footer:** "MiCuchina · Hecho con ❤️ para el chef de tu negocio"

**Easter egg dev:** 7 taps en el footer togglea plan free/premium (para testing)

### 21. HowItWorksPage (`/como-funciona`)
- Guía completa de uso paso a paso
- Accesible desde Configuración

### 22. InvitePage (`/invitar`)
- Compartir enlace de MiCuchina

### 23. TermsPage (`/terminos`)
- Términos y condiciones + privacidad

---

## Sistema de Notificaciones

**Todas funcionan solo con la app abierta (Web Notifications API, no push)**

Al entrar, pide permiso al usuario.

| Notificación | Cuándo se dispara |
|---|---|
| Stock bajo general | Al arrancar la app si hay ingredientes críticos |
| Stock bajo individual | Cada vez que se descuenta stock y queda por debajo del mínimo |
| Pedido próximo | 15 minutos antes de la hora de entrega de cada comanda |
| Pedido sin cobrar | Al marcar como "entregado" una comanda con método "Debe" |
| Resumen del día | Todos los días a las 21:00hs si hubo pedidos entregados |

Las notificaciones de comandas se programan al crear la comanda y se cancelan al entregar o cancelar.

---

## Sistema de Sincronización (Supabase)

### Tablas en Supabase (con RLS)
Cada usuario solo ve sus propios datos.

- `profiles` — plan, plan_type, plan_expires
- `ingredients` — stock, precio, categoría
- `ingredient_price_history` — historial de precios
- `recipes` — recetas y combos
- `recipe_ingredients` — ingredientes por receta
- `orders` — comandas
- `order_items` — items por comanda
- `clients` — CRM clientes
- `expenses` — gastos fijos

### Estrategia
- **Local first:** todo se guarda en IndexedDB primero → UI reactiva sin delay
- **Push en background:** cada escritura llama `pushRecord()` que replica en Supabase async
- **Pull en boot:** al iniciar sesión, `syncFromSupabase()` descarga datos del servidor a IndexedDB
- **Soft delete:** los registros eliminados se marcan con `deleted_at` en Supabase

---

## Infraestructura / Backend

### Variables de entorno (Vercel)
- `MP_ACCESS_TOKEN` — server only (MercadoPago producción)
- `VITE_MP_PUBLIC_KEY` — frontend (MP)
- `SUPABASE_SERVICE_ROLE_KEY` — server only
- `VITE_SUPABASE_URL` — frontend
- `VITE_SUPABASE_ANON_KEY` — frontend

### Funciones serverless (Vercel /api)
- `api/create-preference.js` — crea preferencia de pago en MP, recibe userId + plan
- `api/webhook-mp.js` — recibe notificación de MP, verifica pago aprobado, activa plan en `profiles`

### Webhook MercadoPago
- Registrado para prueba y producción en el panel de MP
- URL: `https://www.micuchina.com/api/webhook-mp`
- Evento: `payment`

---

## Autenticación

- Google OAuth vía Supabase
- Supabase auto-restaura sesión desde localStorage al recargar
- Al tener sesión: lee plan de `profiles`, activa sync, llama `setSyncUserId`
- Sin sesión: funciona en modo local sin sync

---

## Datos Locales (IndexedDB / Dexie)

Schema en `db.js` versión 2:

| Tabla | Índices |
|---|---|
| ingredients | id, name, category, createdAt, updatedAt |
| ingredientPriceHistory | id, ingredientId, price, date |
| recipes | id, name, category, isActive, isPremiumCombo |
| recipeIngredients | id, recipeId, ingredientId |
| orders | id, clientId, status, deliveryTime, paymentMethod |
| orderItems | id, orderId, recipeId |
| clients | id, name, phone, address |
| expenses | id, name, category, amount, isRecurring |
| settings | key (businessName, country, onboardingDone, tutorialShown, aiAnalysis, darkMode) |
| user | key (plan) |
| jornada | key |

---

## Pendientes / Posibles Mejoras Futuras

1. **Notificaciones push reales** — Service Worker completo + Web Push API + backend de push. Hoy solo funcionan con la app abierta.
2. **Manejo de conflictos en sync** — Actualmente last-write-wins. No hay resolución de conflictos si se edita desde 2 dispositivos simultáneamente.
3. **Exportación de datos** — PDF o Excel con resumen de ventas/gastos
4. **Multi-moneda en tiempo real** — Hoy la moneda es fija por país al onboardear
5. **Múltiples negocios** — Hoy es 1 cuenta = 1 negocio

---

## Estado Actual

✅ **Listo para producción** — toda la funcionalidad principal está implementada y testeada.

El flujo de pago con MercadoPago fue testeado con cuentas de prueba y funciona end-to-end: pago → webhook → Supabase → plan activo en cualquier dispositivo.
