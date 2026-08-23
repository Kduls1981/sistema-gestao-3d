'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import ConfirmModal from '@/app/components/ConfirmModal'
import AlertModal from '@/app/components/AlertModal'

type InputItem = {
  id: string
  name: string
  type: string
  brand: string
  price_per_kg: number
  cost_per_gram: number
  stock_quantity_g?: number
  total_cost?: number
  purchase_date?: string
}

type SupplierItem = {
  id: string
  name: string
}

// Função auxiliar para formatação de moeda no padrão brasileiro (R$ 86,00)
const formatCurrency = (value: number, decimals: number = 2) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function EstoqueContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = searchParams.get('tab')
  const action = searchParams.get('action')

  const [inputs, setInputs] = useState<InputItem[]>([])
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  
  const [name, setName] = useState('')
  const [type, setType] = useState('PLA')
  const [brand, setBrand] = useState('')
  const [pricePerKg, setPricePerKg] = useState<number>(0)
  const [stockQuantityG, setStockQuantityG] = useState<number>(1000)
  const [totalCost, setTotalCost] = useState<number>(0)
  const [purchaseDate, setPurchaseDate] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // State para Busca
  const [searchTerm, setSearchTerm] = useState('')

  // Estados para Edição / Cadastro de Tipos/Materiais no Popup
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [newMaterialType, setNewMaterialType] = useState('')

  // Estados para novas modais customizadas
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

  const fetchInputs = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase.from('inputs').select('*').order('name', { ascending: true })
      if (error) throw error
      if (data) {
        setInputs(data)
        if (data.length > 0 && !data.some(item => (item.type || '').toUpperCase() === type.toUpperCase())) {
          setType(data[0].type ? data[0].type.toUpperCase() : 'PLA')
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar insumos:', error.message)
    } finally {
      setFetching(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase.from('suppliers').select('id, name').order('name', { ascending: true })
      if (error) throw error
      if (data) setSuppliers(data)
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores:', error.message)
    }
  }

  useEffect(() => {
    fetchInputs()
    fetchSuppliers()
  }, [])

  const handleAddInput = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    setSucessoMsg('')
    try {
      const costPerGram = pricePerKg > 0 ? Number((pricePerKg / 1000).toFixed(4)) : (totalCost > 0 && stockQuantityG > 0 ? Number((totalCost / stockQuantityG).toFixed(4)) : 0)
      const finalPricePerKg = pricePerKg > 0 ? pricePerKg : (stockQuantityG > 0 ? (totalCost / stockQuantityG) * 1000 : 0)

      const calculatedTotalCost = totalCost > 0 ? totalCost : (finalPricePerKg * stockQuantityG) / 1000

      // Buscar se já existe um insumo com o mesmo Nome/Cor e Tipo no banco de dados
      const { data: matchedInputs, error: searchError } = await supabase
        .from('inputs')
        .select('*')
        .ilike('name', name)
        .ilike('type', type)

      if (searchError) throw searchError

      // Filtrar por marca/fornecedor considerando nulos e vazios
      const existingItem = matchedInputs?.find(item => 
        (item.brand || '').toLowerCase().trim() === (brand || '').toLowerCase().trim()
      )

      if (existingItem) {
        // Se o insumo já existe, atualizamos o estoque, custos e data da última compra
        const newStockQty = (existingItem.stock_quantity_g || 0) + stockQuantityG
        const newTotalCost = (existingItem.total_cost || 0) + calculatedTotalCost

        const { error: updateError } = await supabase
          .from('inputs')
          .update({
            price_per_kg: finalPricePerKg,
            cost_per_gram: costPerGram,
            stock_quantity_g: newStockQty,
            total_cost: newTotalCost,
            purchase_date: purchaseDate || null
          })
          .eq('id', existingItem.id)

        if (updateError) throw updateError
      } else {
        // Se não existe, inserimos um novo registro
        const { error: insertError } = await supabase.from('inputs').insert([
          { 
            name, 
            type: type.toUpperCase(), 
            brand,
            price_per_kg: finalPricePerKg, 
            cost_per_gram: costPerGram,
            stock_quantity_g: stockQuantityG,
            total_cost: calculatedTotalCost,
            purchase_date: purchaseDate || null
          }
        ])

        if (insertError) throw insertError
      }

      // Lançamento financeiro automático da despesa
      const todayString = new Date().toISOString().substring(0, 10)
      await supabase.from('financial_transactions').insert([
        {
          date: purchaseDate || todayString,
          type: 'Despesa',
          category: 'Insumos / Filamentos (PLA, PETG, ABS)',
          description: `Compra de Insumo: ${name} (${brand} - ${type.toUpperCase()})`,
          amount: Number(calculatedTotalCost.toFixed(2)),
          status: 'Concluído',
          payment_method: 'Pix',
          payment_status: 'paid',
          due_date: purchaseDate || todayString
        }
      ])

      setName('')
      setBrand('')
      setPricePerKg(0)
      setStockQuantityG(1000)
      setTotalCost(0)
      setPurchaseDate('')
      setSucessoMsg('Insumo cadastrado com sucesso!')
      fetchInputs()
      
      setTimeout(() => {
        setSucessoMsg('')
        router.push('/estoque')
      }, 1500)
    } catch (error: any) {
      setAlertModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao cadastrar insumo: ' + error.message,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para Excluir Material/Insumo
  const handleDeleteInput = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Material',
      message: 'Deseja realmente excluir este material?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('inputs').delete().eq('id', id)
          if (error) throw error
          setSucessoMsg('Material excluído com sucesso!')
          fetchInputs()
          setTimeout(() => setSucessoMsg(''), 1500)
        } catch (error: any) {
          setAlertModal({
            isOpen: true,
            title: 'Erro ao Excluir',
            message: 'Erro ao excluir: ' + error.message,
            type: 'error'
          })
        }
      }
    })
  }

  const registeredTypes = Array.from(
    new Set(inputs.map(item => (item.type ? item.type.toUpperCase() : 'GERAL')))
  ).sort()

  const filamentosList = inputs.filter(item => {
    const t = (item.type || '').toUpperCase()
    return t.includes('PLA') || t.includes('ABS') || t.includes('PETG') || t.includes('TPU') || t.includes('FLEX') || t.includes('ASA') || t.includes('FILAMENTO')
  })

  // Filtragem Geral por Busca
  const filteredInputs = inputs.filter(item => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const filteredFilamentos = filamentosList.filter(item => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const categoriesMap = inputs.reduce((acc: { [key: string]: { count: number, avgPrice: number, items: InputItem[] } }, cur) => {
    const catName = cur.type ? cur.type.toUpperCase() : 'GERAL'
    if (!acc[catName]) {
      acc[catName] = { count: 0, avgPrice: 0, items: [] }
    }
    acc[catName].count += 1
    acc[catName].items.push(cur)
    return acc
  }, {})

  Object.keys(categoriesMap).forEach(cat => {
    const category = categoriesMap[cat]
    const sum = category.items.reduce((total, item) => total + item.price_per_kg, 0)
    category.avgPrice = sum / category.count
  })

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-10 px-4 sm:px-6 relative">
      
      {/* HEADER EXECUTIVO REFINADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Enterprise OS • Estoque & Insumos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tab === 'filamentos' ? 'Estoque de Filamentos' : tab === 'categorias' ? 'Divisão por Categorias' : 'Controle de Matéria-Prima'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {tab === 'filamentos' 
              ? 'Visualize apenas os materiais plásticos de extrusão 3D cadastrados no sistema.' 
              : tab === 'categorias' 
              ? 'Veja o resumo e a distribuição analítica dos seus materiais agrupados.' 
              : 'Gerencie filamentos e insumos integrados perfeitamente ao Supabase.'}
          </p>
        </div>

        <div className="flex gap-2">
          {(!action && !tab) && (
            <Link 
              href="/estoque?action=novo"
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              + Cadastro Materiais
            </Link>
          )}
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

      {/* POPUP MODAL: CADASTRO DE NOVO MATERIAL / GERENCIAMENTO */}
      {action === 'novo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>➕</span> Gerenciar / Cadastrar Novo Material
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Adicione novas opções ou gerencie os materiais já cadastrados no banco de dados.
                </p>
              </div>
              <Link 
                href="/estoque"
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-xs font-bold transition"
              >
                ✕
              </Link>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if(!newMaterialType) return;
                
                try {
                  if (editingMaterialId) {
                    const { error } = await supabase
                      .from('inputs')
                      .update({ type: newMaterialType.toUpperCase() })
                      .eq('id', editingMaterialId)
                    if (error) throw error
                    setSucessoMsg('Material atualizado com sucesso!');
                  } else {
                    const { error } = await supabase
                      .from('inputs')
                      .insert([{ name: newMaterialType.toUpperCase(), type: newMaterialType.toUpperCase(), price_per_kg: 0, cost_per_gram: 0 }])
                    if (error) throw error
                    setSucessoMsg('Material cadastrado com sucesso!');
                  }

                  setNewMaterialType('');
                  setEditingMaterialId(null);
                  fetchInputs();
                  setTimeout(() => setSucessoMsg(''), 1500);
                } catch (err: any) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Erro ao Salvar',
                    message: 'Erro ao salvar: ' + err.message,
                    type: 'error'
                  })
                }
              }} className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {editingMaterialId ? 'Editar Material' : 'Novo Tipo / Material Avulso'}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMaterialType} 
                    onChange={(e) => setNewMaterialType(e.target.value)} 
                    placeholder="Ex: PP, Nylon, HIPS"
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm whitespace-nowrap"
                  >
                    {editingMaterialId ? 'Atualizar' : 'Adicionar'}
                  </button>
                  {editingMaterialId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingMaterialId(null); setNewMaterialType(''); }}
                      className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Materiais Já Cadastrados</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {inputs.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">Nenhum material cadastrado.</p>
                  ) : (
                    inputs.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">Tipo: {item.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setEditingMaterialId(item.id);
                              setNewMaterialType(item.type || item.name);
                            }}
                            title="Editar"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteInput(item.id)}
                            title="Excluir"
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <Link 
                href="/estoque"
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition"
              >
                Fechar
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* ABA: FILAMENTOS */}
      {tab === 'filamentos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🖨️</span> Filamentos para Extrusão 3D
            </h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input 
                type="text"
                placeholder="Pesquisar filamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 w-full sm:w-64"
              />
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 whitespace-nowrap">
                Total: {filteredFilamentos.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 pl-6">Nome / Cor</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Marca</th>
                  <th className="p-4">Preço / Kg</th>
                  <th className="p-4 pr-6">Custo / Grama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                {fetching ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">Carregando filamentos...</td>
                  </tr>
                ) : filteredFilamentos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">Nenhum insumo encontrado.</td>
                  </tr>
                ) : (
                  filteredFilamentos.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-[10px]">
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{item.brand || '-'}</td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(Number(item.price_per_kg))}</td>
                      <td className="p-4 pr-6 font-extrabold text-orange-600 dark:text-orange-400">{formatCurrency(Number(item.cost_per_gram), 4)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: CATEGORIAS */}
      {tab === 'categorias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {fetching ? (
            <div className="col-span-full text-center py-10 text-slate-400 text-xs font-bold animate-pulse">Carregando dados das categorias...</div>
          ) : Object.keys(categoriesMap).length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-400 text-xs font-bold">Nenhum dado a ser exibido.</div>
          ) : (
            Object.keys(categoriesMap).map(catName => (
              <div key={catName} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider">
                      {catName}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{categoriesMap[catName].count} insumo(s)</span>
                  </div>
                  <div className="space-y-2 mt-4">
                    {categoriesMap[catName].items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/40 pb-1.5">
                        <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[150px]">{item.name}</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(Number(item.price_per_kg))}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Preço Médio:</span>
                  <span className="font-black text-orange-500">{formatCurrency(categoriesMap[catName].avgPrice)}/kg</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ABA PRINCIPAL: MATÉRIA-PRIMA */}
      {!action && !tab && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* FORMULÁRIO DE CADASTRO COMPACTADO COM SUPORTE A ESTOQUE E VALOR TOTAL */}
          <form onSubmit={handleAddInput} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span>📦</span> Novo Cadastro de Insumo / Filamento (Entrada em Estoque)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Material</label>
                <div className="relative">
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-3.5 pr-10 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-semibold appearance-none cursor-pointer"
                  >
                    {registeredTypes.length === 0 ? (
                      <option value="PLA">PLA</option>
                    ) : (
                      registeredTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome / Cor</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Preto fosco"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Marca / Fornecedor</label>
                <select 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-3.5 pr-10 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-medium appearance-none cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>{sup.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Preço / KG (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={pricePerKg || ''} 
                  onChange={(e) => setPricePerKg(Number(e.target.value))} 
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Qtd. Estoque (Gramas)</label>
                <input 
                  type="number" 
                  value={stockQuantityG || ''} 
                  onChange={(e) => setStockQuantityG(Number(e.target.value))} 
                  placeholder="Ex: 1000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Valor Total Pago (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={totalCost || ''} 
                  onChange={(e) => setTotalCost(Number(e.target.value))} 
                  placeholder="Ex: 90.00"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Data da Compra</label>
                <input 
                  type="date" 
                  value={purchaseDate} 
                  onChange={(e) => setPurchaseDate(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
                />
              </div>

              <div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Salvando...' : '💾 Salvar no Estoque'}
                </button>
              </div>
            </div>
          </form>

          {/* TABELA DE LISTAGEM */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋</span> Insumos Cadastrados no Estoque
              </h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input 
                  type="text"
                  placeholder="Pesquisar insumo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 w-full sm:w-64"
                />
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Total: {filteredInputs.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 pl-6">Nome</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Marca</th>
                    <th className="p-4">Qtd. Estoque</th>
                    <th className="p-4">Preço / Kg</th>
                    <th className="p-4">Custo / Grama</th>
                    <th className="p-4 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                  {fetching ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Carregando estoque...
                      </td>
                    </tr>
                  ) : filteredInputs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                        Nenhum insumo cadastrado no estoque.
                      </td>
                    </tr>
                  ) : (
                    filteredInputs.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">{item.name}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                            {item.type || 'GERAL'}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-600 dark:text-slate-400">
                          {item.brand || '-'}
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {item.stock_quantity_g ? `${item.stock_quantity_g}g` : '-'}
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(Number(item.price_per_kg))}
                        </td>
                        <td className="p-4 font-extrabold text-orange-600 dark:text-orange-400">
                          {formatCurrency(Number(item.cost_per_gram), 4)}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleDeleteInput(item.id)}
                              title="Excluir"
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition inline-flex items-center justify-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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

export default function EstoquePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs font-bold text-slate-400">Carregando módulo de estoque...</div>}>
      <EstoqueContent />
    </Suspense>
  )
}