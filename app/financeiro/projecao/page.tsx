'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { TrendingUp, Layers, Database, PlusCircle, ShieldCheck, Cpu, DollarSign } from 'lucide-react'

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

// Dados completos e fieis à sua planilha conservadora para carga inicial / sincronização
const DADOS_CONSERVADORES_PLANILHA = [
  { period: 'M1', receitas_projetadas: 1650.00, opex: 0.00, cmv_insumos: 347.48, capex: 0.00, taxas_comissoes: 33.00, saldo_projetado: 1269.52 },
  { period: 'M2', receitas_projetadas: 3300.00, opex: 0.00, cmv_insumos: 694.97, capex: 0.00, taxas_comissoes: 264.00, saldo_projetado: 3610.55 },
  { period: 'M3', receitas_projetadas: 4950.00, opex: 0.00, cmv_insumos: 1042.45, capex: 0.00, taxas_comissoes: 574.20, saldo_projetado: 3941.91 },
  { period: 'M4', receitas_projetadas: 5005.00, opex: 954.00, cmv_insumos: 1054.03, capex: 1784.94, taxas_comissoes: 640.64, saldo_projetado: 4513.29 },
  { period: 'M5', receitas_projetadas: 5005.00, opex: 1024.00, cmv_insumos: 1054.03, capex: 1784.94, taxas_comissoes: 700.70, saldo_projetado: 4814.81 },
  { period: 'M6', receitas_projetadas: 9900.00, opex: 1024.00, cmv_insumos: 2084.90, capex: 4675.00, taxas_comissoes: 1504.80, saldo_projetado: 3641.17 },
  { period: 'M7', receitas_projetadas: 10010.00, opex: 1024.00, cmv_insumos: 2108.06, capex: 1784.94, taxas_comissoes: 1641.64, saldo_projetado: 7092.53 },
  { period: 'M8', receitas_projetadas: 14300.00, opex: 1024.00, cmv_insumos: 3011.52, capex: 4675.00, taxas_comissoes: 2345.20, saldo_projetado: 5883.76 },
  { period: 'M9', receitas_projetadas: 16500.00, opex: 1024.00, cmv_insumos: 3474.83, capex: 1784.94, taxas_comissoes: 2706.00, saldo_projetado: 4422.14 },
  { period: 'M10', receitas_projetadas: 18700.00, opex: 1054.00, cmv_insumos: 3938.14, capex: 1784.94, taxas_comissoes: 3066.80, saldo_projetado: 8976.63 },
  { period: 'M11', receitas_projetadas: 21450.00, opex: 1054.00, cmv_insumos: 4517.27, capex: 3552.04, taxas_comissoes: 3517.80, saldo_projetado: 7438.81 },
  { period: 'M12', receitas_projetadas: 24750.00, opex: 1054.00, cmv_insumos: 5212.24, capex: 0.00, taxas_comissoes: 3910.50, saldo_projetado: 6892.52 }
]

