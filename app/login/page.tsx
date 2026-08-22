'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg('E-mail ou senha incorretos.')
        setLoading(false)
        return
      }

      if (data?.session) {
        // Grava o cookie de sessão para o middleware do Next.js conseguir ler
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
        if (projectRef) {
          document.cookie = `sb-${projectRef}-auth-token=${JSON.stringify(data.session)}; path=/; max-age=${data.session.expires_in}; SameSite=Lax`
        }

        // Redireciona diretamente para o Dashboard renovando o estado da página
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      console.error('Erro no login:', err)
      setErrorMsg('Ocorreu um erro ao conectar com o servidor.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        
        <div className="text-center mb-8">
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/20">
            Enterprise OS
          </span>
          <h1 className="text-3xl font-black text-white mt-3 tracking-wider">FINEXY</h1>
          <p className="text-slate-400 text-xs mt-1">Acesse sua conta para continuar.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 font-bold">
              E-mail corporativo
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.com"
              required
              className="w-full bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white rounded-2xl px-4 py-3.5 text-slate-700 dark:text-slate-200 dark:focus:text-slate-800 text-xs outline-none transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 font-bold">
              Senha secreta
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white rounded-2xl px-4 py-3.5 text-slate-700 dark:text-slate-200 dark:focus:text-slate-800 text-xs outline-none transition-all font-semibold"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition shadow-lg shadow-orange-500/20 disabled:opacity-50 text-xs"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
            Acesso restrito a usuários autorizados.
          </p>
        </div>

      </div>
    </div>
  )
}