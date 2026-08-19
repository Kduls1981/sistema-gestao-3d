'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // Se já estiver logado, vai direto para o Dashboard
          router.replace('/dashboard')
        } else {
          // Se não estiver logado, vai para a tela de login
          router.replace('/login')
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
        router.replace('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white">
      <div className="text-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
        <p className="text-xs font-bold tracking-wider uppercase text-slate-400">Carregando Sistema...</p>
      </div>
    </div>
  )
}