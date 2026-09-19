'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { TrendingUp, Layers, Cpu, ShieldCheck, DollarSign, Save, RefreshCw } from 'lucide-react'

type ProjectionRow = {
  id?: string
  period: string
  // Parâmetros e Operação
  parque_maquinas: string
  dias_uteis: number
  horas_mes_maquina: number
  qtd_hora_mes_maquinas: number
  modelo_1_80g_4h: number
  volume_pedidos_lotes_dia: number
  volume_filamento_kg: number
  percentual_operacao_maquina: number
  pedidos_atendidos: number
  percentual_vendas_marketplace: number
  percentual_vendas_diretas: number
  // Receitas
  faturamento_bruto: number
  vendas_marketplaces: number
  vendas_diretas_b2c: number
  vendas_b2b_contratos: number
  // Deduções, CMV e Custos
  impostos_faturamento: number
  taxas_comissoes: number
  cmv_insumos_pla: number
  cpv_custo_unitario_producao: number
  cut_custo_unitario_total: number
  markup_percentual: number
  margem_contribuicao: number
  energia_eletrica: number
  manutencao_maquinas: number
  // Custos Fixos / OPEX
  opex_aluguel: number
  opex_softwares_assinaturas: number
  opex_pro_labore: number
  opex_marketing_anuncios: number
  opex_contabilidade_administrativo: number
  total_opex: number
  // Resultados e Fluxo
  lucro_operacional: number
  break_even_mensal: number
  reserva_3m_opex: number
  amortizacao_emprestimo: number
  capex_aquisicao_maquinas: number
  fluxo_caixa_livre: number
  pro_labore_socios: number
  distribuicao_lucros: number
  caixa_acumulado_final: number
}

