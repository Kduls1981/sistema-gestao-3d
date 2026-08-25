'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { formatCurrency, formatDate, formatTitleCase } from '@/lib/formatters'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  person_type?: string
  document?: string
  rg_ie?: string
  cep?: string
  address?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  notes?: string
  created_at?: string
}

type OrderHistory = {
  id: string
  customerName: string
  productName: string
  price: number
  date: string
  status: string
}

// Funções de Máscara Internas
const maskDocument = (value: string) => {
  const clean = value.replace(/\D/g, '')
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14)
  }
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

const maskRG = (value: string) => {
  const clean = value.replace(/[^0-9xX]/g, '').toUpperCase()
  return clean
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})([\dX])$/, '$1-$2')
    .slice(0, 12)
}

const maskPhone = (value: string) => {
  const clean = value.replace(/\D/g, '')
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14)
  }
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
}

function ClientesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const action = searchParams.get('action')
  const tab = searchParams.get('tab')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [loadingCep, setLoadingCep] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Abas do Form
  const [formTab, setFormTab] = useState<'geral' | 'endereco' | 'adicional'>('geral')

  // Notificações
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form State
  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PF')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [rgIe, setRgIe] = useState('')
  
  // Endereço State
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [notes, setNotes] = useState('')

  // Mock de Histórico de Compras com datas no formato BR
  const [orderHistory] = useState<OrderHistory[]>([
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

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      setLoadingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setAddress(data.logradouro ? formatTitleCase(data.logradouro) : '')
          setNeighborhood(data.bairro ? formatTitleCase(data.bairro) : '')
          setCity(data.localidade ? formatTitleCase(data.localidade) : '')
          setState(data.uf ? data.uf.toUpperCase() : '')
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setDocument('')
    setRgIe('')
    setCep('')
    setAddress('')
    setNumber('')
    setComplement('')
    setNeighborhood('')
    setCity('')
    setState('')
    setNotes('')
    setPersonType('PF')
    setFormTab('geral')
    setEditingId(null)
  }

  const handleEditInit = (customer: Customer) => {
    setEditingId(customer.id)
    setName(customer.name || '')
    setEmail(customer.email || '')
    setPhone(customer.phone || '')
    setPersonType((customer.person_type as 'PF' | 'PJ') || 'PF')
    setDocument(customer.document || '')
    setRgIe(customer.rg_ie || '')
    setCep(customer.cep || '')
    setAddress(customer.address || '')
    setNumber(customer.number || '')
    setComplement(customer.complement || '')
    setNeighborhood(customer.neighborhood || '')
    setCity(customer.city || '')
    setState(customer.state || '')
    setNotes(customer.notes || '')
    router.push('/clientes?action=novo')
  }

  const handleDeleteCustomer = async (id: string, customerName: string) => {
    if (!confirm(`Deseja realmente remover o cliente "${customerName}"?`)) return

    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error

      setFeedback({ message: 'Cliente removido com sucesso!', type: 'success' })
      fetchCustomers()
      setTimeout(() => setFeedback(null), 3000)
    } catch (error: any) {
      setFeedback({ message: `Erro ao remover cliente: ${error.message}`, type: 'error' })
    }
  }

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    setFeedback(null)
    try {
      // Aplica a padronização Title Case nos campos de texto
      const payload = {
        name: formatTitleCase(name),
        email: email.trim().toLowerCase(),
        phone,
        person_type: personType,
        document,
        rg_ie: rgIe,
        cep,
        address: formatTitleCase(address),
        number: number.trim(),
        complement: formatTitleCase(complement),
        neighborhood: formatTitleCase(neighborhood),
        city: formatTitleCase(city),
        state: state.trim().toUpperCase(),
        notes
      }

      if (editingId) {
        const { error } = await supabase.from('customers').update(payload).eq('id', editingId)
        if (error) throw error
        setFeedback({ message: 'Cliente atualizado com sucesso!', type: 'success' })
      } else {
        const { error } = await supabase.from('customers').insert([payload])
        if (error) throw error
        setFeedback({ message: 'Cliente cadastrado com sucesso!', type: 'success' })
      }

      resetForm()
      fetchCustomers()
      
      setTimeout(() => {
        setFeedback(null)
        router.push('/clientes')
      }, 1500)
    } catch (error: any) {
      setFeedback({ message: `Erro ao salvar cliente: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.document && c.document.includes(searchTerm))
  )

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
            {action === 'novo' ? (editingId ? 'Editar Cliente' : 'Cadastrar Novo Cliente') : tab === 'historico' ? 'Histórico de Compras' : 'Gestão de Clientes'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
            {action === 'novo' 
              ? 'Controle corporativo e cadastro homologado de clientes integrados à tabela customers do Supabase.' 
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

      {/* NOTIFICAÇÃO / MODAL DE FEEDBACK */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 animate-in fade-in duration-200 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
          {feedback.message}
        </div>
      )}

      {/* ABA: CADASTRAR / EDITAR CLIENTE (?action=novo) */}
      {action === 'novo' && (
        <form onSubmit={handleSaveCustomer} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>👤</span> {editingId ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}
            </h2>

            {/* SELETOR DE ABAS DO FORMULÁRIO */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFormTab('geral')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                  formTab === 'geral'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Dados Gerais
              </button>
              <button
                type="button"
                onClick={() => setFormTab('endereco')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                  formTab === 'endereco'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Endereço
              </button>
              <button
                type="button"
                onClick={() => setFormTab('adicional')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                  formTab === 'adicional'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Observações
              </button>
            </div>
          </div>

          {/* ABA 1: DADOS GERAIS */}
          {formTab === 'geral' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Pessoa</label>
                  <select
                    value={personType}
                    onChange={(e) => {
                      setPersonType(e.target.value as 'PF' | 'PJ')
                      setRgIe('')
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  >
                    <option value="PF">Pessoa Física (PF)</option>
                    <option value="PJ">Pessoa Jurídica (PJ)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    {personType === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    onBlur={() => setName(formatTitleCase(name))}
                    placeholder={personType === 'PF' ? "Ex: João da Silva" : "Ex: Tech 3D Soluções LTDA"}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    {personType === 'PF' ? 'CPF' : 'CNPJ'}
                  </label>
                  <input 
                    type="text" 
                    value={document} 
                    onChange={(e) => setDocument(maskDocument(e.target.value))} 
                    placeholder={personType === 'PF' ? "000.000.000-00" : "00.000.000/0001-00"}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    {personType === 'PF' ? 'RG' : 'Inscrição Estadual'}
                  </label>
                  <input 
                    type="text" 
                    value={rgIe} 
                    onChange={(e) => {
                      const val = e.target.value
                      setRgIe(personType === 'PF' ? maskRG(val) : val)
                    }} 
                    placeholder={personType === 'PF' ? "00.000.000-0" : "Isento ou Nº Doc"}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(maskPhone(e.target.value))} 
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">E-mail Principal</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="exemplo@empresa.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                />
              </div>
            </div>
          )}

          {/* ABA 2: ENDEREÇO */}
          {formTab === 'endereco' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    CEP
                    {loadingCep && <span className="text-[10px] text-orange-500 animate-pulse">Buscando...</span>}
                  </label>
                  <input 
                    type="text" 
                    value={cep} 
                    onChange={(e) => setCep(maskCEP(e.target.value))} 
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Endereço (Rua/Av.)</label>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    onBlur={() => setAddress(formatTitleCase(address))}
                    placeholder="Ex: Av. Paulista"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Número</label>
                  <input 
                    type="text" 
                    value={number} 
                    onChange={(e) => setNumber(e.target.value)} 
                    placeholder="Ex: 1000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Complemento</label>
                  <input 
                    type="text" 
                    value={complement} 
                    onChange={(e) => setComplement(e.target.value)} 
                    onBlur={() => setComplement(formatTitleCase(complement))}
                    placeholder="Ex: Sala 42 / Bloco B"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Bairro</label>
                  <input 
                    type="text" 
                    value={neighborhood} 
                    onChange={(e) => setNeighborhood(e.target.value)} 
                    onBlur={() => setNeighborhood(formatTitleCase(neighborhood))}
                    placeholder="Ex: Bela Vista"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                </div>
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Cidade</label>
                      <input 
                        type="text" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        onBlur={() => setCity(formatTitleCase(city))}
                        placeholder="Ex: São Paulo"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">UF</label>
                      <input 
                        type="text" 
                        value={state} 
                        onChange={(e) => setState(e.target.value.toUpperCase())} 
                        maxLength={2}
                        placeholder="SP"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold uppercase text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: OBSERVAÇÕES */}
          {formTab === 'adicional' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Observações Internas / Histórico</label>
                <textarea 
                  rows={4}
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Instruções de entrega, detalhes técnicos solicitados pelo cliente, particularidades de faturamento..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-medium resize-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                resetForm()
                router.push('/clientes')
              }}
              className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Salvando...' : editingId ? '💾 Atualizar Cliente' : '💾 Salvar Cliente'}
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
                    <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">{formatTitleCase(order.customerName)}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{order.productName}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{formatDate(order.date)}</td>
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
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Base de Clientes Cadastrados
            </h2>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* CAMPO DE BUSCA */}
              <div className="relative flex-1 sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar cliente..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <Link 
                href="/clientes?action=novo"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition shadow-sm whitespace-nowrap"
              >
                + Novo Cliente
              </Link>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Total: {filteredCustomers.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 pl-6">Nome / Razão Social</th>
                  <th className="p-4">CPF / CNPJ</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                {fetching ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                      Carregando clientes...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                      {searchTerm ? 'Nenhum cliente encontrado com esses termos.' : 'Nenhum cliente cadastrado ainda. Clique em "+ Novo Cliente" para iniciar!'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">{c.person_type || 'PF'}</span>
                        {formatTitleCase(c.name)}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs font-bold">{c.document || '-'}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">{c.email || '-'}</td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-bold">{c.phone || '-'}</td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditInit(c)}
                            title="Editar cliente"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            title="Excluir cliente"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-600 text-slate-600 dark:text-slate-300 transition"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
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