export default function ProjecaoCaixaPage() {
  const [projections, setProjections] = useState<ProjectedCashFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'fluxo' | 'capex' | 'opex' | 'cmv' | 'taxas'>('fluxo')

  // Form states para inserção manual
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

  // Função para popular automaticamente com os dados detalhados da planilha conservadora
  const handleSeedPlanilha = async () => {
    try {
      setLoading(true)
      for (const item of DADOS_CONSERVADORES_PLANILHA) {
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
      setSucessoMsg('Planilha conservadora detalhada sincronizada com sucesso no Supabase!')
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
    <main className="max-w-[98vw] mx-auto space-y-6 p-4 md:p-6 pb-20">
      
      {/* Header Executivo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-[#0b1426] p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
            Enterprise OS • Anexo A1: Demonstrativo Consolidado (Conservador)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Projeção Financeira de Longo Prazo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Gerenciamento completo das abas de CAPEX, OPEX, CMV, Taxas e Fluxo de Caixa Projetado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {projections.length === 0 && (
            <button
              onClick={handleSeedPlanilha}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-extrabold transition shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              📥 Sincronizar Planilha Detalhada
            </button>
          )}
          <Link
            href="/financeiro"
            className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold transition"
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

      {/* CARDS DE KPIS DA PLANILHA */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Faturamento Anual</span>
          <span className="text-lg sm:text-xl font-black text-amber-500 mt-1 block">R$ 135.520,00</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">12 Meses Projetados</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Custo Operacional Anual</span>
          <span className="text-lg sm:text-xl font-black text-rose-500 mt-1 block">R$ 58.681,18</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">OPEX + CMV</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Caixa Final Acumulado</span>
          <span className="text-lg sm:text-xl font-black text-cyan-500 mt-1 block">R$ 9.894,52</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Saldo Líquido</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Margem Operacional</span>
          <span className="text-lg sm:text-xl font-black text-emerald-500 mt-1 block">56,70%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Média Anual</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Break-Even Médio</span>
          <span className="text-lg sm:text-xl font-black text-purple-400 mt-1 block">217 un.</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Ponto de Equilíbrio</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Ticket Médio</span>
          <span className="text-lg sm:text-xl font-black text-blue-400 mt-1 block">R$ 55,00</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Por Venda</span>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO INTERNA (CAPEX, OPEX, CMV, TAXAS) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setAbaAtiva('fluxo')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'fluxo'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Fluxo de Caixa Projetado (M1-M12)
        </button>
        <button
          onClick={() => setAbaAtiva('capex')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'capex'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Aba CAPEX (Aquisição de Máquinas)
        </button>
        <button
          onClick={() => setAbaAtiva('opex')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'opex'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Aba OPEX (Custos Fixos)
        </button>
        <button
          onClick={() => setAbaAtiva('cmv')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'cmv'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Aba CMV & Insumos
        </button>
        <button
          onClick={() => setAbaAtiva('taxas')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'taxas'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Aba Taxas & Comissões
        </button>
      </div>

      {/* CONTEÚDO DA ABA ATIVA */}
      {abaAtiva === 'fluxo' && (
        <div className="space-y-6">
          
          {/* Formulário de Inserção Rápida */}
          <form onSubmit={handleAddProjection} className="bg-white dark:bg-[#0b1426] p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Período (Ex: M13)</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="M13"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Receitas Projetadas (R$)</label>
              <input
                type="number"
                step="0.01"
                value={receitasProjetadas}
                onChange={(e) => setReceitasProjetadas(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">OPEX (R$)</label>
              <input
                type="number"
                step="0.01"
                value={opex}
                onChange={(e) => setOpex(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">CMV / Insumos (R$)</label>
              <input
                type="number"
                step="0.01"
                value={cmvInsumos}
                onChange={(e) => setCmvInsumos(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">CAPEX (R$)</label>
              <input
                type="number"
                step="0.01"
                value={capex}
                onChange={(e) => setCapex(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Taxas & Comissões (R$)</label>
              <input
                type="number"
                step="0.01"
                value={taxasComissoes}
                onChange={(e) => setTaxasComissoes(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Saldo Projetado (R$)</label>
              <input
                type="number"
                step="0.01"
                value={saldoProjetado}
                onChange={(e) => setSaldoProjetado(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-emerald-500 font-black text-xs"
              />
            </div>
            <div className="md:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-2xl transition text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Adicionar Período no Sistema
              </button>
            </div>
          </form>

          {/* Tabela Consolidada Detalhada */}
          <div className="bg-white dark:bg-[#0b1426] rounded-3xl border border-slate-200/60 dark:border-white/10 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Registros Cadastrados no Banco Supabase</h3>
                <p className="text-xs text-slate-400 mt-0.5">Alimentado pelas abas operacionais do seu modelo conservador.</p>
              </div>
              {projections.length === 0 && (
                <button
                  onClick={handleSeedPlanilha}
                  className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
                >
                  Clique para preencher com a planilha detalhada
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                    <th className="p-4">Período</th>
                    <th className="p-4">Receitas</th>
                    <th className="p-4">OPEX</th>
                    <th className="p-4">CMV / Insumos</th>
                    <th className="p-4">CAPEX</th>
                    <th className="p-4">Taxas</th>
                    <th className="p-4">Saldo Projetado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">Carregando dados do Supabase...</td>
                    </tr>
                  ) : projections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Nenhum registro encontrado. Clique no botão superior <strong>"📥 Sincronizar Planilha Detalhada"</strong> para carregar tudo!
                      </td>
                    </tr>
                  ) : (
                    projections.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-4 font-extrabold text-slate-900 dark:text-white">{item.period}</td>
                        <td className="p-4 text-emerald-500 font-bold">R$ {Number(item.receitas_projetadas).toFixed(2)}</td>
                        <td className="p-4 text-rose-500">R$ {Number(item.opex).toFixed(2)}</td>
                        <td className="p-4 text-amber-500">R$ {Number(item.cmv_insumos).toFixed(2)}</td>
                        <td className="p-4">R$ {Number(item.capex).toFixed(2)}</td>
                        <td className="p-4">R$ {Number(item.taxas_comissoes).toFixed(2)}</td>
                        <td className="p-4 font-black text-cyan-400 text-sm">R$ {Number(item.saldo_projetado).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {abaAtiva === 'capex' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Aba CAPEX - Aquisição de Máquinas & Investimento Inicial</h3>
          <p className="text-xs text-slate-400">Gerenciamento dos aportes em maquinário (Ex: Impressoras 3D A1 nos meses M4, M6, M8, M10 e M11 conforme sua planilha).</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p><strong>Total Investido em CAPEX (12 Meses):</strong> R$ 13.202,49</p>
            <p><strong>Aquisições programadas:</strong> M4 (R$ 1.784,94), M6 (R$ 4.675,00), M8 (R$ 4.675,00), M10 (R$ 1.784,94), M11 (R$ 3.552,04).</p>
          </div>
        </div>
      )}

      {abaAtiva === 'opex' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Aba OPEX - Custos Operacionais Fixos Reajustados</h3>
          <p className="text-xs text-slate-400">Controle das despesas fixas recorrentes da Print Farm (aluguel, internet, sistemas, manutenção geral).</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p><strong>OPEX Fixo Anual:</strong> R$ 9.236,00</p>
            <p><strong>Média Mensal:</strong> R$ 1.024,00 a R$ 1.054,00</p>
          </div>
        </div>
      )}

      {abaAtiva === 'cmv' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Aba CMV & Insumos (~22%)</h3>
          <p className="text-xs text-slate-400">Custo de Mercadoria Vendida voltado ao consumo de filamentos PLA/ABS, energia elétrica por hora de impressão e desgaste de bicos.</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p><strong>Total CMV Anual:</strong> R$ 28.539,90</p>
            <p>Escala diretamente conforme o aumento do volume de filamento consumido e horas de máquina do parque.</p>
          </div>
        </div>
      )}

      {abaAtiva === 'taxas' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Aba Taxas & Comissões de Venda</h3>
          <p className="text-xs text-slate-400">Descontos de gateways de pagamento, taxas de marketplaces (Shopee/ML) e comissões de canais de venda.</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p><strong>Total de Taxas Anual:</strong> R$ 20.905,28</p>
            <p>Variável conforme o mix de vendas (Marketplace vs Vendas Diretas B2C/B2B).</p>
          </div>
        </div>
      )}

    </main>
  )
}