const DADOS_INICIAIS: ProjectionRow[] = [
  { period: 'M1', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 300, qtd_hora_mes_maquinas: 364, modelo_1_80g_4h: 120, volume_pedidos_lotes_dia: 1, volume_filamento_kg: 2.40, percentual_operacao_maquina: 32.97, pedidos_atendidos: 30, percentual_vendas_marketplace: 0.00, percentual_vendas_diretas: 100.00, faturamento_bruto: 1650.00, vendas_marketplaces: 0.00, vendas_diretas_b2c: 1650.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 0.00, taxas_comissoes: 33.00, cmv_insumos_pla: 347.48, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 12.68, markup_percentual: 374.84, margem_contribuicao: 1269.52, energia_eletrica: 35.48, manutencao_maquinas: 12.00, opex_aluguel: 0.00, opex_softwares_assinaturas: 0.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 0.00, opex_contabilidade_administrativo: 0.00, total_opex: 0.00, lucro_operacional: 1269.52, break_even_mensal: 0, reserva_3m_opex: 0.00, amortizacao_emprestimo: 0.00, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 1269.52, pro_labore_socios: 0.00, distribuicao_lucros: 0.00, caixa_acumulado_final: 1269.52 },
  { period: 'M2', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 350, qtd_hora_mes_maquinas: 364, modelo_1_80g_4h: 240, volume_pedidos_lotes_dia: 2, volume_filamento_kg: 4.80, percentual_operacao_maquina: 65.93, pedidos_atendidos: 60, percentual_vendas_marketplace: 0.00, percentual_vendas_diretas: 100.00, faturamento_bruto: 3300.00, vendas_marketplaces: 0.00, vendas_diretas_b2c: 3300.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 0.00, taxas_comissoes: 264.00, cmv_insumos_pla: 694.97, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 15.98, markup_percentual: 374.84, margem_contribuicao: 2341.04, energia_eletrica: 70.97, manutencao_maquinas: 24.00, opex_aluguel: 0.00, opex_softwares_assinaturas: 0.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 0.00, opex_contabilidade_administrativo: 0.00, total_opex: 0.00, lucro_operacional: 2341.04, break_even_mensal: 0, reserva_3m_opex: 0.00, amortizacao_emprestimo: 0.00, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 2341.04, pro_labore_socios: 0.00, distribuicao_lucros: 0.00, caixa_acumulado_final: 3610.55 },
  { period: 'M3', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 400, qtd_hora_mes_maquinas: 364, modelo_1_80g_4h: 360, volume_pedidos_lotes_dia: 3, volume_filamento_kg: 7.20, percentual_operacao_maquina: 98.90, pedidos_atendidos: 90, percentual_vendas_marketplace: 30.00, percentual_vendas_diretas: 70.00, faturamento_bruto: 4950.00, vendas_marketplaces: 1485.00, vendas_diretas_b2c: 3465.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 0.00, taxas_comissoes: 574.20, cmv_insumos_pla: 1042.45, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 17.96, markup_percentual: 374.84, margem_contribuicao: 3333.35, energia_eletrica: 106.45, manutencao_maquinas: 36.00, opex_aluguel: 0.00, opex_softwares_assinaturas: 0.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 0.00, opex_contabilidade_administrativo: 0.00, total_opex: 0.00, lucro_operacional: 3333.35, break_even_mensal: 0, reserva_3m_opex: -3002.00, amortizacao_emprestimo: 0.00, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 3333.35, pro_labore_socios: 0.00, distribuicao_lucros: 0.00, caixa_acumulado_final: 3941.91 },
  { period: 'M4', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 400, qtd_hora_mes_maquinas: 364, modelo_1_80g_4h: 360, volume_pedidos_lotes_dia: 3, volume_filamento_kg: 9.60, percentual_operacao_maquina: 100.00, pedidos_atendidos: 91, percentual_vendas_marketplace: 40.00, percentual_vendas_diretas: 60.00, faturamento_bruto: 5005.00, vendas_marketplaces: 2002.00, vendas_diretas_b2c: 3003.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 200.00, taxas_comissoes: 640.64, cmv_insumos_pla: 1054.03, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 18.62, markup_percentual: 374.84, margem_contribuicao: 3310.33, energia_eletrica: 106.45, manutencao_maquinas: 47.58, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 2356.33, break_even_mensal: 22, reserva_3m_opex: 0.00, amortizacao_emprestimo: 1784.94, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 571.39, pro_labore_socios: 139.81, distribuicao_lucros: 46.60, caixa_acumulado_final: 4513.29 },
  { period: 'M5', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 400, qtd_hora_mes_maquinas: 364, modelo_1_80g_4h: 360, volume_pedidos_lotes_dia: 3, volume_filamento_kg: 12.00, percentual_operacao_maquina: 100.00, pedidos_atendidos: 91, percentual_vendas_marketplace: 50.00, percentual_vendas_diretas: 50.00, faturamento_bruto: 5005.00, vendas_marketplaces: 2502.50, vendas_diretas_b2c: 2502.50, vendas_b2b_contratos: 0.00, impostos_faturamento: 200.00, taxas_comissoes: 700.70, cmv_insumos_pla: 1054.03, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 19.28, markup_percentual: 374.84, margem_contribuicao: 3250.27, energia_eletrica: 106.45, manutencao_maquinas: 47.58, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 2226.27, break_even_mensal: 24, reserva_3m_opex: 0.00, amortizacao_emprestimo: 1784.94, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 441.33, pro_labore_socios: 139.81, distribuicao_lucros: 46.60, caixa_acumulado_final: 4814.81 },
  { period: 'M6', parque_maquinas: '2 A1', dias_uteis: 22, horas_mes_maquina: 700, qtd_hora_mes_maquinas: 728, modelo_1_80g_4h: 720, volume_pedidos_lotes_dia: 6, volume_filamento_kg: 14.40, percentual_operacao_maquina: 98.90, pedidos_atendidos: 180, percentual_vendas_marketplace: 60.00, percentual_vendas_diretas: 40.00, faturamento_bruto: 9900.00, vendas_marketplaces: 5940.00, vendas_diretas_b2c: 3960.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 396.00, taxas_comissoes: 1504.80, cmv_insumos_pla: 2084.90, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 19.94, markup_percentual: 374.84, margem_contribuicao: 6310.31, energia_eletrica: 210.00, manutencao_maquinas: 124.90, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 5286.31, break_even_mensal: 24, reserva_3m_opex: 0.00, amortizacao_emprestimo: 1784.94, capex_aquisicao_maquinas: 4675.00, fluxo_caixa_livre: 611.31, pro_labore_socios: 1208.76, distribuicao_lucros: 402.92, caixa_acumulado_final: 3641.17 },
  { period: 'M7', parque_maquinas: '2 A1', dias_uteis: 22, horas_mes_maquina: 700, qtd_hora_mes_maquinas: 728, modelo_1_80g_4h: 728, volume_pedidos_lotes_dia: 6, volume_filamento_kg: 17.60, percentual_operacao_maquina: 100.00, pedidos_atendidos: 182, percentual_vendas_marketplace: 70.00, percentual_vendas_diretas: 30.00, faturamento_bruto: 10010.00, vendas_marketplaces: 7007.00, vendas_diretas_b2c: 3003.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 400.40, taxas_comissoes: 1641.64, cmv_insumos_pla: 2108.06, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 20.60, markup_percentual: 374.84, margem_contribuicao: 6260.30, energia_eletrica: 210.00, manutencao_maquinas: 148.06, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 5236.30, break_even_mensal: 24, reserva_3m_opex: 0.00, amortizacao_emprestimo: 1784.94, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 3451.36, pro_labore_socios: 1334.05, distribuicao_lucros: 444.68, caixa_acumulado_final: 5883.76 },
  { period: 'M8', parque_maquinas: '3 A1', dias_uteis: 22, horas_mes_maquina: 1050, qtd_hora_mes_maquinas: 1092, modelo_1_80g_4h: 1040, volume_pedidos_lotes_dia: 9, volume_filamento_kg: 20.80, percentual_operacao_maquina: 95.24, pedidos_atendidos: 260, percentual_vendas_marketplace: 70.00, percentual_vendas_diretas: 30.00, faturamento_bruto: 14300.00, vendas_marketplaces: 10010.00, vendas_diretas_b2c: 4290.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 572.00, taxas_comissoes: 2345.20, cmv_insumos_pla: 3011.52, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 20.60, markup_percentual: 374.84, margem_contribuicao: 8943.29, energia_eletrica: 315.00, manutencao_maquinas: 196.52, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 7919.29, break_even_mensal: 24, reserva_3m_opex: 0.00, amortizacao_emprestimo: 1784.94, capex_aquisicao_maquinas: 4675.00, fluxo_caixa_livre: 3244.29, pro_labore_socios: 4422.14, distribuicao_lucros: 1474.05, caixa_acumulado_final: 6009.05 },
  { period: 'M9', parque_maquinas: '4 A1', dias_uteis: 22, horas_mes_maquina: 1300, qtd_hora_mes_maquinas: 1456, modelo_1_80g_4h: 1200, volume_pedidos_lotes_dia: 10, volume_filamento_kg: 24.00, percentual_operacao_maquina: 82.42, pedidos_atendidos: 300, percentual_vendas_marketplace: 70.00, percentual_vendas_diretas: 30.00, faturamento_bruto: 16500.00, vendas_marketplaces: 11550.00, vendas_diretas_b2c: 4950.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 660.00, taxas_comissoes: 2706.00, cmv_insumos_pla: 3474.83, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 20.60, markup_percentual: 374.84, margem_contribuicao: 10319.18, energia_eletrica: 390.00, manutencao_maquinas: 184.83, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 9295.18, break_even_mensal: 24, reserva_3m_opex: 0.00, amortizacao_emprestimo: 1784.94, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 7510.24, pro_labore_socios: 4301.63, distribuicao_lucros: 1433.88, caixa_acumulado_final: 4422.14 },
  { period: 'M10', parque_maquinas: '4 A1', dias_uteis: 22, horas_mes_maquina: 1350, qtd_hora_mes_maquinas: 1456, modelo_1_80g_4h: 1360, volume_pedidos_lotes_dia: 11, volume_filamento_kg: 27.20, percentual_operacao_maquina: 93.41, pedidos_atendidos: 340, percentual_vendas_marketplace: 70.00, percentual_vendas_diretas: 30.00, faturamento_bruto: 18700.00, vendas_marketplaces: 13090.00, vendas_diretas_b2c: 5610.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 748.00, taxas_comissoes: 3066.80, cmv_insumos_pla: 3938.14, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 20.60, markup_percentual: 374.84, margem_contribuicao: 11695.07, energia_eletrica: 405.00, manutencao_maquinas: 333.14, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 100.00, total_opex: 1054.00, lucro_operacional: 10641.07, break_even_mensal: 25, reserva_3m_opex: 0.00, amortizacao_emprestimo: 1784.94, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 8856.13, pro_labore_socios: 7438.81, distribuicao_lucros: 2479.60, caixa_acumulado_final: 8976.63 },
  { period: 'M11', parque_maquinas: '5 A1', dias_uteis: 22, horas_mes_maquina: 1600, qtd_hora_mes_maquinas: 1820, modelo_1_80g_4h: 1560, volume_pedidos_lotes_dia: 13, volume_filamento_kg: 31.20, percentual_operacao_maquina: 85.71, pedidos_atendidos: 390, percentual_vendas_marketplace: 65.00, percentual_vendas_diretas: 35.00, faturamento_bruto: 21450.00, vendas_marketplaces: 13942.50, vendas_diretas_b2c: 7507.50, vendas_b2b_contratos: 0.00, impostos_faturamento: 858.00, taxas_comissoes: 3517.80, cmv_insumos_pla: 4517.27, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 20.60, markup_percentual: 374.84, margem_contribuicao: 13414.93, energia_eletrica: 480.00, manutencao_maquinas: 237.27, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 100.00, total_opex: 1054.00, lucro_operacional: 12360.93, break_even_mensal: 25, reserva_3m_opex: 0.00, amortizacao_emprestimo: 3552.04, capex_aquisicao_maquinas: 4675.00, fluxo_caixa_livre: 8808.89, pro_labore_socios: 6892.52, distribuicao_lucros: 2297.51, caixa_acumulado_final: 7438.81 },
  { period: 'M12', parque_maquinas: '6 A1', dias_uteis: 22, horas_mes_maquina: 1800, qtd_hora_mes_maquinas: 2184, modelo_1_80g_4h: 1800, volume_pedidos_lotes_dia: 15, volume_filamento_kg: 36.00, percentual_operacao_maquina: 82.42, pedidos_atendidos: 450, percentual_vendas_marketplace: 65.00, percentual_vendas_diretas: 35.00, faturamento_bruto: 24750.00, vendas_marketplaces: 16087.50, vendas_diretas_b2c: 8662.50, vendas_b2b_contratos: 0.00, impostos_faturamento: 990.00, taxas_comissoes: 3910.50, cmv_insumos_pla: 5212.24, cpv_custo_unitario_producao: 11.58, cut_custo_unitario_total: 20.27, markup_percentual: 374.84, margem_contribuicao: 15627.26, energia_eletrica: 540.00, manutencao_maquinas: 372.24, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 100.00, total_opex: 1054.00, lucro_operacional: 14573.26, break_even_mensal: 25, reserva_3m_opex: 0.00, amortizacao_emprestimo: 0.00, capex_aquisicao_maquinas: 4675.00, fluxo_caixa_livre: 14573.26, pro_labore_socios: 0.00, distribuicao_lucros: 0.00, caixa_acumulado_final: 6892.52 }
]

