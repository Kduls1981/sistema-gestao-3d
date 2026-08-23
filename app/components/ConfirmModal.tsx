'use client'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-4 text-xl">
          ⚠️
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition min-w-[100px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md shadow-orange-500/20 min-w-[100px]"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
