'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type Supplier = {
  id: string
  name: string
  email?: string
  phone?: string
  document?: string
}

function FornecedoresContent() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [fetching, setFetching] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // States do Formulário
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [loading, setLoading] = useState(false)

  // State para Busca
  const [searchTerm, setSearchTerm] = useState('')

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

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    setSucessoMsg('')
    try {
      const { error } = await supabase.from('suppliers').insert([
        { 
          name, 
          email,
          phone,
          document
        }
      ])

      if (error) throw error

      setName('')
      setEmail('')
      setPhone('')
      setDocument('')
      setSucessoMsg('Fornecedor cadastrado com sucesso!')
      fetchSuppliers()
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      alert('Erro ao cadastrar fornecedor: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
      fetchSuppliers()
    } catch (error: any) {
      alert('Erro ao excluir fornecedor: ' + error.message)
    }
  }

  // Filtragem de Fornecedores por Busca
  const filteredSuppliers = suppliers.filter(sup => {
    return (
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sup.email && sup.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sup.document && sup.document.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  return (
    <div className="space-y-6 w-full pb-16 px-4 sm:px-6 lg:px-8">
      
      {/* HEADER EXECUTIVO REFINADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Enterprise OS • Suprimentos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Fornecedores
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Gerencie seus fornecedores de filamentos e insumos integrados à tabela <code className="text-orange-500 font-bold">suppliers</code> do Supabase.
          </p>
        </div>

        <div>
          <Link 
            href="/dashboard" 
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <span>✅</span> {sucessoMsg}
        </div>
      )}

      {/* FORMULÁRIO DE CADASTRO */}
      <form onSubmit={handleAddSupplier} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <span>🏭</span> Novo Fornecedor
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome do Fornecedor / Empresa</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: 3D Filament Brasil"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="contato@3dfilament.com.br"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Telefone / WhatsApp</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="(11) 99999-9999"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">CNPJ / CPF (Documento)</label>
            <input 
              type="text" 
              value={document} 
              onChange={(e) => setDocument(e.target.value)} 
              placeholder="00.000.000/0001-00"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Salvando...' : '💾 Adicionar Fornecedor'}
          </button>
        </div>
      </form>

      {/* TABELA DE LISTAGEM */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📋</span> Fornecedores Cadastrados
          </h2>
          <input 
            type="text"
            placeholder="Pesquisar fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 pl-6">Fornecedor</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Telefone</th>
                <th className="p-4">Documento</th>
                <th className="p-4 pr-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
              {fetching ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Carregando fornecedores...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhum fornecedor encontrado.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">{sup.name}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{sup.email || 'Não informado'}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{sup.phone || 'Não informado'}</td>
                    <td className="p-4 text-orange-600 dark:text-orange-400 font-semibold">{sup.document || 'Não informado'}</td>
                    <td className="p-4 pr-6 text-center">
                      <button 
                        onClick={() => handleDeleteSupplier(sup.id)}
                        title="Excluir Fornecedor"
                        className="text-slate-400 hover:text-rose-500 transition p-2 rounded-xl hover:bg-rose-500/10"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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