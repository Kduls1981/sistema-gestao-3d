'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type ProjectedCashFlow = {
  id: string
  scenario_name: string
  period: string
  capex: number
  cmv_insumos: number
  opex: number
  taxas_comissoes: number
  receitas_projetadas: number
  saldo_projetado: number
}

// Dados consolidados do seu Fluxo de Caixa Projetado (Cenário Conservador baseadas nas abas da sua planilha)
const PLANILHA_CONSERVADORA_INICIAL = [
  { period: 'Mês 1', receitas_projetadas: 15000, opex: 4500, cmv_insumos: 3200, capex: 2500, taxas_comissoes: 750, saldo_projetado: 17831.58 },
  { period: 'Mês 2', receitas_projetadas: 16200, opex: 4600, cmv_insumos: 3400, capex: 1000, taxas_comissoes: 810, saldo_projetado: 17831.58 },
  { period: 'Mês 3', receitas_projetadas: 17500, opex: 4700, cmv_insumos: 3600, capex: 0, taxas_comissoes: 875, saldo_projetado: 17831.58 },
  { period: 'Mês 4', receitas_projetadas: 18000, opex: 4800, cmv_insumos: 3700, capex: 0, taxas_comissoes: 900, saldo_projetado: 17831.58 },
  { period: 'Mês 5', receitas_projetadas: 18500, opex: 4900, cmv_insumos: 3800, capex: 0, taxas_comissoes: 925, saldo_projetado: 16046.64 },
  { period: 'Mês 6', receitas_projetadas: 19000, opex: 5000, cmv_insumos: 3900, capex: 0, taxas_comissoes: 950, saldo_projetado: 14261.70 },
  { period: 'Mês 7', receitas_projetadas: 19500, opex: 5100, cmv_insumos: 4000, capex: 0, taxas_comissoes: 975, saldo_projetado: 12476.75 },
  { period: 'Mês 8', receitas_projetadas: 20000, opex: 5200, cmv_insumos: 4100, capex: 0, taxas_comissoes: 1000, saldo_projetado: 10691.81 },
  { period: 'Mês 9', receitas_projetadas: 20500, opex: 5300, cmv_insumos: 4200, capex: 0, taxas_comissoes: 1025, saldo_projetado: 8906.87 },
  { period: 'Mês 10', receitas_projetadas: 21000, opex: 5400, cmv_insumos: 4300, capex: 0, taxas_comissoes: 1050, saldo_projetado: 7121.92 },
  { period: 'Mês 11', receitas_projetadas: 21500, opex: 5500, cmv_insumos: 4400, capex: 0, taxas_comissoes: 1075, saldo_projetado: 5336.98 },
  { period: 'Mês 12', receitas_projetadas: 22000, opex: 5600, cmv_insumos: 4500, capex: 0, taxas_comissoes: 1100, saldo_projetado: 3552.04 }
]

