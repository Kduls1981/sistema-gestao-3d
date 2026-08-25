'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatCpfCnpj, formatPhone } from '@/lib/formatters'
import Link from 'next/link'
import { 
  Truck, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Building, 
  Mail, 
  Phone, 
  FileText,
  MapPin,
  Globe,
  UserCheck,
  Clock,
  CreditCard,
  Tag,
  FileSpreadsheet
} from 'lucide-react'

type Supplier = {
  id: string
  name: string
  trade_name?: string
  email?: string
  phone?: string
  document?: string
  state_registration?: string
  category?: string
  contact_person?: string
  website?: string
  cep?: string
  address?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  lead_time_days?: number
  payment_terms?: string
  notes?: string
}

function FornecedoresContent() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [fetching, setFetching] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')
  const [erroMsg, setErroMsg] = useState('')

  // Aba ativa do formulário ('geral', 'endereco', 'comercial')
  const [activeTab, setActiveTab] = useState<'geral' | 'endereco' | 'comercial'>('geral')

  // States do Formulário
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [stateRegistration, setStateRegistration] = useState('')
  const [category, setCategory] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [website, setWebsite] = useState('')
  
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  
  const [leadTimeDays, setLeadTimeDays] = useState<number | ''>('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSuppliers = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true })
      if (error) throw error
      if (data) setSuppliers(data)
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores:', error.message)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setTradeName('')
    setEmail('')
    setPhone('')
    setDocument('')
    setStateRegistration('')
    setCategory('')
    setContactPerson('')
    setWebsite('')
    setCep('')
    setAddress('')
    setNumber('')
    setNeighborhood('')
    setCity('')
    setState('')
    setLeadTimeDays('')
    setPaymentTerms('')
    setNotes('')
    setErroMsg('')
    setActiveTab('geral')
  }

  const handleEditClick = (sup: Supplier) => {
    setEditingId(sup.id)
    setName(sup.name || '')
    setTradeName(sup.trade_name || '')
    setEmail(sup.email || '')
    setPhone(sup.phone ? formatPhone(sup.phone) : '')
    setDocument(sup.document ? formatCpfCnpj(sup.document) : '')
    setStateRegistration(sup.state_registration || '')
    setCategory(sup.category || '')
    setContactPerson(sup.contact_person || '')
    setWebsite(sup.website || '')
    setCep(sup.cep || '')
    setAddress(sup.address || '')
    setNumber(sup.number || '')
    setNeighborhood(sup.neighborhood || '')
    setCity(sup.city || '')
    setState(sup.state || '')
    setLeadTimeDays(sup.lead_time_days ?? '')
    setPaymentTerms(sup.payment_terms || '')
    setNotes(sup.notes || '')
    setErroMsg('')
    setActiveTab('geral')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cleanCep = e.target.value.replace(/\D/g, '')

    if (cleanCep.length === 8) {
      try {
        setLoadingCep(true)
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()

        if (!data.erro) {
          setAddress(data.logradouro || '')
          setNeighborhood(data.bairro || '')
          setCity(data.localidade || '')
          setState(data.uf || '')
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setSucessoMsg('')
    setErroMsg('')

    const payload = {
      name,
      trade_name: tradeName,
      email,
      phone,
      document,
      state_registration: stateRegistration,
      category,
      contact_person: contactPerson,
      website,
      cep,
      address,
      number,
      neighborhood,
      city,
      state,
      lead_time_days: leadTimeDays === '' ? null : Number(leadTimeDays),
      payment_terms: paymentTerms,
      notes
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('suppliers').update(payload).eq('id', editingId)
        if (error) throw error
        setSucessoMsg('Fornecedor atualizado com sucesso!')
      } else {
        const { error } = await supabase.from('suppliers').insert([payload])
        if (error) throw error
        setSucessoMsg('Fornecedor cadastrado com sucesso!')
      }

      resetForm()
      fetchSuppliers()
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error)
      setErroMsg('Erro ao salvar fornecedor: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return

    try {
      setIsDeleting(true)
      setErroMsg('')
      const { error } = await supabase.from('suppliers').delete().eq('id', supplierToDelete.id)
      if (error) throw error

      setSucessoMsg('Fornecedor excluído com sucesso!')
      setSupplierToDelete(null)
      fetchSuppliers()
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      console.error('Erro ao excluir fornecedor:', error)
      setErroMsg('Erro ao excluir fornecedor: ' + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredSuppliers = suppliers.filter(sup => {
    const term = searchTerm.toLowerCase()
    return (
      sup.name?.toLowerCase().includes(term) ||
      sup.trade_name?.toLowerCase().includes(term) ||
      sup.email?.toLowerCase().includes(term) ||
      sup.document?.includes(term) ||
      sup.category?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16 px-4 sm:px-6 lg:px-8 relative">
      
      {/* HEADER EXECUTIVO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Enterprise OS • Suprimentos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Truck className="w-7 h-7 text-orange-500" />
            Gestão de Fornecedores
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Controle corporativo e homologação de parceiros integrados à tabela <code className="text-orange-500 font-bold">suppliers</code> do Supabase.
          </p>
        </div>

        <div>
          <Link 
            href="/dashboard" 
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-2 border border-slate-200/50 dark:border-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {sucessoMsg}
        </div>
      )}

      {erroMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {erroMsg}
        </div>
      )}

      {/* FORMULÁRIO DE CADASTRO / EDIÇÃO COM ABAS */}
      <form onSubmit={handleSaveSupplier} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-orange-500" />
            {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === 'geral' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Dados Gerais
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('endereco')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === 'endereco' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Endereço
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comercial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === 'comercial' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Comercial & Operação
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-4 text-xs font-bold text-slate-400 hover:text-orange-500 transition"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </div>

        {/* ABA 1: DADOS GERAIS */}
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Building className="w-3 h-3 text-orange-500" /> Razão Social / Nome Oficial *
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: 3D Filament Industria Ltda"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-orange-500" /> Nome Fantasia
              </label>
              <input 
                type="text" 
                value={tradeName} 
                onChange={(e) => setTradeName(e.target.value)} 
                placeholder="Ex: 3D Filament Brasil"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3 text-orange-500" /> CNPJ / CPF
              </label>
              <input 
                type="text" 
                value={document} 
                onChange={(e) => setDocument(formatCpfCnpj(e.target.value))} 
                placeholder="00.000.000/0001-00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3 text-orange-500" /> Inscrição Estadual (IE)
              </label>
              <input 
                type="text" 
                value={stateRegistration} 
                onChange={(e) => setStateRegistration(e.target.value)} 
                placeholder="Isento ou nº da inscrição"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-orange-500" /> Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              >
                <option value="">Selecione uma categoria...</option>
                <option value="Filamentos">Filamentos</option>
                <option value="Resinas 3D">Resinas 3D</option>
                <option value="Partes e Peças">Partes e Peças de Impressoras</option>
                <option value="Embalagens">Embalagens & Insumos</option>
                <option value="Manutenção">Serviços / Manutenção</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-orange-500" /> Contato / Vendedor
              </label>
              <input 
                type="text" 
                value={contactPerson} 
                onChange={(e) => setContactPerson(e.target.value)} 
                placeholder="Ex: Carlos Andrade (Vendas)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-orange-500" /> E-mail
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="contato@3dfilament.com.br"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-orange-500" /> Telefone / WhatsApp
              </label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(formatPhone(e.target.value))} 
                placeholder="(11) 99999-9999"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-orange-500" /> Website / Catálogo
              </label>
              <input 
                type="text" 
                value={website} 
                onChange={(e) => setWebsite(e.target.value)} 
                placeholder="https://..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>
          </div>
        )}

        {/* ABA 2: ENDEREÇO */}
        {activeTab === 'endereco' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-500" /> CEP
                </span>
                {loadingCep && <span className="text-orange-500 text-[9px] animate-pulse font-bold">Buscando...</span>}
              </label>
              <input 
                type="text" 
                value={cep} 
                maxLength={9}
                onBlur={handleCepBlur}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2')
                  setCep(value)
                }} 
                placeholder="00000-000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" /> Logradouro / Endereço
              </label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="Av. Paulista"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" /> Número / Comp.
              </label>
              <input 
                type="text" 
                value={number} 
                onChange={(e) => setNumber(e.target.value)} 
                placeholder="1000 - Sala 42"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" /> Bairro
              </label>
              <input 
                type="text" 
                value={neighborhood} 
                onChange={(e) => setNeighborhood(e.target.value)} 
                placeholder="Bela Vista"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" /> Cidade / UF
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  placeholder="São Paulo"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
                />
                <input 
                  type="text" 
                  value={state} 
                  onChange={(e) => setState(e.target.value)} 
                  placeholder="SP"
                  maxLength={2}
                  className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold text-center transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: COMERCIAL & OPERAÇÃO */}
        {activeTab === 'comercial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-500" /> Lead Time Padrão (Dias de Entrega)
              </label>
              <input 
                type="number" 
                value={leadTimeDays} 
                onChange={(e) => setLeadTimeDays(e.target.value === '' ? '' : Number(e.target.value))} 
                placeholder="Ex: 5"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-orange-500" /> Condições de Pagamento Padrão
              </label>
              <input 
                type="text" 
                value={paymentTerms} 
                onChange={(e) => setPaymentTerms(e.target.value)} 
                placeholder="Ex: Faturado 30 dias / Pix á vista"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3 text-orange-500" /> Observações Internas
              </label>
              <textarea 
                rows={3}
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Observações de qualidade, pedido mínimo, cupons ou restrições..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition resize-none"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-extrabold transition shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Adicionar Fornecedor'}
          </button>
        </div>
      </form>

      {/* TABELA DE LISTAGEM */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-orange-500" />
            Fornecedores Homologados
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text"
              placeholder="Pesquisar fornecedor ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 pl-6">Fornecedor / Categoria</th>
                <th className="p-4">Contato / Vendedor</th>
                <th className="p-4">E-mail / Fone</th>
                <th className="p-4">Documento</th>
                <th className="p-4">Lead Time</th>
                <th className="p-4 pr-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
              {fetching ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold animate-pulse">
                    Carregando fornecedores...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 pl-6">
                      <div className="font-extrabold text-slate-900 dark:text-white">{sup.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {sup.trade_name && <span className="text-[10px] text-slate-400">{sup.trade_name}</span>}
                        {sup.category && (
                          <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase">
                            {sup.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-bold">
                      {sup.contact_person || '-'}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      <div>{sup.email || '-'}</div>
                      <div className="text-[10px] text-slate-400">
                        {sup.phone ? formatPhone(sup.phone) : '-'}
                      </div>
                    </td>
                    <td className="p-4 text-orange-500 font-bold">
                      {sup.document ? formatCpfCnpj(sup.document) : '-'}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-bold">
                      {sup.lead_time_days ? `${sup.lead_time_days} dias` : '-'}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(sup)}
                          title="Editar fornecedor"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-orange-500/20 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSupplierToDelete(sup)}
                          title="Excluir fornecedor"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/20 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c162b] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 relative">
            
            <button
              onClick={() => setSupplierToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Excluir Fornecedor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tem certeza que deseja excluir o fornecedor <strong className="text-slate-800 dark:text-slate-200">{supplierToDelete.name}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold transition cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-extrabold transition shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default function FornecedoresPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center text-slate-400 text-xs font-bold animate-pulse">
        Carregando Fornecedores...
      </div>
    }>
      <FornecedoresContent />
    </Suspense>
  )
}