import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import clsx from 'clsx'

export default function EmptyState({ icon: Icon, title, description, action, className, lottieUrl }) {
  const [animData, setAnimData] = useState(null)

  useEffect(() => {
    if (!lottieUrl) return
    fetch(lottieUrl)
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => setAnimData(null))
  }, [lottieUrl])

  return (
    <div className={clsx('flex flex-col items-center justify-center text-center px-8 py-12', className)}>
      {lottieUrl && animData ? (
        <div className="w-40 h-40 mb-2">
          <Lottie animationData={animData} loop autoplay />
        </div>
      ) : Icon ? (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-100 mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
      )}
      {action && action}
    </div>
  )
}
