'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function VendasPage() {
  const [cliente, setCliente] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [valorUnitario, setValorUnitario] = useState(0)
  const [descontoPercentual, setDescontoPercentual] = useState(0)
  const [formaPagamento, setFormaPagamento] = useState('pix')
  
  const [itensPedido, setItensPedido] = useState<any[]>([])
  const [produtosCatalogo, setProdutosCatalogo] = useState<any[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [salvandoVenda, setSalvandoVenda] = useState(false)

  const [vendasRecentes, setVendasRecentes] = useState<any[]>([])

  useEffect(() => {
    fetchProdutos()
    fetchSales()
  }, [])

  async function fetchSales() {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('id', { ascending: false })

      if (error) {
        console.warn('Tabela sales não encontrada ou sem permissão RLS. Mantendo estado atual.')
        return
      }

      if (data && data.length > 0) {
        const vendasMapeadas = data.map((v: any) => ({
          id: v.id,
          numeroPedido: v.numero_pedido || v.numeroPedido || `PED-${v.id}`,
          cliente: v.cliente || '',
          produto: v.produto || '',
          qtd: Number(v.qtd) || 0,
          total: Number(v.total) || 0,
          pagamento: v.pagamento || '',
          status: v.status || '',
          data: v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR') : (v.data || ''),
          hora: v.created_at ? new Date(v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (v.hora || ''),
          emProducao: typeof v.em_producao === 'boolean' ? v.em_producao : (v.emProducao || false),
          filaIniciada: typeof v.fila_iniciada === 'boolean' ? v.fila_iniciada : (v.filaIniciada || false)
        }))
        setVendasRecentes(vendasMapeadas)
      }
    } catch (err: any) {
      console.warn('Exceção ao buscar vendas:', err.message || err)
    }
  }

  async function fetchProdutos() {
    try {
      setLoadingProdutos(true)
      const { data, error } = await supabase
        .from('products_3d')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setProdutosCatalogo(data)
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
    } finally {
      setLoadingProdutos(false)
    }
  }

  const handleDeletarVenda = async (id: number, numeroPedido: string) => {
    if (!confirm(`Tem certeza que deseja apagar o registro da venda ${numeroPedido}?`)) return

    try {
      await supabase.from('sales').delete().eq('id', id)
      if (numeroPedido) {
        await supabase.from('financial_transactions').delete().ilike('description', `%${numeroPedido}%`)
      }
    } catch (err) {
      console.warn('Erro ao deletar do Supabase:', err)
    } finally {
      setVendasRecentes(prev => prev.filter(v => v.id !== id))
      alert(`Venda ${numeroPedido} removida!`)
    }
  }

  const produtoAtual = produtosCatalogo.find((p) => String(p.id) === produtoId)
  const estoqueProntoDisponivel = produtoAtual ? Number(produtoAtual.stock_ready || 0) : 0
  const qtdEstoqueUtilizada = Math.min(quantidade, estoqueProntoDisponivel)
  const qtdIndoParaProducao = Math.max(0, quantidade - estoqueProntoDisponivel)

  const handleAdicionarItem = () => {
    if (!produtoId || !produtoAtual) return

    let statusItem = 'Concluído (Pronta Entrega)'
    if (qtdIndoParaProducao > 0 && qtdEstoqueUtilizada > 0) {
      statusItem = `Parcial (${qtdEstoqueUtilizada} Pronta / ${qtdIndoParaProducao} Prod)`
    } else if (qtdIndoParaProducao > 0) {
      statusItem = `Em Produção (${qtdIndoParaProducao} un.)`
    }

    const novoItem = {
      id: Date.now(),
      produtoId,
      nomeProduto: produtoAtual.name,
      quantidade,
      valorUnitario,
      subtotal: quantidade * valorUnitario,
      qtdEstoqueUtilizada,
      qtdIndoParaProducao,
      statusItem
    }

    setItensPedido([...itensPedido, novoItem])
    setProdutoId('')
    setQuantidade(1)
    setValorUnitario(0)
  }

  const handleRemoverItem = (id: number) => {
    setItensPedido(itensPedido.filter(item => item.id !== id))
  }

  const valorBrutoTotalItens = itensPedido.reduce((acc, item) => acc + item.subtotal, 0)
  const percentualValido = Math.min(100, Math.max(0, Number(descontoPercentual) || 0))
  const valorDescontoTotal = valorBrutoTotalItens * (percentualValido / 100)
  const valorTotalFinal = Math.max(0, valorBrutoTotalItens - valorDescontoTotal)

  const handleFinalizarVendaGeral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente || itensPedido.length === 0) return

    try {
      setSalvandoVenda(true)
      let temItensEmProducao = false

      for (const item of itensPedido) {
        const prodOriginal = produtosCatalogo.find((p) => String(p.id) === String(item.produtoId))
        if (!prodOriginal) continue

        const estoqueAtual = Number(prodOriginal.stock_ready || 0)
        const filaAtual = Number(prodOriginal.production_queue || 0)

        if (item.qtdIndoParaProducao > 0) temItensEmProducao = true

        await supabase
          .from('products_3d')
          .update({
            stock_ready: Math.max(0, estoqueAtual - item.qtdEstoqueUtilizada),
            production_queue: filaAtual + item.qtdIndoParaProducao
          })
          .eq('id', item.produtoId)
      }

      let nomeProdutoHistorico = itensPedido.length === 1 
        ? itensPedido[0].nomeProduto 
        : `${itensPedido[0].nomeProduto} (+${itensPedido.length - 1} itens)`
      
      let statusHistorico = itensPedido.length === 1 
        ? itensPedido[0].statusItem 
        : `Misto (${itensPedido.length} modelos)`

      const qtdTotalItens = itensPedido.reduce((acc, item) => acc + item.quantidade, 0)
      const proximoSequencial = String(vendasRecentes.length + 1).padStart(3, '0')
      const numeroPedidoGerado = `PED-202608-${proximoSequencial}`

      const agora = new Date()
      const yyyymmdd = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`

      // Tenta persistir no Supabase (tabela sales) primeiro para obter o id da venda
      let saleId: any = null
      
      const salesResult = await supabase
        .from('sales')
        .insert([{
          numero_pedido: numeroPedidoGerado,
          cliente: cliente,
          produto: nomeProdutoHistorico,
          qtd: qtdTotalItens,
          total: valorTotalFinal,
          pagamento: formaPagamento.toUpperCase(),
          status: statusHistorico,
          em_producao: temItensEmProducao,
          fila_iniciada: !temItensEmProducao,
          itens: itensPedido.map(item => ({
            nome: item.nomeProduto,
            qtd: item.quantidade,
            qtdEstoqueUtilizada: item.qtdEstoqueUtilizada || 0,
            qtdIndoParaProducao: item.qtdIndoParaProducao || 0
          }))
        }])
        .select()

      if (salesResult.error) {
        console.error('Erro na inserção do Supabase em sales:', salesResult.error)
        throw new Error(`Erro ao salvar pedido no banco: ${salesResult.error.message}`)
      } else {
        saleId = salesResult?.data?.[0]?.id || null
      }

      const novaVendaObjeto = {
        id: saleId || Date.now(),
        numeroPedido: numeroPedidoGerado,
        cliente: cliente,
        produto: nomeProdutoHistorico,
        qtd: qtdTotalItens,
        total: valorTotalFinal,
        pagamento: formaPagamento.toUpperCase(),
        status: statusHistorico,
        emProducao: temItensEmProducao,
        filaIniciada: !temItensEmProducao || false,
        itens: itensPedido.map(item => ({
          nome: item.nomeProduto,
          qtd: item.quantidade,
          qtdEstoqueUtilizada: item.qtdEstoqueUtilizada || 0,
          qtdIndoParaProducao: item.qtdIndoParaProducao || 0
        })),
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }

      // Calcula taxa de gateway estimada
      let gatewayFee = 0
      const formaPgLower = formaPagamento.toLowerCase()
      if (formaPgLower === 'cartao' || formaPgLower === 'cartão') {
        gatewayFee = valorTotalFinal * 0.03 // 3%
      } else if (formaPgLower === 'boleto') {
        gatewayFee = 3.00 // R$3 fixo
      } else if (formaPgLower === 'pix') {
        gatewayFee = valorTotalFinal * 0.005 // 0.5%
      }

      // Inserção no Financeiro com associação de sale_id, quantidade de itens e taxa de gateway
      const financeResult = await supabase
        .from('financial_transactions')
        .insert([{
          date: yyyymmdd,
          type: 'Receita',
          category: 'Vendas',
          description: `Venda ${numeroPedidoGerado} - ${cliente}`,
          amount: valorTotalFinal,
          status: 'Concluído',
          payment_method: formaPagamento.toUpperCase(),
          payment_status: 'paid',
          due_date: yyyymmdd,
          payment_gateway_fee: Number(gatewayFee.toFixed(2)),
          quantity: qtdTotalItens,
          sale_id: saleId
        }])

      if (financeResult.error) {
        console.error('Erro ao inserir transação financeira:', financeResult.error)
        throw new Error(`Erro ao lançar transação financeira: ${financeResult.error.message}`)
      }

      // Atualiza o estado da lista local
      setVendasRecentes(prev => [novaVendaObjeto, ...prev])

      setCliente('')
      setItensPedido([])
      setDescontoPercentual(0)

      await fetchProdutos()
      alert(`Pedido ${numeroPedidoGerado} finalizado com sucesso!`)

    } catch (err: any) {
      alert(`Erro ao finalizar pedido: ${err.message || err}`)
    } finally {
      setSalvandoVenda(false)
    }
  }

  const selectModernStyle = "w-full bg-slate-50/80 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-sm cursor-pointer"
  const inputModernStyle = "w-full bg-slate-50/80 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-sm"
  const inputDisabledStyle = "w-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed shadow-sm"

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Módulo de Vendas Inteligente
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2">Gestão de Pedidos e Fabricação</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">O sistema verifica o estoque item por item e direciona faltas para a produção.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/90 dark:bg-slate-900 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Registrar Novo Pedido
          </h2>

          <form onSubmit={handleFinalizarVendaGeral} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Cliente</label>
                <select value={cliente} onChange={(e) => setCliente(e.target.value)} className={selectModernStyle} required>
                  <option value="">Selecione um cliente...</option>
                  <option value="Ana Souza">Ana Souza</option>
                  <option value="Carlos Silva">Carlos Silva</option>
                  <option value="Mariana Costa">Mariana Costa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Forma de Pagamento</label>
                <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className={selectModernStyle}>
                  <option value="pix">Pix</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Adicionar Modelo ao Pedido</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Produto / Modelo 3D</label>
                  <select 
                    value={produtoId} 
                    onChange={(e) => {
                      const id = e.target.value
                      setProdutoId(id)
                      const prod = produtosCatalogo.find((p) => String(p.id) === id)
                      setValorUnitario(prod ? Number(prod.suggested_price || 0) : 0)
                    }}
                    className={selectModernStyle}
                  >
                    <option value="">{loadingProdutos ? 'Carregando estoque...' : 'Selecione o produto cadastrado...'}</option>
                    {produtosCatalogo.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (Pronta: {prod.stock_ready || 0} un. | R$ {Number(prod.suggested_price || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Qtd</label>
                    <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className={inputModernStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Unit. (R$)</label>
                    <input type="text" value={`R$ ${valorUnitario.toFixed(2)}`} disabled className={inputDisabledStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-2">Total</label>
                    <input type="text" value={`R$ ${(quantidade * valorUnitario).toFixed(2)}`} disabled className={inputDisabledStyle} />
                  </div>
                </div>
              </div>

              {produtoAtual && (
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-orange-900 dark:text-orange-300">
                    <span>Análise de Estoque Pronto:</span>
                    <span>Disponível: {estoqueProntoDisponivel} un.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-white/80 dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      ✅ Sai do Estoque: <span className="font-black">{qtdEstoqueUtilizada} un.</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400">
                      ⚙️ Vai para Produção: <span className="font-black">{qtdIndoParaProducao} un.</span>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="button"
                onClick={handleAdicionarItem}
                disabled={!produtoId}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                ➕ Incluir este modelo na lista do pedido
              </button>
            </div>

            {itensPedido.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Itens Adicionados ({itensPedido.length})</label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
                  <table className="w-full min-w-[550px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3">Qtd</th>
                        <th className="py-2.5 px-3">Unitário</th>
                        <th className="py-2.5 px-3">Subtotal</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {itensPedido.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{item.nomeProduto}</td>
                          <td className="py-3 px-3">{item.quantidade} un.</td>
                          <td className="py-3 px-3">R$ {item.valorUnitario.toFixed(2)}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">R$ {item.subtotal.toFixed(2)}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">
                              {item.statusItem}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button type="button" onClick={() => handleRemoverItem(item.id)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-500/10 rounded-lg">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Desconto Global (%)</label>
              <input type="number" min="0" max="100" value={descontoPercentual} onChange={(e) => setDescontoPercentual(Number(e.target.value))} className={inputModernStyle} placeholder="0" />
            </div>

            <button 
              type="submit"
              disabled={itensPedido.length === 0 || !cliente || salvandoVenda}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {salvandoVenda ? 'Processando Pedido...' : 'Finalizar Pedido Completo & Disparar Estoque/Produção'}
            </button>
          </form>
        </div>

        <div className="bg-white/90 dark:bg-slate-900 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">Resumo do Pedido</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Cliente:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{cliente || 'Não definido'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Itens no Pedido:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{itensPedido.length} modelo(s)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal Bruto:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">R$ {valorBrutoTotalItens.toFixed(2)}</span>
              </div>
              {percentualValido > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-orange-600 dark:text-orange-400">
                  <span className="font-medium">Desconto ({percentualValido}%):</span>
                  <span className="font-bold">- R$ {valorDescontoTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Pagamento:</span>
                <span className="font-bold uppercase text-orange-600 dark:text-orange-400 text-xs bg-orange-500/10 px-2 py-1 rounded-lg">{formaPagamento}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600 dark:text-slate-400 font-black">TOTAL:</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {valorTotalFinal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-slate-900 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Histórico de Pedidos e Vendas</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-400 uppercase">
                <th className="py-3 px-4">Nº Pedido</th>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Qtd</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Status / Destino</th>
                <th className="py-3 px-4 text-center">Monitor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
              {vendasRecentes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400 text-xs">
                    Nenhum pedido registrado até o momento.
                  </td>
                </tr>
              ) : (
                vendasRecentes.map((v) => {
                  let dotColor = 'bg-emerald-500 shadow-emerald-500/50'
                  let labelStatus = '100% Concluído'

                  if (v.emProducao) {
                    dotColor = v.filaIniciada ? 'bg-amber-500 shadow-amber-500/50' : 'bg-rose-500 shadow-rose-500/50'
                    labelStatus = v.filaIniciada ? 'Em Produção' : 'Aguardando Fila'
                  }

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-4 px-4 font-mono font-bold text-orange-600 dark:text-orange-400 text-xs">{v.numeroPedido}</td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                        <div>{v.data}</div>
                        <div className="text-[10px] text-slate-400">{v.hora}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{v.cliente}</td>
                      <td className="py-4 px-4">{v.produto}</td>
                      <td className="py-4 px-4">{v.qtd}</td>
                      <td className="py-4 px-4 font-black text-slate-900 dark:text-white">R$ {Number(v.total).toFixed(2)}</td>
                      <td className="py-4 px-4"><span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-bold">{v.pagamento}</span></td>
                      <td className="py-4 px-4">
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
                          {v.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2" title={labelStatus}>
                          <span className="relative flex h-3.5 w-3.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
                            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 shadow-md ${dotColor}`}></span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 hidden xl:inline">{labelStatus}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeletarVenda(v.id, v.numeroPedido)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                          title="Excluir Venda e Financeiro"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}