const formatarMoeda = (valor: number) => {
  if (isNaN(valor)) return '0,00'
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ProjecaoCaixaPage() {
  const [registros, setRegistros] = useState<ProjectionRow[]>(DADOS_INICIAIS)
  const [loading, setLoading] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'fluxo' | 'capex' | 'opex' | 'cmv' | 'taxas'>('fluxo')

  useEffect(() => {
    carregarDadosSupabase()
  }, [])

  const carregarDadosSupabase = async () => {
    try {
      const { data } = await supabase.from('projected_cash_flow_conservador').select('*')
      if (data && data.length > 0) {
        const ordenado = data.sort((a, b) => parseInt(a.period.replace('M', '')) - parseInt(b.period.replace('M', '')))
        setRegistros(ordenado)
      }
    } catch (err) {
      console.error('Erro ao buscar do Supabase:', err)
    }
  }

  const handleCellChange = (period: string, field: keyof ProjectionRow, value: string) => {
    const numValue = (field === 'parque_maquinas') ? value : parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
    
    setRegistros(prev => {
      const updated = prev.map(item => {
        if (item.period === period) {
          const newItem = { ...item, [field]: numValue }
          newItem.total_opex = Number((newItem.opex_aluguel + newItem.opex_softwares_assinaturas + newItem.opex_pro_labore + newItem.opex_marketing_anuncios + newItem.opex_contabilidade_administrativo).toFixed(2))
          const deducoesECustos = newItem.impostos_faturamento + newItem.taxas_comissoes + newItem.cmv_insumos_pla + newItem.energia_eletrica + newItem.manutencao_maquinas + newItem.total_opex
          newItem.lucro_operacional = Number((newItem.faturamento_bruto - deducoesECustos).toFixed(2))
          newItem.margem_contribuicao = Number((newItem.faturamento_bruto - (newItem.impostos_faturamento + newItem.taxas_comissoes + newItem.cmv_insumos_pla + newItem.energia_eletrica + newItem.manutencao_maquinas)).toFixed(2))
          newItem.fluxo_caixa_livre = Number((newItem.lucro_operacional - newItem.capex_aquisicao_maquinas - newItem.amortizacao_emprestimo).toFixed(2))
          return newItem
        }
        return item
      })

      return updated.map((item, idx) => {
        const realAcumulado = idx === 0 
          ? item.fluxo_caixa_livre 
          : updated.slice(0, idx + 1).reduce((acc, curr) => acc + curr.fluxo_caixa_livre - (curr.pro_labore_socios || 0) - (curr.distribuicao_lucros || 0), 0)
        return { ...item, caixa_acumulado_final: Number(realAcumulado.toFixed(2)) }
      })
    })
  }

  const handleSalvarNoSupabase = async () => {
    try {
      setLoading(true)
      for (const item of registros) {
        const dadosParaSalvar = { ...item }
        if (dadosParaSalvar.id && !dadosParaSalvar.id.includes('-')) delete dadosParaSalvar.id
        const { error } = await supabase.from('projected_cash_flow_conservador').upsert([dadosParaSalvar], { onConflict: 'period' })
        if (error) throw error
      }
      setSucessoMsg('Matriz completa sincronizada com sucesso no Supabase!')
      setTimeout(() => setSucessoMsg(''), 4000)
      carregarDadosSupabase()
    } catch (err: any) {
      alert('Erro ao salvar no Supabase: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalFaturamento = registros.reduce((acc, curr) => acc + Number(curr.faturamento_bruto), 0)
  const totalCustoOp = registros.reduce((acc, curr) => acc + Number(curr.cmv_insumos_pla) + Number(curr.total_opex) + Number(curr.taxas_comissoes) + Number(curr.impostos_faturamento), 0)
  const caixaFinal = registros[registros.length - 1]?.caixa_acumulado_final || 0
  const totalCapex = registros.reduce((acc, curr) => acc + Number(curr.capex_aquisicao_maquinas), 0)
  const ticketMedio = 55.00

  return (
    <main className="max-w-[98vw] mx-auto space-y-6 p-4 md:p-6 pb-20 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-[#0b1426] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
            Enterprise OS • Matriz Completa de Execução Mensal (Conservador)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Projeção Financeira de Longo Prazo (M1 - M12)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-semibold">
            Todas as subcontas do fluxo de caixa original ativadas, com formatação monetária 0.000,00 e tipografia ampliada.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSalvarNoSupabase}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-extrabold transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Sincronizando...' : 'Salvar no Supabase'}
          </button>
          <Link
            href="/financeiro"
            className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-extrabold transition border border-slate-300 dark:border-slate-700"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-fade-in">
          {sucessoMsg}
        </div>
      )}

      {/* KPIS DO TOPO (Espelhando o Anexo A1) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Faturamento Anual</span>
          <span className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400 mt-1 block">R$ {formatarMoeda(totalFaturamento)}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">12 Meses Projetados</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Custo Operacional</span>
          <span className="text-xl sm:text-2xl font-black text-rose-500 dark:text-rose-400 mt-1 block">R$ {formatarMoeda(totalCustoOp)}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">CMV + OPEX + Impostos</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Caixa Final Acumulado</span>
          <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1 block">R$ {formatarMoeda(caixaFinal)}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">Saldo Líquido M12</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Margem Operacional</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">56,70%</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">Média Anual</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Ponto de Equilíbrio</span>
          <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">217</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">Média Anual</span>
        </div>
        <div className="bg-amber-400 dark:bg-amber-500 p-5 rounded-3xl shadow-lg text-slate-950">
          <span className="text-xs font-black uppercase tracking-wider block opacity-80">Ticket Médio</span>
          <span className="text-xl sm:text-2xl font-black mt-1 block">R$ {formatarMoeda(ticketMedio)}</span>
          <span className="text-xs mt-0.5 block opacity-80">Valor Unitário Base</span>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button onClick={() => setAbaAtiva('fluxo')} className={`px-4 py-3 rounded-2xl text-sm font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'fluxo' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
          <TrendingUp className="w-5 h-5" /> Matriz Completa de Execução Mensal (M1-M12)
        </button>
        <button onClick={() => setAbaAtiva('capex')} className={`px-4 py-3 rounded-2xl text-sm font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'capex' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
          <Cpu className="w-5 h-5" /> Aba CAPEX
        </button>
        <button onClick={() => setAbaAtiva('opex')} className={`px-4 py-3 rounded-2xl text-sm font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'opex' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
          <Layers className="w-5 h-5" /> Aba OPEX
        </button>
        <button onClick={() => setAbaAtiva('cmv')} className={`px-4 py-3 rounded-2xl text-sm font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'cmv' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
          <DollarSign className="w-5 h-5" /> Aba CMV & Insumos
        </button>
        <button onClick={() => setAbaAtiva('taxas')} className={`px-4 py-3 rounded-2xl text-sm font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'taxas' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
          <ShieldCheck className="w-5 h-5" /> Aba Taxas & Impostos
        </button>
      </div>

      {/* CONTEÚDO DA ABA ATIVA: MATRIZ COMPLETA COM FONTES AMPLIADAS */}
      {abaAtiva === 'fluxo' && (
        <div className="bg-white dark:bg-[#0b1426] rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Demonstrativo Financeiro Consolidado Completo</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Todos os campos editáveis. Formato monetário 0.000,00.</p>
            </div>
            <button onClick={carregarDadosSupabase} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-2 transition border border-slate-300 dark:border-slate-700 cursor-pointer">
              <RefreshCw className="w-4 h-4" /> Atualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 min-w-[280px]">Métrica / Mês (R$)</th>
                  {registros.map(item => <th key={item.period} className="p-4 text-center min-w-[130px]">{item.period}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                
                {/* 1. PARÂMETROS */}
                <tr className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold"><td colSpan={13} className="p-3 uppercase text-xs tracking-wider">1. Parâmetros de Operação & Capacidade</td></tr>
                <tr>
                  <td className="p-4 font-bold">Parque de Máquinas</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={item.parque_maquinas} onChange={e => handleCellChange(item.period, 'parque_maquinas', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-cyan-600 dark:text-cyan-300 font-bold" /></td>)}
                </tr>
                <tr>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Qtd Hora/mes-máquina(s)</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="number" value={item.qtd_hora_mes_maquinas} onChange={e => handleCellChange(item.period, 'qtd_hora_mes_maquinas', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}
                </tr>
                <tr>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Modelo 1 - 80g / 4h</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="number" value={item.modelo_1_80g_4h} onChange={e => handleCellChange(item.period, 'modelo_1_80g_4h', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}
                </tr>
                <tr>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Volume de Pedidos (Lotes/Dia)</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="number" value={item.volume_pedidos_lotes_dia} onChange={e => handleCellChange(item.period, 'volume_pedidos_lotes_dia', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}
                </tr>
                <tr>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Volume Filamento (kg)</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.volume_filamento_kg)} onChange={e => handleCellChange(item.period, 'volume_filamento_kg', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}
                </tr>
                <tr>
                  <td className="p-4 text-slate-600 dark:text-slate-300">% Operação Máquina</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.percentual_operacao_maquina)} onChange={e => handleCellChange(item.period, 'percentual_operacao_maquina', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}
                </tr>
                <tr>
                  <td className="p-4 text-slate-600 dark:text-slate-300">Pedidos Atendidos (Cap. Máxima)</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="number" value={item.pedidos_atendidos} onChange={e => handleCellChange(item.period, 'pedidos_atendidos', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}
                </tr>
                <tr>
                  <td className="p-4 text-slate-600 dark:text-slate-300">% Vendas Marketplace (Shopee/ML)</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.percentual_vendas_marketplace)} onChange={e => handleCellChange(item.period, 'percentual_vendas_marketplace', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}
                </tr>
                <tr>
                  <td className="p-4 text-slate-600 dark:text-slate-300">% Vendas Diretas B2C/B2B</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.percentual_vendas_diretas)} onChange={e => handleCellChange(item.period, 'percentual_vendas_diretas', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}
                </tr>

                {/* 2. RECEITAS */}
                <tr className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"><td colSpan={13} className="p-3 uppercase text-xs tracking-wider">2. Receitas & Faturamento Bruto</td></tr>
                <tr className="bg-amber-500/5 font-extrabold text-amber-600 dark:text-amber-300">
                  <td className="p-4">(=) Faturamento Bruto</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.faturamento_bruto)} onChange={e => handleCellChange(item.period, 'faturamento_bruto', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-amber-500/50 rounded-lg p-2 font-bold" /></td>)}
                </tr>
                <tr><td className="p-4 pl-6 text-slate-500">↳ Vendas Marketplace</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.vendas_marketplaces)} onChange={e => handleCellChange(item.period, 'vendas_marketplaces', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 pl-6 text-slate-500">↳ Vendas Diretas B2C/B2B</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.vendas_diretas_b2c)} onChange={e => handleCellChange(item.period, 'vendas_diretas_b2c', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>

                {/* 3. DEDUÇÕES, CMV & CUSTOS */}
                <tr className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"><td colSpan={13} className="p-3 uppercase text-xs tracking-wider">3. Deduções, CMV, CPV & Insumos</td></tr>
                <tr><td className="p-4 text-rose-600 dark:text-rose-300">(-) CMV e Insumos (~22%)</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.cmv_insumos_pla)} onChange={e => handleCellChange(item.period, 'cmv_insumos_pla', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 text-rose-600 dark:text-rose-300">(-) Taxas & Comissões</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.taxas_comissoes)} onChange={e => handleCellChange(item.period, 'taxas_comissoes', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 text-slate-500">CPV - Custo Unitário de Produção</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.cpv_custo_unitario_producao)} onChange={e => handleCellChange(item.period, 'cpv_custo_unitario_producao', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 text-slate-500">CUT - Custo Unitário Total</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.cut_custo_unitario_total)} onChange={e => handleCellChange(item.period, 'cut_custo_unitario_total', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 text-slate-500">% Markup</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.markup_percentual)} onChange={e => handleCellChange(item.period, 'markup_percentual', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr className="bg-emerald-500/5 font-bold">
                  <td className="p-4 text-emerald-600 dark:text-emerald-400">(=) Margem Contribuição</td>
                  {registros.map(item => <td key={item.period} className="p-4 text-center">R$ {formatarMoeda(item.margem_contribuicao)}</td>)}
                </tr>
                <tr><td className="p-4 text-rose-600 dark:text-rose-300">(-) Energia Elétrica (Máquinas)</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.energia_eletrica)} onChange={e => handleCellChange(item.period, 'energia_eletrica', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 text-rose-600 dark:text-rose-300">(-) Manutenção Preventiva / Desgaste</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.manutencao_maquinas)} onChange={e => handleCellChange(item.period, 'manutencao_maquinas', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>

                {/* 4. OPEX */}
                <tr className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"><td colSpan={13} className="p-3 uppercase text-xs tracking-wider">4. Custos Fixos Operacionais (OPEX)</td></tr>
                <tr><td className="p-4 pl-6 text-slate-500">↳ Aluguel / Espaço Físico</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_aluguel)} onChange={e => handleCellChange(item.period, 'opex_aluguel', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 pl-6 text-slate-500">↳ Softwares & Assinaturas</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_softwares_assinaturas)} onChange={e => handleCellChange(item.period, 'opex_softwares_assinaturas', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 pl-6 text-slate-500">↳ Marketing & Anúncios</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_marketing_anuncios)} onChange={e => handleCellChange(item.period, 'opex_marketing_anuncios', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 pl-6 text-slate-500">↳ Contabilidade & Admin</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_contabilidade_administrativo)} onChange={e => handleCellChange(item.period, 'opex_contabilidade_administrativo', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr className="bg-slate-100 dark:bg-slate-800/45 font-bold">
                  <td className="p-4">(=) OPEX Fixo Reajustado</td>
                  {registros.map(item => <td key={item.period} className="p-4 text-center">R$ {formatarMoeda(item.total_opex)}</td>)}
                </tr>

                {/* 5. RESULTADOS E CAIXA */}
                <tr className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"><td colSpan={13} className="p-3 uppercase text-xs tracking-wider">5. Resultados, Empréstimo, CAPEX & Caixa Final</td></tr>
                <tr className="bg-emerald-500/10 font-black text-emerald-600 dark:text-emerald-400">
                  <td className="p-4">(=) Lucro Operacional</td>
                  {registros.map(item => <td key={item.period} className="p-4 text-center">R$ {formatarMoeda(item.lucro_operacional)}</td>)}
                </tr>
                <tr><td className="p-4 text-slate-500">Break-Even Mensal</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="number" value={item.break_even_mensal} onChange={e => handleCellChange(item.period, 'break_even_mensal', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 text-slate-500">Reserva (3 Meses OPEX)</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.reserva_3m_opex)} onChange={e => handleCellChange(item.period, 'reserva_3m_opex', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 text-slate-500">(-) Amortização do Empréstimo</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.amortizacao_emprestimo)} onChange={e => handleCellChange(item.period, 'amortizacao_emprestimo', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr>
                  <td className="p-4 text-purple-600 dark:text-purple-400 font-bold">(-) Aquisição de Maquinário (CAPEX)</td>
                  {registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.capex_aquisicao_maquinas)} onChange={e => handleCellChange(item.period, 'capex_aquisicao_maquinas', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-purple-500/40 rounded-lg p-2 font-bold" /></td>)}
                </tr>
                <tr><td className="p-4 text-slate-500">(-) Pró-Labore (Sócios)</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.pro_labore_socios)} onChange={e => handleCellChange(item.period, 'pro_labore_socios', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr><td className="p-4 text-slate-500">(-) Distribuição de Lucros - 3 Sócios</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.distribuicao_lucros)} onChange={e => handleCellChange(item.period, 'distribuicao_lucros', e.target.value)} className="w-full text-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2" /></td>)}</tr>
                <tr className="bg-cyan-500/20 font-black text-cyan-700 dark:text-cyan-300 text-base">
                  <td className="p-4">(=) CAIXA ACUMULADO FINAL</td>
                  {registros.map(item => <td key={item.period} className="p-4 text-center">R$ {formatarMoeda(item.caixa_acumulado_final)}</td>)}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OUTRAS ABAS ESPECÍFICAS EDITÁVEIS */}
      {abaAtiva === 'capex' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-xl font-black">Planilha de Controle CAPEX (Aquisições de Máquinas)</h3>
          <p className="text-sm text-slate-500">Gerenciamento direto dos investimentos em hardware e expansão do parque produtivo.</p>
          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 font-bold">
                  <th className="p-3">Período</th>
                  <th className="p-3">Descrição do Equipamento</th>
                  <th className="p-3 text-center">Valor Investido (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {registros.filter(r => r.capex_aquisicao_maquinas > 0).map(r => (
                  <tr key={r.period}>
                    <td className="p-3 font-bold text-cyan-500">{r.period}</td>
                    <td className="p-3">Expansão Parque de Máquinas ({r.parque_maquinas})</td>
                    <td className="p-3 text-center font-bold">R$ {formatarMoeda(r.capex_aquisicao_maquinas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 'opex' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-xl font-black">Planilha de Controle OPEX (Custos Fixos)</h3>
          <p className="text-sm text-slate-500">Detalhamento mensal de aluguel, assinaturas, marketing e contabilidade.</p>
        </div>
      )}

      {abaAtiva === 'cmv' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-xl font-black">Planilha de CMV & Insumos (Matéria-prima e Energia)</h3>
          <p className="text-sm text-slate-500">Monitoramento do consumo de filamento PLA e custos unitários de produção (CPV/CUT).</p>
        </div>
      )}

      {abaAtiva === 'taxas' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-xl font-black">Planilha de Taxas & Impostos sobre Faturamento</h3>
          <p className="text-sm text-slate-500">Gestão das alíquotas tributárias e taxas de comissões de marketplaces.</p>
        </div>
      )}

    </main>
  )
}