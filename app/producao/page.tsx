'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type Product3D = {
  id: string
  name: string
  category?: string
  weight_g?: number
  print_time_hours?: number
  suggested_price?: number
  stock_ready?: number
  production_queue?: number
  production_started_at?: string | null
  assigned_printer?: string | null
  filament_type?: string | null
}

export default function ProducaoPage() {
  const [products, setProducts] = useState<Product3D[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Timer para re-renderizar a tela a cada minuto e atualizar os contadores de tempo
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchProductionData()
  }, [])

  async function fetchProductionData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products_3d')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setProducts(data)
    } catch (err) {
      console.error('Erro ao carregar dados de produção:', err)
    } finally {
      setLoading(false)
    }
  }

  // Métricas agregadas de produção
  const totalProdutos = products.length
  const emProducao = products.filter(p => p.production_started_at).length
  const totalNaFila = products.reduce((acc, p) => acc + (p.production_queue || 0), 0)

  // Atualização de quantidade na fila
  async function handleUpdateQueue(id: string, delta: number) {
    const prod = products.find(p => p.id === id)
    if (!prod) return
    const currentQueue = prod.production_queue || 0
    const newQueue = Math.max(0, currentQueue + delta)

    try {
      const { error } = await supabase
        .from('products_3d')
        .update({ production_queue: newQueue })
        .eq('id', id)

      if (error) throw error
      setProducts(products.map(p => p.id === id ? { ...p, production_queue: newQueue } : p))
    } catch (err) {
      console.error('Erro ao atualizar fila:', err)
    }
  }

  // Iniciar Produção
  async function handleStartProduction(prod: Product3D) {
    const now = new Date().toISOString()
    try {
      const { error } = await supabase
        .from('products_3d')
        .update({ production_started_at: now })
        .eq('id', prod.id)

      if (error) throw error
      setProducts(products.map(p => p.id === prod.id ? { ...p, production_started_at: now } : p))
    } catch (err) {
      console.error('Erro ao iniciar produção:', err)
    }
  }

  // Finalizar Produção (Enviar p/ Estoque ou Registrar Falha)
  async function handleFinishProduction(prod: Product3D, success: boolean) {
    const currentQueue = prod.production_queue || 0
    const newQueue = Math.max(0, currentQueue - 1)
    const currentStock = prod.stock_ready || 0
    const newStock = success ? currentStock + 1 : currentStock

    try {
      // 1. Atualizar o produto 3D (fila de produção e estoque pronto)
      const { error } = await supabase
        .from('products_3d')
        .update({
          production_queue: newQueue,
          production_started_at: newQueue > 0 ? new Date().toISOString() : null,
          stock_ready: newStock
        })
        .eq('id', prod.id)

      if (error) throw error

      // 2. Deduzir filamento do estoque (inputs)
      const filType = (prod.filament_type || 'PLA').toUpperCase()
      const pieceWeight = prod.weight_g || 0

      if (pieceWeight > 0) {
        const { data: matchedInputs } = await supabase
          .from('inputs')
          .select('*')
          .ilike('type', filType)
          .gt('stock_quantity_g', 0)
          .order('stock_quantity_g', { ascending: false })

        if (matchedInputs && matchedInputs.length > 0) {
          const chosenInput = matchedInputs[0]
          const currentQty = chosenInput.stock_quantity_g || 0
          const newQty = Math.max(0, currentQty - pieceWeight)

          await supabase
            .from('inputs')
            .update({ stock_quantity_g: newQty })
            .eq('id', chosenInput.id)
        }
      }

      // 3. Se for falha, registrar na tabela de desperdícios/falhas
      if (!success) {
        await supabase
          .from('production_failures')
          .insert([
            {
              product_name: prod.name,
              filament_wasted_g: pieceWeight
            }
          ])
      }

      setProducts(products.map(p => p.id === prod.id ? {
        ...p,
        production_queue: newQueue,
        production_started_at: newQueue > 0 ? new Date().toISOString() : null,
        stock_ready: newStock
      } : p))
    } catch (err) {
      console.error('Erro ao finalizar item:', err)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [products, searchTerm])

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen text-slate-800 dark:text-slate-100">
      
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Painel de Produção 3D
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gerencie e monitore a fila de impressão, tempos estimados e controle de fabricação em tempo real.
          </p>
        </div>

        <Link
          href="/projetos"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-xl text-sm font-bold transition shadow-sm"
        >
          ← Voltar para Cadastro de Produtos
        </Link>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Peças Cadastradas</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{loading ? '...' : totalProdutos}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Imprimindo Agora</span>
          <p className="text-3xl font-black text-amber-500 mt-2">{loading ? '...' : emProducao} modelos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Fila Total de Produção</span>
          <p className="text-3xl font-black text-indigo-500 mt-2">{loading ? '...' : totalNaFila} itens em espera</p>
        </div>
      </div>

      {/* Tabela de Produção */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fila & Monitoramento de Impressão</h2>
          <input
            type="text"
            placeholder="Buscar peça ou categoria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Carregando painel de produção...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Nenhum produto encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4 pl-6">Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Impressora</th>
                  <th className="p-4">Filamento</th>
                  <th className="p-4">Tempo Est. Peça</th>
                  <th className="p-4 text-center">Estoque Pronto</th>
                  <th className="p-4 text-center">Fila de Produção</th>
                  <th className="p-4">Tempo Est. Total</th>
                  <th className="p-4 pr-6 text-center">Status & Controle de Fabricação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredProducts.map(prod => {
                  const queue = prod.production_queue || 0
                  const printTimeHours = prod.print_time_hours || 0
                  const totalEstHours = (queue * printTimeHours).toFixed(1)

                  // Cálculos de progresso do item em impressão
                  let isPrinting = false
                  let progressPercent = 0
                  let remainingFormatted = ''

                  if (prod.production_started_at && printTimeHours > 0) {
                    isPrinting = true
                    const start = new Date(prod.production_started_at).getTime()
                    const now = new Date().getTime()
                    const elapsedHours = (now - start) / (1000 * 60 * 60)
                    progressPercent = Math.min(100, Math.round((elapsedHours / printTimeHours) * 100))

                    const remainingHoursTotal = Math.max(0, printTimeHours - elapsedHours)
                    const remH = Math.floor(remainingHoursTotal)
                    const remM = Math.round((remainingHoursTotal - remH) * 60)
                    remainingFormatted = `${remH}h ${remM}m`
                  }

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      
                      {/* 1. Produto */}
                      <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">
                        {prod.name}
                      </td>

                      {/* 2. Categoria */}
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {prod.category || 'Geral'}
                      </td>

                      {/* 3. Impressora */}
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                        {prod.assigned_printer ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                            🖨️ {prod.assigned_printer}
                          </span>
                        ) : isPrinting ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-semibold">
                            🖨️ Em uso
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Aguardando</span>
                        )}
                      </td>

                      {/* 4. Filamento */}
                      <td className="p-4 text-slate-600 dark:text-slate-400 text-xs">
                        {prod.filament_type ? (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-mono">
                            🧵 {prod.filament_type}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">PLA / Padrão</span>
                        )}
                      </td>

                      {/* 5. Tempo Est. Peça */}
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                        {printTimeHours} h
                      </td>

                      {/* 6. Estoque Pronto */}
                      <td className="p-4 text-center">
                        <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-bold text-xs">
                          {prod.stock_ready || 0} un
                        </span>
                      </td>

                      {/* 7. Fila de Produção */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button
                            onClick={() => handleUpdateQueue(prod.id, -1)}
                            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-sm hover:bg-slate-200 transition font-bold"
                            title="Diminuir fila"
                          >
                            -
                          </button>
                          <span className="font-extrabold px-1 text-slate-900 dark:text-white min-w-[20px]">
                            {queue}
                          </span>
                          <button
                            onClick={() => handleUpdateQueue(prod.id, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-sm hover:bg-slate-200 transition font-bold"
                            title="Aumentar fila"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* 8. Tempo Est. Total */}
                      <td className="p-4 text-indigo-600 dark:text-indigo-400 font-extrabold">
                        {totalEstHours} h
                      </td>

                      {/* 9. Status & Controle de Fabricação */}
                      <td className="p-4 pr-6">
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          {!isPrinting && queue > 0 && (
                            <button
                              onClick={() => handleStartProduction(prod)}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              ▶ Iniciar Impressão
                            </button>
                          )}

                          {isPrinting && (
                            <div className="space-y-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                              <div className="flex justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                                <span>Imprimindo...</span>
                                <span>{progressPercent}%</span>
                              </div>

                              <div className="w-full bg-amber-200 dark:bg-amber-900/50 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>

                              <p className="text-[11px] text-amber-600 dark:text-amber-400/80 font-medium">
                                Restante: {remainingFormatted}
                              </p>

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handleFinishProduction(prod, true)}
                                  className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer text-center"
                                  title="Envia a peça pronta para o estoque"
                                >
                                  Enviar p/ Estoque
                                </button>
                                <button
                                  onClick={() => handleFinishProduction(prod, false)}
                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer text-center"
                                  title="Descarta peça e gera custo de prejuízo"
                                >
                                  Descartar (Falha)
                                </button>
                              </div>
                            </div>
                          )}

                          {queue === 0 && !isPrinting && (
                            <span className="text-xs text-slate-400 italic text-center block">
                              Sem itens na fila.
                            </span>
                          )}
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

    </div>
  )
}