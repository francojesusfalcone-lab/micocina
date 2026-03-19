import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

// Animación de fuego/cocina liviana embebida (lottie JSON minimalista)
// Fuente: lottiefiles.com/animations/cooking (free/public)
const LOTTIE_URL = 'https://assets10.lottiefiles.com/packages/lf20_qdas2lnb.json'

export default function SplashScreen({ onDone }) {
  const [animData, setAnimData] = useState(null)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    fetch(LOTTIE_URL)
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => setAnimData('error'))
  }, [])

  useEffect(() => {
    // Mostrar splash 2.2s luego fade out 400ms
    const t1 = setTimeout(() => setFadeOut(true), 2200)
    const t2 = setTimeout(() => onDone?.(), 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-400"
      style={{ opacity: fadeOut ? 0 : 1, pointerEvents: 'none' }}
    >
      <div className="w-48 h-48">
        {animData && animData !== 'error' ? (
          <Lottie animationData={animData} loop={true} autoplay={true} />
        ) : (
          // Fallback si no carga la animación
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl animate-bounce">🍳</span>
          </div>
        )}
      </div>
      <h1 className="text-3xl font-display font-bold text-gray-900 mt-2">MiCuchina</h1>
      <p className="text-sm text-gray-400 mt-1">Tu cocina, tu negocio</p>
    </div>
  )
}