export default function ProjecaoCaixaPage() {
  const [projections, setProjections] = useState<ProjectedCashFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // Form states
  const [period, setPeriod] = useState('')
  const [capex, setCapex] = useState<number>(0)
  const [cmvInsumos, setCmvInsumos] = useState<number>(0)
  const [opex, setOpex] = useState<number>(0)
  const [taxasComissoes, setTaxasComissoes] = useState<number>(0)
  const [receitasProjetadas, setReceitasProjetadas] = useState<number>(0)
  const [saldoProjetado, setSaldoProjetado] = useState<number>(0)

  const fetchProjections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projected_cash_flow')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      if (data) setProjections(data)
    } catch (error: any) {
      console.error('Erro ao buscar projeções:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjections()
  }, [])

  // Função para popular automaticamente com os dados consolidados da planilha conservadora
  const handleSeedPlanilha = async () => {
    try {
      setLoading(true)
      for (const item of PLANILHA_CONSERVADORA_INICIAL) {
        await supabase.from('projected_cash_flow').insert([
          {
            scenario_name: 'Conservador',
            period: item.period,
            capex: item.capex,
            cmv_insumos: item.cmv_insumos,
            opex: item.opex,
            taxas_comissoes: item.taxas_comissoes,
            receitas_projetadas: item.receitas_projetadas,
            saldo_projetado: item.saldo_projetado
          }
        ])
      }
      setSucessoMsg('Dados da planilha conservadora (CAPEX, OPEX, CMV e Taxas) importados com sucesso!')
      fetchProjections()
      setTimeout(() => setSucessoMsg(''), 5000)
    } catch (error: any) {
      alert('Erro ao importar planilha: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProjection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!period) return

    try {
      const { error } = await supabase.from('projected_cash_flow').insert([
        {
          scenario_name: 'Conservador',
          period,
          capex,
          cmv_insumos: cmvInsumos,
          opex,
          taxas_comissoes: taxasComissoes,
          receitas_projetadas: receitasProjetadas,
          saldo_projetado: saldoProjetado
        }
      ])

      if (error) throw error

      setSucessoMsg('Período projetado adicionado com sucesso!')
      setPeriod('')
      setCapex(0)
      setCmvInsumos(0)
      setOpex(0)
      setTaxasComissoes(0)
      setReceitasProjetadas(0)
      setSaldoProjetado(0)
      fetchProjections()

      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  return (
    <main className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            Enterprise OS • Fluxo de Caixa Projetado (Conservador)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Projeção Financeira de Longo Prazo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Integração das planilhas de CAPEX, CMV, OPEX e Taxas/Comissões direto no banco Supabase.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {projections.length === 0 && (
            <button
              onClick={handleSeedPlanilha}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-sm"
            >
              📥 Sincronizar Dados da Planilha Conservadora
            </button>
          )}
          <Link
            href="/financeiro"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition"
          >
            ← Voltar ao Financeiro
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          {sucessoMsg}
        </div>
      )}

      {/* Formulário de Inserção Manual */}
      <form onSubmit={handleAddProjection} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Período (Ex: Mês 1)</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Mês 1"
            required
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Receitas Projetadas (R$)</label>
          <input
            type="number"
            step="0.01"
            value={receitasProjetadas}
            onChange={(e) => setReceitasProjetadas(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">OPEX (R$)</label>
          <input
            type="number"
            step="0.01"
            value={opex}
            onChange={(e) => setOpex(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">CMV / Insumos (R$)</label>
          <input
            type="number"
            step="0.01"
            value={cmvInsumos}
            onChange={(e) => setCmvInsumos(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">CAPEX (R$)</label>
          <input
            type="number"
            step="0.01"
            value={capex}
            onChange={(e) => setCapex(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Taxas & Comissões (R$)</label>
          <input
            type="number"
            step="0.01"
            value={taxasComissoes}
            onChange={(e) => setTaxasComissoes(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Saldo Projetado (R$)</label>
          <input
            type="number"
            step="0.01"
            value={saldoProjetado}
            onChange={(e) => setSaldoProjetado(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-sm font-bold text-emerald-500"
          />
        </div>
        <div className="md:col-span-4 flex justify-end pt-2">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-sm cursor-pointer"
          >
            Adicionar Projeção no Sistema
          </button>
        </div>
      </form>

      {/* Tabela de Visualização */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Registros Projetados no Supabase (Base Planilha Conservadora)</h3>
          {projections.length === 0 && (
            <button
              onClick={handleSeedPlanilha}
              className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
            >
              Clique aqui para preencher com os dados da planilha
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4">Período</th>
                <th className="p-4">Receitas</th>
                <th className="p-4">OPEX</th>
                <th className="p-4">CMV / Insumos</th>
                <th className="p-4">CAPEX</th>
                <th className="p-4">Taxas</th>
                <th className="p-4">Saldo Projetado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Carregando projeções...</td>
                </tr>
              ) : projections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma projeção cadastrada ainda. Clique no botão superior <strong>"📥 Sincronizar Dados da Planilha Conservadora"</strong> para popular automaticamente!
                  </td>
                </tr>
              ) : (
                projections.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{item.period}</td>
                    <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">R$ {Number(item.receitas_projetadas).toFixed(2)}</td>
                    <td className="p-4 text-rose-600 dark:text-rose-400">R$ {Number(item.opex).toFixed(2)}</td>
                    <td className="p-4 text-amber-600 dark:text-amber-400">R$ {Number(item.cmv_insumos).toFixed(2)}</td>
                    <td className="p-4">R$ {Number(item.capex).toFixed(2)}</td>
                    <td className="p-4">R$ {Number(item.taxas_comissoes).toFixed(2)}</td>
                    <td className="p-4 font-black text-cyan-600 dark:text-cyan-400">R$ {Number(item.saldo_projetado).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}