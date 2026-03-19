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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary-700 transition-opacity duration-400"
      style={{ opacity: fadeOut ? 0 : 1, pointerEvents: 'none' }}
    >
      {/* Círculos decorativos */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-primary-600/40 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-primary-800/40 translate-x-1/3 translate-y-1/3" />

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
        <p className="text-primary-200 text-base mt-6 animate-fade-in">Tu cocina, tu negocio 🍳</p>
      </div>
    </div>
  )
}
