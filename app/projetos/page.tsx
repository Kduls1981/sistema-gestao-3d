'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import ConfirmModal from '@/app/components/ConfirmModal'
import AlertModal from '@/app/components/AlertModal'
import { formatCurrency } from '@/lib/formatters'

type ProductInputItem = {
  input_id: string
  weight_g: number
}

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
  machine_id?: string | null
  input_id?: string | null
  inputs_list?: ProductInputItem[]
  filament_type?: string | null
  handling_time_min?: number
  packaging_cost?: number
  extra_costs?: number
  marketplace_fee_pct?: number
}

type InputItem = {
  id: string
  name: string
  type: string
  brand: string
  price_per_kg: number
  cost_per_gram?: number
}

type MachineItem = {
  id: string
  name: string
  cost_per_hour?: number
  depreciation_per_hour?: number
  power_consumption_kwh?: number
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

export function calculateDynamicCosts(
  prod: Partial<Product3D>,
  inputsList: InputItem[],
  machinesList: MachineItem[]
) {
  let materialCost = 0

  if (prod.inputs_list && prod.inputs_list.length > 0) {
    prod.inputs_list.forEach((item) => {
      let costPerGram = 0.10
      const inputObj = inputsList.find((i) => i.id === item.input_id)
      if (inputObj && inputObj.price_per_kg) {
        costPerGram = inputObj.price_per_kg / 1000
      }
      materialCost += (Number(item.weight_g) || 0) * costPerGram
    })
  } else {
    let costPerGram = 0.10
    if (prod.input_id) {
      const inputObj = inputsList.find((i) => i.id === prod.input_id)
      if (inputObj && inputObj.price_per_kg) {
        costPerGram = inputObj.price_per_kg / 1000
      }
    }
    materialCost = (prod.weight_g || 0) * costPerGram
  }

  // Perda de 5% aplicada exclusivamente à matéria-prima
  const rawMaterialWithLoss = materialCost * 1.05

  let costPerHour = 3.00
  if (prod.machine_id) {
    const machineObj = machinesList.find((m) => m.id === prod.machine_id)
    if (machineObj) {
      const dep = machineObj.depreciation_per_hour || 0
      const power = machineObj.power_consumption_kwh || 0
      const energyCost = power * 0.85
      costPerHour = machineObj.cost_per_hour ?? (dep + energyCost)
    }
  }
  const energyMachineCost = (prod.print_time_hours || 0) * costPerHour

  const costPerMinHandling = 0.25
  const handlingCost = (prod.handling_time_min || 0) * costPerMinHandling
  const packagingCost = Number(prod.packaging_cost || 0)
  const extraCosts = Number(prod.extra_costs || 0)

  // Custo total acumulado com 5% de perda incidindo apenas no filamento
  const totalProductionCost = rawMaterialWithLoss + energyMachineCost + handlingCost + packagingCost + extraCosts

  return {
    materialCost,
    rawMaterialWithLoss,
    energyMachineCost,
    handlingCost,
    packagingCost,
    extraCosts,
    totalProductionCost,
  }
}

export function calculateSuggestedPrice(
  productionCost: number,
  profitMarginPct: number,
  marketplaceFeePct: number = 0
) {
  const basePrice = productionCost * (1 + (profitMarginPct || 0) / 100)
  const finalPrice = basePrice * (1 + (marketplaceFeePct || 0) / 100)
  
  // Arredonda para o próximo múltiplo de 0,50 sempre para cima (ex: 37.12 -> 37.50 / 37.55 -> 38.00)
  return Math.ceil(finalPrice * 2) / 2
}

export default function Produtos3DPage() {
  const [products, setProducts] = useState<Product3D[]>([])
  const [inputs, setInputs] = useState<InputItem[]>([])
  const [machines, setMachines] = useState<MachineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL')

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })
  
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  })

  const [editingProduct, setEditingProduct] = useState<Product3D | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editCategoryMode, setEditCategoryMode] = useState<'select' | 'custom'>('select')
  const [customEditCategory, setCustomEditCategory] = useState('')

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product3D>>({
    name: '',
    category: 'Utilidades Domésticas',
    weight_g: 0,
    print_time_hours: 0,
    profit_margin_pct: 100,
    suggested_price: 0,
    stock_ready: 0,
    production_queue: 0,
    machine_id: '',
    input_id: '',
    inputs_list: [],
    handling_time_min: 0,
    packaging_cost: 0,
    extra_costs: 0,
  })
  const [newCategoryMode, setNewCategoryMode] = useState<'select' | 'custom'>('select')
  const [customNewCategory, setCustomNewCategory] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const costInfo = calculateDynamicCosts(newProduct, inputs, machines)
    const price = calculateSuggestedPrice(
      costInfo.totalProductionCost,
      Number(newProduct.profit_margin_pct || 100)
    )
    setNewProduct(prev => ({ ...prev, suggested_price: price }))
  }, [
    newProduct.weight_g,
    newProduct.print_time_hours,
    newProduct.profit_margin_pct,
    newProduct.machine_id,
    newProduct.input_id,
    JSON.stringify(newProduct.inputs_list),
    newProduct.handling_time_min,
    newProduct.packaging_cost,
    newProduct.extra_costs,
    inputs,
    machines
  ])

  useEffect(() => {
    fetchInitialData()

    // Inscreve no Realtime do Supabase para atualizar a lista ao mudar estoque/produtos
    const channel = supabase
      .channel('realtime-products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products_3d',
        },
        () => {
          fetchInitialData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchInitialData() {
    try {
      setLoading(true)

      const { data: prodData, error: prodError } = await supabase
        .from('products_3d')
        .select('*')
        .order('name', { ascending: true })
      if (prodError) throw prodError
      if (prodData) setProducts(prodData)

      const { data: inputsData } = await supabase.from('inputs').select('*')
      if (inputsData) setInputs(inputsData)

      const { data: machinesData } = await supabase.from('machines').select('*')
      if (machinesData) setMachines(machinesData)

    } catch (error) {
      console.error('Erro ao buscar dados do sistema:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto do catálogo?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('products_3d').delete().eq('id', id)
          if (error) throw error
          setProducts(products.filter((p) => p.id !== id))
        } catch (error: any) {
          setAlertModal({
            isOpen: true,
            title: 'Erro ao Excluir',
            message: `Erro ao excluir: ${error.message || error}`,
            type: 'error'
          })
        }
      }
    })
  }

  function handleOpenEdit(product: Product3D) {
    setEditingProduct({
      ...product,
      inputs_list: product.inputs_list || []
    })
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
          machine_id: editingProduct.machine_id || null,
          input_id: editingProduct.input_id || null,
          inputs_list: editingProduct.inputs_list || [],
          handling_time_min: Number(editingProduct.handling_time_min || 0),
          packaging_cost: Number(editingProduct.packaging_cost || 0),
          extra_costs: Number(editingProduct.extra_costs || 0),
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      const updatedObj = { ...editingProduct, category: finalCategory || 'Geral' }
      setProducts(products.map((p) => (p.id === editingProduct.id ? updatedObj : p)))
      setIsModalOpen(false)
      setEditingProduct(null)
    } catch (error: any) {
      setAlertModal({
        isOpen: true,
        title: 'Erro ao Atualizar',
        message: `Erro ao atualizar produto: ${error.message || error}`,
        type: 'error'
      })
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
            weight_g: Number(newProduct.weight_g || 0),
            print_time_hours: Number(newProduct.print_time_hours || 0),
            profit_margin_pct: Number(newProduct.profit_margin_pct || 100),
            suggested_price: Number(newProduct.suggested_price || 0),
            stock_ready: Number(newProduct.stock_ready || 0),
            production_queue: 0,
            machine_id: newProduct.machine_id || null,
            input_id: newProduct.input_id || null,
            inputs_list: newProduct.inputs_list || [],
            handling_time_min: Number(newProduct.handling_time_min || 0),
            packaging_cost: Number(newProduct.packaging_cost || 0),
            extra_costs: Number(newProduct.extra_costs || 0),
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
        machine_id: '',
        input_id: '',
        inputs_list: [],
        handling_time_min: 0,
        packaging_cost: 0,
        extra_costs: 0,
      })
      setNewCategoryMode('select')
      setCustomNewCategory('')
    } catch (error: any) {
      setAlertModal({
        isOpen: true,
        title: 'Erro ao Criar',
        message: `Erro ao criar produto: ${error.message || error}`,
        type: 'error'
      })
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
              Gestão de Catálogo & Estoque Pronto
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Produtos & Estoque 3D
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
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
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Valor em Estoque Pronto</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(totalCatalogValue)}</p>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md mt-2 inline-block">
              📦 {totalStockReady} unidades prontas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold">
            💎
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Modelos Cadastrados</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{products.length}</p>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-md mt-2 inline-block">
              ⚡ Catálogo ativo
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 text-xl font-bold">
            📂
          </div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        <div className="w-full md:w-96 relative">
          <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text"
            placeholder="Buscar peça por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategoryFilter === 'ALL' 
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE PRODUTOS */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-bold animate-pulse">
            Carregando produtos do Supabase...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <span className="text-5xl block mb-3">🔍</span>
            <p className="text-slate-800 dark:text-slate-200 font-bold text-base">Nenhum produto encontrado.</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-1">Cadastre um novo produto para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-black text-xs">
                  <th className="p-6">Nome da Peça</th>
                  <th className="p-6">Categoria</th>
                  <th className="p-6">Especificações</th>
                  <th className="p-6">Custo de Produção</th>
                  <th className="p-6">Estoque Pronto</th>
                  <th className="p-6">Preço Sugerido</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {filteredProducts.map((prod) => {
                  const prodCost = calculateDynamicCosts(prod, inputs, machines).totalProductionCost
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition group">
                      <td className="p-6 font-bold text-slate-900 dark:text-white text-base">{prod.name}</td>
                      <td className="p-6">
                        <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          {prod.category || 'Geral'}
                        </span>
                      </td>
                      <td className="p-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        <div>⚖️ {prod.weight_g}g | ⏱️ {prod.print_time_hours}h/un</div>
                        <div className="text-slate-400 dark:text-slate-500 mt-0.5">Margem: {prod.profit_margin_pct}%</div>
                      </td>

                      <td className="p-6">
                        <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                          {formatCurrency(prodCost)}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-normal">
                          (c/ 5% perda)
                        </span>
                      </td>

                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-xl font-bold text-xs border ${
                          (prod.stock_ready || 0) > 0 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                        }`}>
                          📦 {prod.stock_ready || 0} un.
                        </span>
                      </td>
                      <td className="p-6 font-black text-orange-600 dark:text-orange-400 text-base">
                        {formatCurrency(prod.suggested_price)}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            title="Editar Peça e Estoque"
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 text-slate-600 dark:text-slate-300 transition shadow-sm cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            title="Excluir Produto"
                            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition shadow-sm cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE NOVO PRODUTO */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Novo Produto 3D & Calculadora</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Nome da Peça</label>
                <input
                  type="text"
                  placeholder="Ex: Suporte Headset Minimalista"
                  value={newProduct.name || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Categoria</label>
                {newCategoryMode === 'select' ? (
                  <div className="flex gap-2">
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setNewCategoryMode('custom'); setCustomNewCategory(''); }}
                      className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold whitespace-nowrap transition cursor-pointer"
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
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setNewCategoryMode('select')}
                      className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold whitespace-nowrap transition cursor-pointer"
                    >
                      Voltar Lista
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Impressora / Máquina</label>
                <select
                  value={newProduct.machine_id || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, machine_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">Padrão (R$ 3,00/h)</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 border-t border-b border-slate-200 dark:border-slate-800 py-4 my-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Filamento(s) / Multi-Cores
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentList = newProduct.inputs_list || []
                      setNewProduct({
                        ...newProduct,
                        inputs_list: [...currentList, { input_id: '', weight_g: 0 }]
                      })
                    }}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-500 flex items-center gap-1 cursor-pointer"
                  >
                    ➕ Adicionar Cor / Filamento
                  </button>
                </div>

                {newProduct.inputs_list && newProduct.inputs_list.length > 0 ? (
                  newProduct.inputs_list.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.input_id}
                        onChange={(e) => {
                          const updated = [...(newProduct.inputs_list || [])]
                          updated[index].input_id = e.target.value
                          setNewProduct({ ...newProduct, inputs_list: updated })
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Selecione a cor/filamento...</option>
                        {inputs.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.brand}) - R$ {i.price_per_kg}/kg
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Peso (g)"
                        value={item.weight_g || ''}
                        onChange={(e) => {
                          const updated = [...(newProduct.inputs_list || [])]
                          updated[index].weight_g = Number(e.target.value)
                          const totalWeight = updated.reduce((acc, curr) => acc + (Number(curr.weight_g) || 0), 0)
                          setNewProduct({ ...newProduct, inputs_list: updated, weight_g: totalWeight })
                        }}
                        className="w-28 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newProduct.inputs_list?.filter((_, i) => i !== index)
                          const totalWeight = updated?.reduce((acc, curr) => acc + (Number(curr.weight_g) || 0), 0) || 0
                          setNewProduct({ ...newProduct, inputs_list: updated, weight_g: totalWeight })
                        }}
                        className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                        title="Remover cor"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <select
                    value={newProduct.input_id || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, input_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">Padrão (R$ 100/kg - R$ 0,10/g)</option>
                    {inputs.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.brand}) - R$ {i.price_per_kg}/kg</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Peso Total (g)</label>
                  <input
                    type="number"
                    value={newProduct.weight_g || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, weight_g: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Tempo (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProduct.print_time_hours || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, print_time_hours: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Margem (%)</label>
                  <input
                    type="number"
                    value={newProduct.profit_margin_pct || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, profit_margin_pct: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Acabamento (min)</label>
                  <input
                    type="number"
                    value={newProduct.handling_time_min || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, handling_time_min: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Embalagem (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProduct.packaging_cost || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, packaging_cost: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Extras (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProduct.extra_costs || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, extra_costs: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Estoque Pronto Inicial</label>
                <input
                  type="number"
                  value={newProduct.stock_ready || 0}
                  onChange={(e) => setNewProduct({ ...newProduct, stock_ready: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 flex items-center justify-between shadow-md border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Custo de Produção Calculado</span>
                  <span className="text-[11px] text-slate-400">
                    {formatCurrency(calculateDynamicCosts(newProduct, inputs, machines).totalProductionCost)} (inclui 5% perda)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">Preço Sugerido</span>
                  <span className="text-xl font-black text-orange-400">
                    {formatCurrency(newProduct.suggested_price || 0)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Editar Produto & Calculadora</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Nome da Peça</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Categoria</label>
                {editCategoryMode === 'select' ? (
                  <div className="flex gap-2">
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setEditCategoryMode('custom'); setCustomEditCategory(''); }}
                      className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold whitespace-nowrap transition cursor-pointer"
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
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setEditCategoryMode('select')}
                      className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold whitespace-nowrap transition cursor-pointer"
                    >
                      Voltar Lista
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Impressora / Máquina</label>
                <select
                  value={editingProduct.machine_id || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, machine_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">Padrão (R$ 3,00/h)</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 border-t border-b border-slate-200 dark:border-slate-800 py-4 my-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Filamento(s) / Multi-Cores
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentList = editingProduct.inputs_list || []
                      setEditingProduct({
                        ...editingProduct,
                        inputs_list: [...currentList, { input_id: '', weight_g: 0 }]
                      })
                    }}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-500 flex items-center gap-1 cursor-pointer"
                  >
                    ➕ Adicionar Cor / Filamento
                  </button>
                </div>

                {editingProduct.inputs_list && editingProduct.inputs_list.length > 0 ? (
                  editingProduct.inputs_list.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.input_id}
                        onChange={(e) => {
                          const updated = [...(editingProduct.inputs_list || [])]
                          updated[index].input_id = e.target.value
                          setEditingProduct({ ...editingProduct, inputs_list: updated })
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Selecione a cor/filamento...</option>
                        {inputs.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.brand}) - R$ {i.price_per_kg}/kg
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Peso (g)"
                        value={item.weight_g || ''}
                        onChange={(e) => {
                          const updated = [...(editingProduct.inputs_list || [])]
                          updated[index].weight_g = Number(e.target.value)
                          const totalWeight = updated.reduce((acc, curr) => acc + (Number(curr.weight_g) || 0), 0)
                          setEditingProduct({ ...editingProduct, inputs_list: updated, weight_g: totalWeight })
                        }}
                        className="w-28 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingProduct.inputs_list?.filter((_, i) => i !== index)
                          const totalWeight = updated?.reduce((acc, curr) => acc + (Number(curr.weight_g) || 0), 0) || 0
                          setEditingProduct({ ...editingProduct, inputs_list: updated, weight_g: totalWeight })
                        }}
                        className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                        title="Remover cor"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <select
                    value={editingProduct.input_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, input_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">Padrão (R$ 100/kg - R$ 0,10/g)</option>
                    {inputs.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.brand}) - R$ {i.price_per_kg}/kg</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Preço Sugerido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.suggested_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, suggested_price: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Margem (%)</label>
                  <input
                    type="number"
                    value={editingProduct.profit_margin_pct}
                    onChange={(e) => setEditingProduct({ ...editingProduct, profit_margin_pct: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Peso Total (g)</label>
                  <input
                    type="number"
                    value={editingProduct.weight_g}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weight_g: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Tempo (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.print_time_hours}
                    onChange={(e) => setEditingProduct({ ...editingProduct, print_time_hours: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Acabamento (min)</label>
                  <input
                    type="number"
                    value={editingProduct.handling_time_min || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, handling_time_min: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Embalagem (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.packaging_cost || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, packaging_cost: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Extras (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.extra_costs || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, extra_costs: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Estoque Pronto</label>
                <input
                  type="number"
                  value={editingProduct.stock_ready ?? 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock_ready: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 flex items-center justify-between shadow-md border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Custo Recalculado</span>
                  <span className="text-[11px] text-slate-400">
                    {formatCurrency(calculateDynamicCosts(editingProduct, inputs, machines).totalProductionCost)} (c/ 5% perda)
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}