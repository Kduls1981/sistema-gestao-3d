// lib/formatters.ts

// Formata data de "YYYY-MM-DD" ou ISO para "DD/MM/YYYY"
export const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const cleanDate = dateString.split("T")[0]; // Remove a hora caso venha no formato ISO
  const [year, month, day] = cleanDate.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
};

// Formata números para o padrão de moeda brasileira (R$86,00 - sem espaço extra)
export const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "R$0,00";
  
  // O replace substitui o espaço não-separável gerado pelo Intl por um espaço normal ou remove se preferir colado
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);

  // Garante que fique "R$86,00" ou "R$ 86,00" conforme o desejado (aqui removemos o espaço após o S)
  return formatted.replace("R$ ", "R$");
};