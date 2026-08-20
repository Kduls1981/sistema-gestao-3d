export interface Transaction {
  id: string
  date: string
  type: string
  category?: string
  description: string
  amount: number
  status?: string
  payment_gateway_fee?: number
  tax_rate?: number
  tax_amount?: number
  sales_commission?: number
  net_profit_margin?: number
  payment_method?: string
  due_date?: string
  payment_date?: string
  payment_status?: 'pending' | 'paid' | 'cancelled'
}

export interface Machine {
  id: string
  name: string
  acquisition_cost?: number
  power_consumption_kwh?: number
  depreciation_per_hour?: number
  power_watts?: number
  kwh_cost?: number
  purchase_price?: number
  lifespan_hours?: number
  depreciation_cost_per_hour?: number
}

export interface PrintFailure {
  id: string
  machine_id: string
  filament_spent_grams: number
  reason: string
  estimated_loss_cost: number
  created_at: string
}
