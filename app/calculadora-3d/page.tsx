'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'

type InputItem = {
  id: string
  name: string
  price_per_kg?: number
  price_per_unit?: number
}

type Machine = {
  id: string
  name: string
  cost_per_hour?: number
  depreciation_per_hour?: number
  power_consumption_kwh?: number
}

function CalculadoraContent() {
  const [pesoGramas, setPesoGramas] = useState<number>(0)
  const [tempoHoras, setTempoHoras] = useState<number>(0)
  const [margemLucro, setMargemLucro] = useState<number>(50)

  const [inputs, setInputs] = useState<InputItem[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  
  const [selectedInputId, setSelectedInputId] = useState<string>('')
  const [selectedMachineId, setSelectedMachineId] = useState<string>('')

  const [custoFilamentoKg, setCustoFilamentoKg] = useState<number>(100)
  const [custoHoraMaquina, setCustoHoraMaquina] = useState<number>(5)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: inputsData } = await supabase.from('inputs').select('*')
        if (inputsData) setInputs(inputsData)

        const { data: machinesData } = await supabase.from('machines').select('*')
        if (machinesData) setMachines(machinesData)
      } catch (error) {
        console.error('Erro ao buscar dados do Supabase:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (id: string) => {
    setSelectedInputId(id)
    const found = inputs.find((item) => item.id === id)
    if (found) {
      const price = found.price_per_kg !== undefined ? found.price_per_kg : (found.price_per_unit || 100)
      setCustoFilamentoKg(price)
    }
  }

  const handleMachineChange = (id: string) => {
    setSelectedMachineId(id)
    const found = machines.find((item) => item.id === id)
    if (found) {
      const dep = found.depreciation_per_hour || 0
      const power = found.power_consumption_kwh || 0
      const energyCost = power * 0.85 
      const calculatedCost = dep + energyCost
      
      const price = found.cost_per_hour !== undefined ? found.cost_per_hour : (calculatedCost || 5)
      setCustoHoraMaquina(price)
    }
  }

  const custoMaterial = (pesoGramas / 1000) * custoFilamentoKg
  const custoEnergiaTempo = tempoHoras * custoHoraMaquina
  const custoTotal = custoMaterial + custoEnergiaTempo
  const precoSugerido = custoTotal * (1 + margemLucro / 100)
  const lucroEstimado = precoSugerido - custoTotal

  // Salvar o produto 3D calculado na tabela products_3d
  const handleSalvarProduto = async () => {
    try {
      setSalvando(true)
      setSucessoMsg('')

      const nomeProduto = prompt('Digite o nome para salvar este produto 3D:', 'Peça 3D Personalizada')
      if (!nomeProduto) {
        setSalvando(false)
        return
      }

      const { error } = await supabase.from('products_3d').insert([
        {
          name: nomeProduto,
          category: 'Geral',
          machine_id: selectedMachineId || null,
          input_id: selectedInputId || null,
          weight_g: Number(pesoGramas) || 0,
          print_time_hours: Number(tempoHoras) || 0,
          handling_time_min: 0,
          profit_margin_pct: Number(margemLucro) || 0,
          marketplace_fee_pct: 0,
          packaging_cost: 0,
          extra_costs: 0,
          suggested_price: Number(precoSugerido.toFixed(2))
        }
      ])

      if (error) throw error
      setSucessoMsg('Produto salvo com sucesso no catálogo!')
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error)
      alert(`Erro ao salvar produto no Supabase: ${error.message || error}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-none w-full pb-16 px-4 sm:px-6">
      
      {/* HEADER EXECUTIVO REFINADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Enterprise OS • Precificação 3D
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Calculadora de Rentabilidade 3D
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Insira os parâmetros e selecione os insumos sincronizados para validar a viabilidade e o preço ideal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard" 
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>✅</span> {sucessoMsg}
        </div>
      )}

      {/* GRID DE FORMULÁRIO E RESULTADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUNA DE PARÂMETROS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span>⚙️</span> Parâmetros de Impressão
          </h2>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Selecionar Filamento (Tabela Insumos)
            </label>
            <select 
              value={selectedInputId} 
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-medium"
            >
              <option value="">Selecione um filamento...</option>
              {inputs.map((item) => {
                const price = item.price_per_kg !== undefined ? item.price_per_kg : (item.price_per_unit || 100)
                return (
                  <option key={item.id} value={item.id}>
                    {item.name} ({formatCurrency(price)}/kg)
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Selecionar Impressora (Tabela Máquinas)
            </label>
            <select 
              value={selectedMachineId} 
              onChange={(e) => handleMachineChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-medium"
            >
              <option value="">Selecione uma máquina...</option>
              {machines.map((mac) => {
                const dep = mac.depreciation_per_hour || 0
                const power = mac.power_consumption_kwh || 0
                const calculated = dep + (power * 0.85)
                const price = mac.cost_per_hour !== undefined ? mac.cost_per_hour : calculated
                return (
                  <option key={mac.id} value={mac.id}>
                    {mac.name} ({formatCurrency(price)}/h)
                  </option>
                )
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Peso da Peça (gramas)
              </label>
              <input 
                type="number" 
                value={pesoGramas || ''} 
                onChange={(e) => setPesoGramas(Number(e.target.value))}
                placeholder="Ex: 150"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tempo de Impressão (horas)
              </label>
              <input 
                type="number" 
                value={tempoHoras || ''} 
                onChange={(e) => setTempoHoras(Number(e.target.value))}
                placeholder="Ex: 5"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Margem de Lucro Desejada (%)
            </label>
            <input 
              type="number" 
              value={margemLucro} 
              onChange={(e) => setMargemLucro(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
            />
          </div>
        </div>

        {/* COLUNA DE RESULTADOS E VIABILIDADE */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📊</span> Análise de Viabilidade
            </h2>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Custo do Material:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(custoMaterial)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Custo de Operação/Máquina:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(custoEnergiaTempo)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-orange-600 dark:text-orange-400 font-bold">Custo Total de Produção:</span>
                <span className="font-black text-orange-600 dark:text-orange-400">{formatCurrency(custoTotal)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Lucro Estimado:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(lucroEstimado)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-orange-500/20 text-center shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Preço de Venda Sugerido</span>
              <span className="text-3xl sm:text-4xl font-black text-orange-500">
                {formatCurrency(precoSugerido)}
              </span>
            </div>
            
            <button
              onClick={handleSalvarProduto}
              disabled={salvando || pesoGramas <= 0}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              {salvando ? 'Salvando...' : '💾 Salvar no Catálogo'}
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}

export default function CalculadoraRentabilidade3D() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center text-slate-400 text-xs font-bold animate-pulse">
        Carregando Calculadora 3D...
      </div>
    }>
      <CalculadoraContent />
    </Suspense>
  )
}