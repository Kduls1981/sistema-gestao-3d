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
  
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);

  return formatted.replace("R$ ", "R$");
};

// Formata CPF (000.000.000-00) ou CNPJ (00.000.000/0001-00) dinamicamente
export const formatCpfCnpj = (value: string) => {
  if (!value) return "";
  const clean = value.replace(/\D/g, "").slice(0, 14);

  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return clean
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

// Formata Telefone fixo ((00) 0000-0000) ou Celular/WhatsApp ((00) 00000-0000)
export const formatPhone = (value: string) => {
  if (!value) return "";
  const clean = value.replace(/\D/g, "").slice(0, 11);

  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }

  return clean
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
};

/**
 * Capitaliza nomes próprios mantendo conectivos e preposições em minúsculo.
 * Exemplo: "CARLOS EDUARDO DE LIMA" -> "Carlos Eduardo de Lima"
 */
export const formatTitleCase = (text: string): string => {
  if (!text) return "";

  const prepositions = new Set(["de", "da", "do", "das", "dos", "e", "em"]);

  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && prepositions.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};