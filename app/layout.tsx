'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  FileText,
  DollarSign,
  Calculator,
  Folder,
  Settings2,
  Cpu,
  Package,
  Truck,
  BarChart3,
  Calendar,
  TrendingUp,
  CreditCard,
  LayoutDashboard,
  Sun,
  Moon,
  User,
  Sparkles,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  const profileRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sincroniza o tema
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

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

  // Fecha o pop-up e dropdowns ao clicar fora deles
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
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

  // Grupos de navegação por setores com ícones modernos da Lucide
  const sectors = [
    {
      id: 'comercial',
      label: 'Comercial & Vendas',
      items: [
        { name: 'Clientes', href: '/clientes', desc: 'Gestão e cadastro de clientes', icon: Users },
        { name: 'Orçamentos', href: '/orcamentos', desc: 'Precificações e orçamentos', icon: FileText },
        { name: 'Vendas', href: '/vendas', desc: 'Acompanhamento de pedidos', icon: DollarSign },
        { name: 'Calculadora 3D', href: '/calculadora-3d', desc: 'Simulador de custos', icon: Calculator },
      ]
    },
    {
      id: 'producao',
      label: 'Produção & Engenharia',
      items: [
        { name: 'Produtos 3D', href: '/projetos', desc: 'Catálogo de modelos e arquivos', icon: Folder },
        { name: 'Fila de Produção', href: '/producao', desc: 'Fila ativa e estados de impressão', icon: Settings2 },
        { name: 'Máquinas', href: '/maquinas', desc: 'Parque de impressoras 3D', icon: Cpu },
      ]
    },
    {
      id: 'suprimentos',
      label: 'Suprimentos & Estoque',
      items: [
        { name: 'Estoque', href: '/estoque', desc: 'Monitoramento de filamentos', icon: Package },
        { name: 'Fornecedores', href: '/fornecedores', desc: 'Cadastro de parceiros de insumos', icon: Truck },
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      items: [
        { name: 'Fluxo de Caixa', href: '/financeiro', desc: 'Receitas, saídas e movimentações', icon: BarChart3 },
        { name: 'Contas a Pagar/Receber', href: '/financeiro?tab=provisoes', desc: 'Vencimentos e provisões', icon: Calendar },
        { name: 'DRE & Relatórios', href: '/financeiro?tab=dre', desc: 'Análise de lucros e margens', icon: TrendingUp },
        { name: 'Contas Bancárias', href: '/financeiro?tab=contas', desc: 'Configurações de meios de pagamento', icon: CreditCard },
      ]
    }
  ]

  return (
    <html lang="pt-BR" className={theme}>
      <body className="bg-[#F1F5F9] dark:bg-[#070c14] text-slate-950 dark:text-slate-100 antialiased transition-colors duration-300 min-h-screen flex flex-col">
        
        {isLoginPage ? (
          <main className="min-h-screen w-full">
            {children}
          </main>
        ) : (
          <>
            {/* HEADER SUPERIOR HORIZONTAL DE ALTA FIDELIDADE (GLASSMORPHISM) */}
            <header className="sticky top-0 z-50 w-full px-4 md:px-8 py-4 flex justify-center pointer-events-none">
              <div className="w-full h-16 bg-white/80 dark:bg-[#0b1426]/75 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-full flex items-center justify-between px-6 shadow-xl shadow-slate-900/5 dark:shadow-black/20 pointer-events-auto relative">
                
                {/* Logo / Home */}
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/15 group-hover:scale-105 transition-transform duration-300">
                    <span className="text-white font-black text-base tracking-tighter">3D</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">GESTÃO 3D</span>
                    <span className="text-[9px] text-cyan-500 dark:text-cyan-400 font-extrabold uppercase tracking-widest -mt-0.5">Enterprise OS</span>
                  </div>
                </Link>

                {/* Menu de Navegação Horizontal Desktop */}
                <nav className="hidden lg:flex items-center gap-1.5 bg-slate-200/40 dark:bg-black/20 p-1 rounded-full border border-slate-200/30 dark:border-white/5" ref={dropdownRef}>
                  <Link 
                    href="/" 
                    className={`px-4 py-2 text-sm font-extrabold rounded-full transition-all duration-300 flex items-center gap-2 ${
                      pathname === '/' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>

                  {sectors.map((sector) => {
                    const isAnyItemActive = sector.items.some(item => pathname === item.href.split('?')[0])
                    const isOpen = activeDropdown === sector.id

                    return (
                      <div key={sector.id} className="relative">
                        <button
                          onClick={() => setActiveDropdown(isOpen ? null : sector.id)}
                          onMouseEnter={() => setActiveDropdown(sector.id)}
                          className={`px-4 py-2 text-sm font-extrabold rounded-full transition-all duration-300 flex items-center gap-1.5 outline-none ${
                            isAnyItemActive 
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm' 
                              : isOpen
                                ? 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-900 dark:text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {sector.label}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Popover */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              onMouseLeave={() => setActiveDropdown(null)}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white/95 dark:bg-[#0c162b]/95 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl p-3 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 z-50"
                            >
                              <div className="grid gap-1">
                                <div className="px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-white/5">
                                  <span className="text-xs font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-widest">{sector.label}</span>
                                </div>
                                {sector.items.map((item) => {
                                  const isActive = pathname === item.href.split('?')[0]
                                  const IconComponent = item.icon
                                  return (
                                    <Link
                                      key={item.name}
                                      href={item.href}
                                      onClick={() => setActiveDropdown(null)}
                                      className={`flex items-start gap-3 p-2.5 rounded-2xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 group/item ${
                                        isActive 
                                          ? 'bg-slate-100/80 dark:bg-slate-800/40 text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-700/50' 
                                          : 'text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <div className="p-2 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200/30 dark:border-white/5 transition-transform group-hover/item:scale-105 duration-300 text-cyan-500 dark:text-cyan-400">
                                        <IconComponent className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-extrabold tracking-tight group-hover/item:text-cyan-500 dark:group-hover/item:text-cyan-400 transition-colors">{item.name}</span>
                                        <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold mt-0.5 leading-snug">{item.desc}</span>
                                      </div>
                                    </Link>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </nav>

                {/* Barra Direita: Tema, Perfil, Mobile Menu Toggle */}
                <div className="flex items-center gap-3">
                  
                  {/* Alternador de Tema Gélido */}
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-black/20 hover:bg-slate-200 dark:hover:bg-slate-800/60 border border-slate-200/30 dark:border-white/5 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                    title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-700 fill-slate-700/20" />
                    )}
                  </button>

                  {/* Menu do Perfil do Usuário */}
                  <div className="relative" ref={profileRef}>
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/30 dark:hover:border-white/5 transition-all outline-none"
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md transition-transform hover:scale-105 duration-300">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden md:block text-xs font-black text-slate-800 dark:text-slate-200 pr-2">{userName}</span>
                    </button>

                    {/* Popover Perfil */}
                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#0c162b] text-slate-900 dark:text-white border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-2xl p-2.5 z-50 text-xs font-bold"
                        >
                          <div className="px-3.5 py-3 border-b border-slate-100 dark:border-white/5 mb-1.5">
                            <p className="font-black text-slate-900 dark:text-white text-sm truncate">{userName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{userEmail}</p>
                          </div>

                          <div className="space-y-1">
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-300 text-xs font-extrabold text-left">
                              <User className="w-4 h-4 text-cyan-500" />
                              Minha Conta
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-300 text-xs font-extrabold text-left">
                              <Sparkles className="w-4 h-4 text-cyan-500" />
                              Novidades
                            </button>
                            <button 
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition text-rose-600 text-xs font-extrabold text-left"
                            >
                              <LogOut className="w-4 h-4 text-rose-500" />
                              Sair do Sistema
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mobile Menu Toggle */}
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-black/20 hover:bg-slate-200 dark:hover:bg-slate-800/60 border border-slate-200/30 dark:border-white/5 text-slate-700 dark:text-slate-300 lg:hidden cursor-pointer shadow-sm"
                    aria-label="Abrir Menu"
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>

                </div>

              </div>
            </header>

            {/* GAVETA / DRAWER MOBILE */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                  />
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 bottom-0 left-0 w-80 bg-white dark:bg-[#080e1a] z-50 lg:hidden shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-r border-slate-200/50 dark:border-white/10"
                  >
                    <div className="space-y-6">
                      {/* Logo Mobile */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
                            <span className="text-white font-black text-xs">3D</span>
                          </div>
                          <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">GESTÃO 3D</span>
                        </div>
                        <button 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-xs font-extrabold text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg"
                        >
                          FECHAR
                        </button>
                      </div>

                      {/* Links do Menu Mobile */}
                      <nav className="space-y-5">
                        <Link 
                          href="/" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-extrabold ${
                            pathname === '/' 
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard Geral
                        </Link>

                        {sectors.map((sector) => (
                          <div key={sector.id} className="space-y-2">
                            <span className="text-xs font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-widest block px-3">
                              {sector.label}
                            </span>
                            <div className="grid gap-1 pl-2 border-l border-slate-100 dark:border-white/5">
                              {sector.items.map((item) => {
                                const isActive = pathname === item.href.split('?')[0]
                                const IconComponent = item.icon
                                return (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                      isActive 
                                        ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white font-extrabold' 
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <IconComponent className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                                    <span>{item.name}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </nav>
                    </div>

                    {/* Rodapé Mobile */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-black text-xs">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">{userName}</span>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="text-xs font-extrabold text-rose-500 hover:underline flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair
                      </button>
                    </div>

                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="flex-1 w-full max-w-[100vw] px-4 md:px-8 py-4 relative z-10 overflow-hidden">
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  )
}