// Funções de Utilidade Genéricas (utils.js)

// Função para salvar dados no localStorage com tratamento de erros
export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    alert("Falha ao salvar dados. Verifique as permissões do navegador.");
  }
}

// Função para carregar dados do localStorage com tratamento de erros
export function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return [];
  }
}

// Função de debounce para evitar múltiplas chamadas rápidas de uma função
let debounceTimeout;
export function debounce(func, delay) {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(func, delay);
}

// Função genérica de exportação para Excel
export function exportToXLSX(data, fileName, sheetName = "Leitura") {
  if (!window.XLSX) {
    alert("Biblioteca XLSX não carregada. Verifique a sua conexão ou recarregue a página.");
    return;
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const file = fileName.replace(/\s+/g, "_");

  try {
    XLSX.writeFile(workbook, `${file}.xlsx`);
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error);
    alert("Erro ao gerar o arquivo de Excel.");
  }
}

// Função para exibir mensagens de sucesso ou erro (Toast)
export function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000); // Remove a mensagem após 3 segundos
}

// Função alternativa para estimar o uso do localStorage (mais precisa para o nosso caso)
function estimateLocalStorageUsage() {
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    // Estima o tamanho: 2 bytes por caractere (UTF-16) + tamanho da chave
    totalBytes += (key.length + value.length) * 2; 
  }
  return totalBytes;
}

export function atualizarContadorStorage() {
  const contadorElement = document.getElementById('storage-counter');
  if (!contadorElement) return;

  // 1. Tenta usar a API nativa (mais precisa para o QUOTA)
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(estimate => {
      // Usa o uso estimado pela API, mas o uso alternativo para o localStorage
      const usageBytes = estimateLocalStorageUsage();
      const usageMB = (usageBytes / (1024 * 1024)).toFixed(2);
      const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
      const percent = ((usageBytes / estimate.quota) * 100).toFixed(2);

      if (usageBytes === 0) {
        contadorElement.innerHTML = `
          Armazenamento Local: Nenhum dado salvo (0.00 MB de ${quotaMB} MB)
        `;
      } else {
        contadorElement.innerHTML = `
          Armazenamento Local: ${usageMB} MB de ${quotaMB} MB (${percent}%)
        `;
      }
    }).catch(error => {
      console.warn("Erro ao usar navigator.storage.estimate. Usando fallback.", error);
      // Fallback para a estimativa simples se a API falhar
      const usageBytes = estimateLocalStorageUsage();
      const usageMB = (usageBytes / (1024 * 1024)).toFixed(2);
      // Quota padrão de 5MB (5 * 1024 * 1024 bytes)
      const quotaMB = (5).toFixed(2); 
      const percent = ((usageBytes / (5 * 1024 * 1024)) * 100).toFixed(2);

      contadorElement.innerHTML = `
        Armazenamento Local (Estimativa): ${usageMB} MB de ${quotaMB} MB (${percent}%)
      `;
    });
  } else {
    // 2. Fallback simples (sem API nativa)
    const usageBytes = estimateLocalStorageUsage();
    const usageMB = (usageBytes / (1024 * 1024)).toFixed(2);
    const quotaMB = (5).toFixed(2); // Quota padrão de 5MB
    const percent = ((usageBytes / (5 * 1024 * 1024)) * 100).toFixed(2);

    contadorElement.innerHTML = `
      Armazenamento Local (Estimativa): ${usageMB} MB de ${quotaMB} MB (${percent}%)
    `;
  }
}

// Funções de exportação/importação de dados (JSON)
export function carregarBlocos() {
  return loadData("blocos");
}

export function salvarBlocos(blocos) {
  debounce(() => {
    saveData("blocos", blocos);
    showToast("Blocos salvos com sucesso!");
  }, 500);
}

export function exportarDadosJSON() {
  const blocos = carregarBlocos();
  if (blocos.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }
  const dataStr = JSON.stringify(blocos, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = `hidrometro_backup_${new Date().toISOString().slice(0,10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  showToast("Dados exportados com sucesso!");
}

export function acionarImportacaoJSON() {
  document.getElementById('import-json-input').click();
}

export function importarDadosJSON(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (confirm("ATENÇÃO: A importação substituirá todos os dados de blocos existentes. Deseja continuar?")) {
        saveData("blocos", importedData);
        showToast("Dados importados com sucesso! Recarregando a página...");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error("Erro ao importar dados:", error);
      alert("Erro ao processar o arquivo JSON. Verifique se o formato está correto.");
    }
    // Limpa o valor do input para permitir a importação do mesmo arquivo novamente
    event.target.value = '';
  };
  reader.readAsText(file);
}

// Funções de formatação
export function formatarMesLabel(mes) {
  const [ano, mesNum] = mes.split('-');
  const data = new Date(ano, mesNum - 1);
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function mesAtual() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

export function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para converter número para extenso (copiada do script.js original)
export function numeroPorExtenso(n) {
  if (n === 0) return "zero";
  if (n < 0) return "menos " + numeroPorExtenso(-n);

  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  let [inteiro, decimal] = String(n.toFixed(2)).split('.');
  inteiro = parseInt(inteiro);
  decimal = parseInt(decimal);

  let extenso = "";

  function porExtenso(num) {
    let str = "";
    if (num === 100) return "cem";
    if (num < 10) return unidades[num];
    if (num < 20) return especiais[num - 10];
    if (num < 100) {
      str = dezenas[Math.floor(num / 10)];
      if (num % 10 !== 0) str += " e " + unidades[num % 10];
      return str;
    }
    if (num < 1000) {
      str = centenas[Math.floor(num / 100)];
      if (num % 100 !== 0) str += " e " + porExtenso(num % 100);
      return str;
    }
    return "";
  }

  let parteInteira = "";
  if (inteiro > 0) {
    let milhar = Math.floor(inteiro / 1000);
    let resto = inteiro % 1000;

    if (milhar > 0) {
      if (milhar === 1) {
        parteInteira += "mil";
      } else {
        parteInteira += porExtenso(milhar) + " mil";
      }
      if (resto > 0) parteInteira += " e ";
    }
    parteInteira += porExtenso(resto);
  }

  if (parteInteira) {
    extenso += parteInteira;
    extenso += (inteiro === 1) ? " real" : " reais";
  }

  if (decimal > 0) {
    if (inteiro > 0) extenso += " e ";
    extenso += porExtenso(decimal);
    extenso += (decimal === 1) ? " centavo" : " centavos";
  }

  return extenso.trim();
}
