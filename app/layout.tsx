'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'

  const [userEmail, setUserEmail] = useState<string>('Carregando...')
  const [userName, setUserName] = useState<string>('Usuário')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Busca as informações reais do usuário logado no Supabase
  useEffect(() => {
    if (!isLoginPage) {
      async function getUserInfo() {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
          setUserEmail(user.email)
          const namePart = user.email.split('@')[0]
          setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1))
        } else {
          setUserEmail('kduls1981@gmail.com')
          setUserName('Kduls1981')
        }
      }
      getUserInfo()
    }
  }, [isLoginPage])

  // Fecha o pop-up ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ) 
    },
    { 
      name: 'Vendas', 
      href: '/vendas', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ) 
    },
    { 
      name: 'Produção', 
      href: '/producao', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) 
    },
    { 
      name: 'Produtos 3D', 
      href: '/projetos', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ) 
    },
    { 
      name: 'Clientes', 
      href: '/clientes', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ) 
    },
    { 
      name: 'Fornecedores', 
      href: '/fornecedores', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ) 
    },
    { 
      name: 'Estoque', 
      href: '/estoque', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ) 
    },
    { 
      name: 'Máquinas', 
      href: '/maquinas', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ) 
    },
    { 
      name: 'Financeiro', 
      href: '/financeiro', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) 
    },
    { 
      name: 'Calculadora 3D', 
      href: '/calculadora-3d', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ) 
    },
  ]

  return (
    <html lang="pt-BR">
      <body className="bg-slate-50/50 text-slate-950 antialiased transition-colors duration-300">
        
        {isLoginPage ? (
          <main className="min-h-screen w-full bg-slate-50">
            {children}
          </main>
        ) : (
          <>
            {/* FUNDO GLOBAL DINÂMICO ENTERPRISE */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50 dark:bg-[#090d16]">
              {/* Orbes de luz decorativas modernas (SaaS Glow) */}
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-400/10 dark:bg-orange-500/5 blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-indigo-500/5 blur-[120px]" />
            </div>

            <div className="flex h-screen overflow-hidden relative z-10">
              
              {/* SIDEBAR RETRÁTIL */}
              <aside className="group peer w-20 hover:w-72 bg-white/90 backdrop-blur-2xl border-r border-slate-200 flex flex-col justify-between p-4 transition-all duration-300 shadow-2xl z-20 overflow-visible">
                <div>
                  {/* Logo / Marca */}
                  <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-slate-200 overflow-hidden whitespace-nowrap">
                    <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                      <span className="text-white font-black text-xl">3D</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h2 className="text-base font-black tracking-wider text-slate-900">GESTÃO 3D</h2>
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                        Enterprise OS
                      </span>
                    </div>
                  </div>

                  {/* Links do Menu */}
                  <nav className="space-y-2">
                    {menuItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center gap-3.5 px-3.5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
                            isActive
                              ? 'bg-slate-200 text-slate-900 shadow-[inset_0_2px_6px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.1)] border border-slate-300'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/30'
                          }`}
                        >
                          <span className={`shrink-0 transition-transform ${isActive ? 'scale-110 text-orange-500' : 'group-hover:scale-110'}`}>
                            {item.icon}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {item.name}
                          </span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                {/* Rodapé da Sidebar com Menu Popup do Supabase */}
                <div className="pt-4 border-t border-slate-200 relative" ref={profileRef}>
                  
                  {/* Botão do Perfil / Ícone */}
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-slate-200/60 transition-all text-left outline-none group/profile"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover/profile:scale-105 transition-transform">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-900 block truncate">{userName}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{userEmail}</span>
                    </div>
                  </button>

                  {/* POPUP LATERAL */}
                  {isProfileOpen && (
                    <div className="absolute bottom-4 left-24 w-72 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-50 text-sm font-bold animate-in fade-in zoom-in-95 duration-150">
                      
                      <div className="px-3 py-3 border-b border-slate-100 mb-1.5">
                        <p className="font-black text-slate-900 text-sm truncate">{userName}</p>
                        <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">{userEmail}</p>
                      </div>

                      <div className="space-y-1 py-1.5 border-b border-slate-100">
                        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-orange-500/10 transition text-slate-700 hover:text-orange-600 text-sm font-bold">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Minha Conta
                        </button>
                        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-orange-500/10 transition text-slate-700 hover:text-orange-600 text-sm font-bold">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Novidades
                        </button>
                        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-orange-500/10 transition text-slate-700 hover:text-orange-600 text-sm font-bold">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Atualizações
                        </button>
                      </div>

                      <div className="py-2.5 border-b border-slate-100 space-y-1">
                        <p className="px-3.5 text-xs uppercase font-black text-slate-400 tracking-wider mb-1.5">Tema</p>
                        <button className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition text-slate-800 text-sm font-bold">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          Sistema
                        </button>
                        <button className="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg hover:bg-slate-100 transition text-slate-600 hover:text-slate-900 text-sm font-semibold pl-7">
                          Escuro
                        </button>
                        <button className="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg hover:bg-slate-100 transition text-slate-600 hover:text-slate-900 text-sm font-semibold pl-7">
                          Claro
                        </button>
                        <button className="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg hover:bg-slate-100 transition text-slate-600 hover:text-slate-900 text-sm font-semibold pl-7">
                          Escuro Clássico
                        </button>
                      </div>

                      <div className="py-2.5 border-b border-slate-100">
                        <div className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-800">
                          <div>
                            <p className="text-xs text-slate-400 uppercase font-black">Fuso Horário</p>
                            <p className="text-xs text-slate-700 font-bold mt-0.5">Auto (America/Sao_Paulo)</p>
                          </div>
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-rose-500/10 transition text-rose-600 text-sm font-bold"
                        >
                          <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sair
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              </aside>

              {/* CONTEÚDO PRINCIPAL COM SCROLL */}
              <main className="flex-1 overflow-y-auto p-10 bg-transparent">
                {children}
              </main>

            </div>
          </>
        )}
      </body>
    </html>
  )
}