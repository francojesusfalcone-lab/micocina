import React from 'react'
import clsx from 'clsx'

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center px-8 py-16', className)}>
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-100 mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
      )}
      {action && action}
    </div>
  )
}
