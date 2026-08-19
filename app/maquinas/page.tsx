'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type Machine = {
  id: string
  name: string
  acquisition_cost: number
  power_consumption_kwh: number
  depreciation_per_hour: number
}

type MaintenanceLog = {
  id: string
  machineId: string
  machineName: string
  type: 'Preventiva' | 'Corretiva'
  description: string
  cost: number
  date: string
}

function MaquinasContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')

  const [machines, setMachines] = useState<Machine[]>([])
  const [fetching, setFetching] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // States do Formulário de Cadastro
  const [name, setName] = useState('')
  const [acquisitionCost, setAcquisitionCost] = useState<number>(0)
  const [powerConsumptionKwhStr, setPowerConsumptionKwhStr] = useState('0,085')
  const [usefulLifeHours, setUsefulLifeHours] = useState<number>(3000)
  const [depreciationPerHour, setDepreciationPerHour] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // Efeito para calcular automaticamente a depreciação
  useEffect(() => {
    if (usefulLifeHours > 0) {
      const calculatedDepreciation = acquisitionCost / usefulLifeHours
      setDepreciationPerHour(Number(calculatedDepreciation.toFixed(2)))
    } else {
      setDepreciationPerHour(0)
    }
  }, [acquisitionCost, usefulLifeHours])

  // State para Busca de Máquinas
  const [searchTerm, setSearchTerm] = useState('')

  // States para Formulário de Manutenção
  const [maintMachineId, setMaintMachineId] = useState('')
  const [maintType, setMaintType] = useState<'Preventiva' | 'Corretiva'>('Preventiva')
  const [maintDescription, setMaintDescription] = useState('')
  const [maintCost, setMaintCost] = useState<number>(0)
  const [maintLoading, setMaintLoading] = useState(false)

  // Logs de manutenção mockados
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([
    { id: '1', machineId: '1', machineName: 'Bambu Lab X1C', type: 'Preventiva', description: 'Lubrificação das guias lineares e limpeza de bico', cost: 15.00, date: '10/08/2026' },
    { id: '2', machineId: '2', machineName: 'Ender 3 S1 Pro', type: 'Corretiva', description: 'Troca de termistor danificado e calibração', cost: 35.50, date: '14/08/2026' },
  ])

  const fetchMachines = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase.from('machines').select('*').order('name', { ascending: true })
      if (error) throw error
      if (data) setMachines(data)
    } catch (error: any) {
      console.error('Erro ao buscar máquinas:', error.message)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchMachines()
  }, [])

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    setSucessoMsg('')
    try {
      const parsedConsumption = parseFloat(powerConsumptionKwhStr.replace(',', '.')) || 0

      const { error } = await supabase.from('machines').insert([
        { 
          name, 
          acquisition_cost: acquisitionCost,
          power_consumption_kwh: parsedConsumption,
          depreciation_per_hour: depreciationPerHour
        }
      ])

      if (error) throw error

      setName('')
      setAcquisitionCost(0)
      setPowerConsumptionKwhStr('0,085')
      setUsefulLifeHours(3000)
      setDepreciationPerHour(0)
      setSucessoMsg('Máquina cadastrada com sucesso!')
      fetchMachines()
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      alert('Erro ao cadastrar máquina: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMachine = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta máquina?')) return
    try {
      const { error } = await supabase.from('machines').delete().eq('id', id)
      if (error) throw error
      fetchMachines()
    } catch (error: any) {
      alert('Erro ao excluir máquina: ' + error.message)
    }
  }

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault()
    if (!maintMachineId || !maintDescription) return

    setMaintLoading(true)
    const matchedMachine = machines.find(m => m.id === maintMachineId)
    const newLog: MaintenanceLog = {
      id: String(maintenanceLogs.length + 1),
      machineId: maintMachineId,
      machineName: matchedMachine ? matchedMachine.name : 'Impressora Geral',
      type: maintType,
      description: maintDescription,
      cost: maintCost,
      date: new Date().toLocaleDateString('pt-BR')
    }

    setMaintenanceLogs([newLog, ...maintenanceLogs])
    setMaintDescription('')
    setMaintCost(0)
    setSucessoMsg('Log de manutenção preventivo registrado com sucesso!')
    setMaintLoading(false)
    setTimeout(() => setSucessoMsg(''), 4000)
  }

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const filteredMachines = machines.filter(mac => {
    return mac.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const custoKwhEstimado = 0.85

  return (
    <div className="space-y-6 max-w-none w-full pb-16 px-4 sm:px-6">
      
      {/* HEADER EXECUTIVO REFINADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Enterprise OS • Parque de Impressão
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tab === 'custos' ? 'Custos Detalhados de Operação' : tab === 'manutencao' ? 'Manutenção & Preventivas' : 'Gestão de Máquinas & Impressoras'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {tab === 'custos' 
              ? 'Visualize o cálculo do custo por hora ativa baseado no consumo elétrico e na depreciação das impressoras.' 
              : tab === 'manutencao' 
              ? 'Registre chamados e ordens de lubrificação ou troca de peças para manter a confiabilidade do seu parque.' 
              : 'Gerencie seu parque de impressoras integrado à tabela machines do Supabase.'}
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
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>✅</span> {sucessoMsg}
        </div>
      )}

      {/* 1. ABA: CUSTOS DE OPERAÇÃO (?tab=custos) */}
      {tab === 'custos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span>⚡</span> Tabela de Custos por Hora Ativa
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O custo total por hora de operação é a soma do custo de energia calculada (R$ {custoKwhEstimado} por kWh) e a taxa de depreciação horária definida na máquina.
            </p>

            <div className="space-y-4">
              {fetching ? (
                <p className="text-xs text-slate-400 text-center animate-pulse">Carregando dados das máquinas...</p>
              ) : machines.length === 0 ? (
                <p className="text-xs text-slate-400 text-center">Nenhuma impressora ativa para calcular.</p>
              ) : (
                machines.map(mac => {
                  const custoEnergia = mac.power_consumption_kwh * custoKwhEstimado
                  const custoTotalHora = custoEnergia + mac.depreciation_per_hour
                  return (
                    <div key={mac.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{mac.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Energia: {formatCurrency(custoEnergia)}/h • Depreciação: {formatCurrency(mac.depreciation_per_hour)}/h
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Custo Operação</span>
                        <span className="text-sm font-black text-orange-500">{formatCurrency(custoTotalHora)} / h</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📊</span> Projeções de Viabilidade
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Manter um parque de impressões atualizado requer monitorar o tempo de retorno sobre o investimento (ROI). Ao configurar a depreciação por hora e o custo elétrico, o Enterprise OS alimenta diretamente a Calculadora 3D para gerar orçamentos altamente lucrativos sem risco de margens negativas.
              </p>
            </div>
            
            <div className="mt-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Custo Médio Operacional do Parque</span>
              <span className="text-2xl font-black text-orange-500">
                {formatCurrency(
                  machines.reduce((acc, cur) => acc + (cur.power_consumption_kwh * custoKwhEstimado + cur.depreciation_per_hour), 0) / (machines.length || 1)
                )} / h
              </span>
            </div>
          </div>

        </div>
      )}

      {/* 2. ABA: MANUTENÇÃO (?tab=manutencao) */}
      {tab === 'manutencao' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          <form onSubmit={handleAddMaintenance} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-fit lg:col-span-1">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🔧</span> Registrar Chamado / Logs
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Selecionar Impressora</label>
              <select 
                value={maintMachineId} 
                onChange={(e) => setMaintMachineId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-medium"
              >
                <option value="">Selecione uma impressora...</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Manutenção</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <input type="radio" name="maintType" checked={maintType === 'Preventiva'} onChange={() => setMaintType('Preventiva')} className="text-orange-500 focus:ring-orange-500" />
                  Preventiva
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <input type="radio" name="maintType" checked={maintType === 'Corretiva'} onChange={() => setMaintType('Corretiva')} className="text-orange-500 focus:ring-orange-500" />
                  Corretiva
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Custo com Peças / Serviços (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={maintCost || ''} 
                onChange={(e) => setMaintCost(Number(e.target.value))} 
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Descrição da Manutenção</label>
              <textarea 
                value={maintDescription} 
                onChange={(e) => setMaintDescription(e.target.value)} 
                placeholder="Ex: Troca de bico nozzle de latão por aço endurecido."
                required
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 transition font-medium resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={maintLoading || !maintMachineId}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {maintLoading ? 'Registrando...' : '💾 Registrar Manutenção'}
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-fit lg:col-span-2">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Histórico Recente de Intervenções
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-4">
              {maintenanceLogs.map(log => (
                <div key={log.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-950 transition rounded-xl flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-950 dark:text-white">{log.machineName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        log.type === 'Preventiva' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {log.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{log.description}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Realizado em {log.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-500">{formatCurrency(log.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3. ABA: IMPRESSORAS (PADRÃO) */}
      {!tab && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* FORMULÁRIO DE CADASTRO COMPACTADO EM 5 COLUNAS NA MESMA LINHA */}
          <form onSubmit={handleAddMachine} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🖨️</span> Nova Máquina / Impressora
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome / Modelo</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Bambu Lab X1C"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Aquisição (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={acquisitionCost || ''} 
                  onChange={(e) => setAcquisitionCost(Number(e.target.value))} 
                  placeholder="3500.00"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Consumo (kWh)</label>
                <input 
                  type="text" 
                  value={powerConsumptionKwhStr} 
                  onChange={(e) => setPowerConsumptionKwhStr(e.target.value)} 
                  placeholder="0,085"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Vida Útil (Horas)</label>
                <input 
                  type="number" 
                  value={usefulLifeHours || ''} 
                  onChange={(e) => setUsefulLifeHours(Number(e.target.value))} 
                  placeholder="3000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold transition"
                />
              </div>

              <div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Depreciação estimada: <strong className="text-orange-600 dark:text-orange-400">{formatCurrency(depreciationPerHour)} / h</strong></span>
              <span>(Aquisição ÷ Vida Útil)</span>
            </div>
          </form>

          {/* TABELA DE LISTAGEM */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋</span> Máquinas Cadastradas
              </h2>
              <input 
                type="text"
                placeholder="Pesquisar máquina..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 pl-6">Nome da Máquina</th>
                    <th className="p-4">Custo Aquisição</th>
                    <th className="p-4">Consumo (kWh)</th>
                    <th className="p-4">Depreciação / Hora</th>
                    <th className="p-4 pr-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                  {fetching ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Carregando máquinas...
                      </td>
                    </tr>
                  ) : filteredMachines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                        Nenhuma máquina encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredMachines.map((mac) => (
                      <tr key={mac.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">{mac.name}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{formatCurrency(mac.acquisition_cost)}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{mac.power_consumption_kwh} kWh</td>
                        <td className="p-4 text-orange-600 dark:text-orange-400 font-extrabold">{formatCurrency(mac.depreciation_per_hour)} / h</td>
                        <td className="p-4 pr-6 text-center">
                          <button 
                            onClick={() => handleDeleteMachine(mac.id)}
                            title="Excluir Máquina"
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
      )}

    </div>
  )
}

export default function MaquinasPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center text-slate-400 text-xs font-bold animate-pulse">
        Carregando Parque de Impressoras...
      </div>
    }>
      <MaquinasContent />
    </Suspense>
  )
}