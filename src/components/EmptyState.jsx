import clsx from 'clsx'

export default function EmptyState({ icon: Icon, title, description, action, className, image }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center px-8 py-12', className)}>
      {image ? (
        <img src={image} alt={title} className="w-80 h-80 object-contain mb-4" />
      ) : Icon ? (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{backgroundColor:'var(--bg-card)'}}>
          <Icon size={28} className="text-app-faint" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-app-secondary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-app-muted mb-6 leading-relaxed">{description}</p>
      )}
      {action && action}
    </div>
  )
}
