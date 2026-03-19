import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2400)
    const t2 = setTimeout(() => onDone?.(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-400"
      style={{
        opacity: fadeOut ? 0 : 1,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 40% 35%, #2a2a2a 0%, #1a1a1a 30%, #0d0d0d 60%, #050505 100%)',
      }}
    >
      {/* Reflejos metálicos */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none"
           style={{background: 'radial-gradient(ellipse at 20% 15%, rgba(180,180,180,0.07) 0%, transparent 50%)'}} />
      <div className="absolute bottom-0 right-0 w-full h-full pointer-events-none"
           style={{background: 'radial-gradient(ellipse at 80% 85%, rgba(100,100,100,0.05) 0%, transparent 50%)'}} />

      <div className="relative flex flex-col items-center px-8">
        {/* Logo-full: ícono + nombre MiCuchina — ocupa el protagonismo */}
        {!imgError ? (
          <img
            src="/logo-full.png"
            alt="MiCuchina"
            className="w-80 max-w-full object-contain drop-shadow-2xl animate-scale-in"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-44 h-44 rounded-[2.5rem] bg-primary-600 border-4 border-gold-400/60 flex items-center justify-center shadow-2xl">
              <span className="text-8xl">🍳</span>
            </div>
            <h1 className="text-5xl font-display font-bold">
              <span className="text-white">Mi</span>
              <span className="text-gold-400">Cu</span>
              <span className="text-white">china</span>
            </h1>
          </div>
        )}
        <p className="text-base mt-6 animate-fade-in tracking-widest uppercase text-xs font-semibold" style={{color:'#f4b92a'}}>Tu cocina, tu negocio 🍳</p>
        <p className="text-xs mt-3 animate-fade-in font-semibold tracking-wide" style={{color:'#c97d0e'}}>Desarrollado por Franco Falcone</p>
      </div>
    </div>
  )
}
