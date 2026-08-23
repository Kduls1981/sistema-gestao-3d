'use client'

interface AlertModalProps {
  isOpen: boolean
  title: string
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function AlertModal({ isOpen, title, message, type = 'info', onClose }: AlertModalProps) {
  if (!isOpen) return null

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
  const iconBg = type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : type === 'error' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBg} mb-4 text-xl`}>
          {icon}
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition shadow-sm"
        >
          Ok
        </button>
      </div>
    </div>
  )
}
