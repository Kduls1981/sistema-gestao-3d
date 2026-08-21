'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

type OrderHistory = {
  id: string
  customerName: string
  productName: string
  price: number
  date: string
  status: string
}

function ClientesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const action = searchParams.get('action')
  const tab = searchParams.get('tab')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // Mock de Histórico de Compras para visualização Enterprise OS refinada
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([
    { id: '1', customerName: 'João da Silva', productName: 'Vaso Espiral Gigante', price: 120.00, date: '10/08/2026', status: 'Entregue' },
    { id: '2', customerName: 'Maria Oliveira', productName: 'Suporte de Headset Geek', price: 45.90, date: '12/08/2026', status: 'Em produção' },
    { id: '3', customerName: 'João da Silva', productName: 'Action Figure Yoda 15cm', price: 180.00, date: '14/08/2026', status: 'Aprovado' },
    { id: '4', customerName: 'Carlos Souza', productName: 'Engrenagens Helicoidais Nylon', price: 350.00, date: '15/08/2026', status: 'Enviado' },
  ])

  const fetchCustomers = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true })
      if (error) throw error
      if (data) setCustomers(data)
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error.message)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    setSucessoMsg('')
    try {
      const { error } = await supabase.from('customers').insert([{ name, email, phone }])
      if (error) throw error

      setName('')
      setEmail('')
      setPhone('')
      setSucessoMsg('Cliente cadastrado com sucesso!')
      fetchCustomers()
      
      setTimeout(() => {
        setSucessoMsg('')
        router.push('/clientes') // Redireciona de volta para a lista
      }, 2000)
    } catch (error: any) {
      alert('Erro ao cadastrar cliente: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16 px-4 sm:px-6 lg:px-8">
      
      {/* HEADER EXECUTIVO REFINADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Enterprise OS • CRM & Clientes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {action === 'novo' ? 'Cadastrar Novo Cliente' : tab === 'historico' ? 'Histórico de Compras' : 'Lista de Clientes'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
            {action === 'novo' 
              ? 'Insira as informações do cliente para cadastrá-lo em tempo real no Supabase.' 
              : tab === 'historico' 
              ? 'Monitore os pedidos e faturamentos por cliente do seu ecossistema 3D.' 
              : 'Visualize, pesquise e gerencie sua base de clientes sincronizada com o Supabase.'}
          </p>
        </div>

        <div>
          <Link 
            href="/" 
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold transition flex items-center gap-1.5"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
          <span>✅</span> {sucessoMsg}
        </div>
      )}

      {/* ABA: CADASTRAR CLIENTE (?action=novo) */}
      {action === 'novo' && (
        <form onSubmit={handleAddCustomer} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span>👤</span> Novo Cadastro de Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Nome do Cliente</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: João da Silva"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">E-mail</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="exemplo@email.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Telefone / WhatsApp</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="(11) 99999-9999"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 gap-2">
            <Link 
              href="/clientes"
              className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Cadastrando...' : '💾 Salvar Cliente'}
            </button>
          </div>
        </form>
      )}

      {/* ABA: HISTÓRICO DE COMPRAS (?tab=historico) */}
      {tab === 'historico' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🛍️</span> Histórico Recente de Vendas / Compras
            </h2>
            <span className="text-sm font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Pedidos Ativos: {orderHistory.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 pl-6">Cliente</th>
                  <th className="p-4">Peça / Produto</th>
                  <th className="p-4">Data da Compra</th>
                  <th className="p-4">Valor Total</th>
                  <th className="p-4 pr-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                {orderHistory.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">{order.customerName}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{order.productName}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{order.date}</td>
                    <td className="p-4 font-black text-orange-600 dark:text-orange-400">{formatCurrency(order.price)}</td>
                    <td className="p-4 pr-6 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        order.status === 'Entregue' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        order.status === 'Em produção' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        order.status === 'Enviado' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: LISTA DE CLIENTES (PADRÃO) */}
      {!action && tab !== 'historico' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Base de Clientes Cadastrados
            </h2>
            <div className="flex items-center gap-3">
              <Link 
                href="/clientes?action=novo"
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition shadow-sm"
              >
                + Novo Cliente
              </Link>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Total: {customers.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 pl-6">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4 pr-6">Telefone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                {fetching ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400 font-bold">
                      Carregando clientes...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                      Nenhum cliente cadastrado ainda. Clique em &quot;+ Novo Cliente&quot; para iniciar!
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">{c.name}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{c.email || '-'}</td>
                      <td className="p-4 pr-6 font-bold text-slate-700 dark:text-slate-300">{c.phone || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

export default function ClientesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm font-bold animate-pulse">
        Carregando Módulo de Clientes...
      </div>
    }>
      <ClientesContent />
    </Suspense>
  )
}