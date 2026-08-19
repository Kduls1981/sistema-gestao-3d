const fs = require('fs');
const path = require('path');

// Função recursiva para encontrar todos os arquivos .tsx nas pastas
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles('./app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Exemplo de automação: se o arquivo lida com preços/valores mas não importa o formatters
  if ((content.includes('preco') || content.includes('amount') || content.includes('sale_price')) && !content.includes('formatCurrency')) {
    
    // Adiciona o import no topo logo após a primeira linha de import ou no início
    const importStatement = "import { formatCurrency, formatDate } from '@/lib/formatters'\n";
    content = importStatement + content;
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Atualizado automaticamente: ${file}`);
  }
});

console.log('Varredura e injeção concluídas!');