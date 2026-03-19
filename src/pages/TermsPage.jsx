import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TermsPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="bg-surface border-b border-app px-4 py-4 flex items-center gap-3 pt-safe">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-display font-bold text-app-primary">Términos y Condiciones</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 space-y-5 text-sm text-app-secondary leading-relaxed">

        <p className="text-xs text-app-faint">Última actualización: marzo 2026</p>

        <section className="space-y-2">
          <h2 className="font-bold text-app-primary">1. Aceptación</h2>
          <p>Al usar MiCuchina aceptás estos términos. Si no los aceptás, no uses la app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-app-primary">2. El servicio</h2>
          <p>MiCuchina es una herramienta de gestión para negocios de comida casera. Te ayuda a calcular costos, registrar pedidos y analizar tu negocio. No somos un servicio de pagos ni procesamos transacciones entre vos y tus clientes.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-app-primary">3. Tus datos</h2>
          <p>Los datos que cargás (recetas, ingredientes, comandas) se guardan localmente en tu dispositivo usando IndexedDB. MiCuchina no accede ni almacena esa información en servidores propios.</p>
          <p>Para el login usamos Google OAuth. Solo guardamos tu ID de usuario de Google y el estado de tu plan (Free/Premium).</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-app-primary">4. Plan Premium</h2>
          <p>El plan Premium se cobra mediante MercadoPago. El precio actual es USD 5/mes. Podés cancelar en cualquier momento desde tu cuenta de MercadoPago. No hacemos reembolsos por períodos ya pagados.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-app-primary">5. Uso correcto</h2>
          <p>Usá la app solo para fines lícitos. No intentes vulnerar la seguridad, hacer ingeniería inversa ni usar la app para actividades ilegales.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-app-primary">6. Limitación de responsabilidad</h2>
          <p>MiCuchina se provee "tal cual". No garantizamos que sea perfecta o ininterrumpida. No somos responsables de pérdidas económicas basadas en los datos o sugerencias que muestre la app — las decisiones de precio y negocio son tuyas.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-app-primary">7. Cambios</h2>
          <p>Podemos actualizar estos términos en cualquier momento. Si los cambios son importantes, te avisaremos dentro de la app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-app-primary">8. Contacto</h2>
          <p>Para dudas o reclamos: soporte@micuchina.app</p>
        </section>

      </div>
    </div>
  )
}
