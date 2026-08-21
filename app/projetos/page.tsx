'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'

type Product3D = {
  id: string
  name: string
  category: string
  weight_g: number
  print_time_hours: number
  suggested_price: number
  profit_margin_pct: number
  stock_ready?: number
  production_queue?: number
  created_at?: string
}

const DEFAULT_CATEGORIES = [
  'Utilidades Domésticas',
  'Decoração & Design',
  'Geek & Pop Culture',
  'Cosplay & Props',
  'Peças Técnicas & Mecânicas',
  'Action Figures & Miniaturas',
  'Brinquedos & Jogos'
]

export default function Produtos3DPage() {
  const [products, setProducts] = useState<Product3D[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL')

  // Estados para o Modal de Edição
  const [editingProduct, setEditingProduct] = useState<Product3D | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editCategoryMode, setEditCategoryMode] = useState<'select' | 'custom'>('select')
  const [customEditCategory, setCustomEditCategory] = useState('')

  // Estados para o Modal de Novo Produto
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Utilidades Domésticas',
    weight_g: 0,
    print_time_hours: 0,
    profit_margin_pct: 100,
    suggested_price: 0,
    stock_ready: 0,
    production_queue: 0,
  })
  const [newCategoryMode, setNewCategoryMode] = useState<'select' | 'custom'>('select')
  const [customNewCategory, setCustomNewCategory] = useState('')
  const [creating, setCreating] = useState(false)

  function calculateSuggestedPrice(weight_g: number, print_time_hours: number, profit_margin_pct: number) {
    const costPerGram = 0.10
    const costPerHour = 3.00
    const materialCost = weight_g * costPerGram
    const timeCost = print_time_hours * costPerHour
    const totalCost = materialCost + timeCost
    const rawPrice = totalCost * (1 + profit_margin_pct / 100)
    return Math.round(rawPrice)
  }

  useEffect(() => {
    const price = calculateSuggestedPrice(
      Number(newProduct.weight_g),
      Number(newProduct.print_time_hours),
      Number(newProduct.profit_margin_pct)
    )
    setNewProduct(prev => ({ ...prev, suggested_price: price }))
  }, [newProduct.weight_g, newProduct.print_time_hours, newProduct.profit_margin_pct])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products_3d')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setProducts(data)
    } catch (error) {
      console.error('Erro ao buscar produtos 3D:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto do catálogo?')) return

    try {
      const { error } = await supabase.from('products_3d').delete().eq('id', id)
      if (error) throw error
      setProducts(products.filter((p) => p.id !== id))
    } catch (error: any) {
      alert(`Erro ao excluir: ${error.message || error}`)
    }
  }

  function handleOpenEdit(product: Product3D) {
    setEditingProduct({ ...product })
    if (DEFAULT_CATEGORIES.includes(product.category)) {
      setEditCategoryMode('select')
    } else {
      setEditCategoryMode('custom')
      setCustomEditCategory(product.category)
    }
    setIsModalOpen(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProduct) return

    const finalCategory = editCategoryMode === 'custom' ? customEditCategory : editingProduct.category

    try {
      setSaving(true)
      const { error } = await supabase
        .from('products_3d')
        .update({
          name: editingProduct.name,
          category: finalCategory || 'Geral',
          weight_g: editingProduct.weight_g,
          print_time_hours: editingProduct.print_time_hours,
          profit_margin_pct: editingProduct.profit_margin_pct,
          suggested_price: editingProduct.suggested_price,
          stock_ready: Number(editingProduct.stock_ready || 0),
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      const updatedObj = { ...editingProduct, category: finalCategory || 'Geral' }
      setProducts(products.map((p) => (p.id === editingProduct.id ? updatedObj : p)))
      setIsModalOpen(false)
      setEditingProduct(null)
    } catch (error: any) {
      alert(`Erro ao atualizar produto: ${error.message || error}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    const finalCategory = newCategoryMode === 'custom' ? customNewCategory : newProduct.category

    try {
      setCreating(true)
      const { data, error } = await supabase
        .from('products_3d')
        .insert([
          {
            name: newProduct.name,
            category: finalCategory || 'Geral',
            weight_g: Number(newProduct.weight_g),
            print_time_hours: Number(newProduct.print_time_hours),
            profit_margin_pct: Number(newProduct.profit_margin_pct),
            suggested_price: Number(newProduct.suggested_price),
            stock_ready: Number(newProduct.stock_ready),
            production_queue: 0,
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setProducts([...products, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
      }

      setIsNewModalOpen(false)
      setNewProduct({
        name: '',
        category: 'Utilidades Domésticas',
        weight_g: 0,
        print_time_hours: 0,
        profit_margin_pct: 100,
        suggested_price: 0,
        stock_ready: 0,
        production_queue: 0,
      })
      setNewCategoryMode('select')
      setCustomNewCategory('')
    } catch (error: any) {
      alert(`Erro ao criar produto: ${error.message || error}`)
    } finally {
      setCreating(false)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (prod.category && prod.category.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategoryFilter === 'ALL' || prod.category === selectedCategoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategoryFilter])

  const availableCategories = useMemo(() => {
    const set = new Set(products.map(p => p.category || 'Geral'))
    return Array.from(set)
  }, [products])

  const totalStockReady = products.reduce((acc, p) => acc + (p.stock_ready || 0), 0)
  const totalCatalogValue = products.reduce((acc, p) => acc + ((p.stock_ready || 0) * p.suggested_price), 0)

  return (
    <div className="space-y-8 w-full pb-16 max-w-[1600px] mx-auto">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
              Gestão de Catálogo & Estoque Pronto
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Produtos & Estoque 3D
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Cadastre novos modelos, gerencie custos, precificação automatizada e prateleira de pronta entrega.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Link 
            href="/producao" 
            className="flex-1 lg:flex-none px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition shadow-sm text-center flex items-center justify-center gap-2"
          >
            ⚙️ Ir para Linha de Produção
          </Link>

          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex-1 lg:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold transition shadow-lg shadow-orange-500/25 hover:opacity-95 cursor-pointer flex items-center justify-center gap-2"
          >
            ➕ Inserir Novo Produto
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor em Estoque Pronto</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalCatalogValue)}</p>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-2 inline-block">
              📦 {totalStockReady} unidades prontas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xl font-bold">
            💎
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modelos Cadastrados</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{products.length}</p>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md mt-2 inline-block">
              ⚡ Catálogo ativo
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 text-xl font-bold">
            📂
          </div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96 relative">
          <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text"
            placeholder="Buscar peça por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategoryFilter === 'ALL' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({products.length})
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategoryFilter === cat 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE PRODUTOS */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-400 text-sm font-bold animate-pulse">
            Carregando produtos do Supabase...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <span className="text-5xl block mb-3">🔍</span>
            <p className="text-slate-800 font-bold text-base">Nenhum produto encontrado.</p>
            <p className="text-slate-400 text-sm font-medium mt-1">Cadastre um novo produto para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase tracking-wider font-black text-xs">
                  <th className="p-6">Nome da Peça</th>
                  <th className="p-6">Categoria</th>
                  <th className="p-6">Especificações</th>
                  <th className="p-6">Estoque Pronto</th>
                  <th className="p-6">Preço Sugerido</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition group">
                    <td className="p-6 font-bold text-slate-900 text-base">{prod.name}</td>
                    <td className="p-6">
                      <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                        {prod.category || 'Geral'}
                      </span>
                    </td>
                    <td className="p-6 text-xs text-slate-500 font-semibold">
                      <div>⚖️ {prod.weight_g}g | ⏱️ {prod.print_time_hours}h/un</div>
                      <div className="text-slate-400 mt-0.5">Margem: {prod.profit_margin_pct}%</div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-xl font-bold text-xs border ${
                        (prod.stock_ready || 0) > 0 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        📦 {prod.stock_ready || 0} un.
                      </span>
                    </td>
                    <td className="p-6 font-black text-orange-600 text-base">
                      {formatCurrency(prod.suggested_price)}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          title="Editar Peça e Estoque"
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 transition shadow-sm cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          title="Excluir Produto"
                          className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition shadow-sm cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE NOVO PRODUTO */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Novo Produto 3D & Estoque</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nome da Peça</label>
                <input
                  type="text"
                  placeholder="Ex: Suporte Headset Minimalista"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Categoria</label>
                {newCategoryMode === 'select' ? (
                  <div className="flex gap-2">
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setNewCategoryMode('custom'); setCustomNewCategory(''); }}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap transition cursor-pointer"
                    >
                      + Outra
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite o nome da nova categoria..."
                      value={customNewCategory}
                      onChange={(e) => setCustomNewCategory(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setNewCategoryMode('select')}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap transition cursor-pointer"
                    >
                      Voltar Lista
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Peso (g)</label>
                  <input
                    type="number"
                    value={newProduct.weight_g || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, weight_g: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Tempo (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProduct.print_time_hours || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, print_time_hours: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Margem (%)</label>
                  <input
                    type="number"
                    value={newProduct.profit_margin_pct || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, profit_margin_pct: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Estoque Pronto Inicial</label>
                <input
                  type="number"
                  value={newProduct.stock_ready}
                  onChange={(e) => setNewProduct({ ...newProduct, stock_ready: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-800 uppercase tracking-wider block">Preço Sugerido (Automático)</span>
                  <span className="text-[11px] text-orange-700/80">Calculado por custos de filamento e tempo</span>
                </div>
                <span className="text-xl font-black text-orange-600">
                  {formatCurrency(newProduct.suggested_price)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {creating ? 'Salvando...' : 'Salvar no Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Editar Produto & Estoque</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nome da Peça</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Categoria</label>
                {editCategoryMode === 'select' ? (
                  <div className="flex gap-2">
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setEditCategoryMode('custom'); setCustomEditCategory(''); }}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap transition cursor-pointer"
                    >
                      + Outra
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite o nome da nova categoria..."
                      value={customEditCategory}
                      onChange={(e) => setCustomEditCategory(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setEditCategoryMode('select')}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap transition cursor-pointer"
                    >
                      Voltar Lista
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Preço Sugerido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.suggested_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, suggested_price: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Margem (%)</label>
                  <input
                    type="number"
                    value={editingProduct.profit_margin_pct}
                    onChange={(e) => setEditingProduct({ ...editingProduct, profit_margin_pct: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Peso (g)</label>
                  <input
                    type="number"
                    value={editingProduct.weight_g}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weight_g: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Tempo (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.print_time_hours}
                    onChange={(e) => setEditingProduct({ ...editingProduct, print_time_hours: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Estoque Pronto</label>
                <input
                  type="number"
                  value={editingProduct.stock_ready ?? 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock_ready: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}