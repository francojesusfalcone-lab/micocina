import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2200)
    const t2 = setTimeout(() => onDone?.(), 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary-700 transition-opacity duration-400"
      style={{ opacity: fadeOut ? 0 : 1, pointerEvents: 'none' }}
    >
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-primary-600/40 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-primary-800/40 translate-x-1/3 translate-y-1/3" />

      <div className="relative flex flex-col items-center">
        {/* Logo grande */}
        <div className="w-40 h-40 mb-6">
          {!imgError ? (
            <img
              src="/logo-icon.png"
              alt="MiCuchina"
              className="w-full h-full object-contain drop-shadow-2xl animate-scale-in"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-40 h-40 rounded-[2.5rem] bg-primary-600 border-4 border-gold-400/60 flex items-center justify-center animate-scale-in shadow-2xl">
              <span className="text-7xl">🍳</span>
            </div>
          )}
        </div>

        {/* Nombre */}
        <h1 className="text-4xl font-display font-bold animate-fade-in">
          <span className="text-white">Mi</span>
          <span className="text-gold-400">Cu</span>
          <span className="text-white">china</span>
        </h1>
        <p className="text-primary-200 text-sm mt-2 animate-fade-in">Tu cocina, tu negocio 🍳</p>
      </div>
    </div>
  )
}
