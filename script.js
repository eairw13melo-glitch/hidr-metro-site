// Função para salvar dados no localStorage com tratamento de erros
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    alert("Falha ao salvar dados. Verifique as permissões do navegador.");
  }
}

// Função para carregar dados do localStorage com tratamento de erros
function loadData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (!data) {
      console.log("Nenhum dado encontrado para a chave:", key);
    }
    return data || [];
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return [];
  }
}

// Função de debounce para evitar múltiplas chamadas rápidas de uma função
let debounceTimeout;
function debounce(func, delay) {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(func, delay);
}

// Função genérica de exportação para Excel
function exportToXLSX(data, fileName, sheetName = "Leitura") {
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
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000); // Remove a mensagem após 3 segundos
}

// Função de salvar blocos com debounce
function salvarBlocos(blocos) {
  debounce(() => {
    saveData("blocos", blocos);
    showToast("Blocos salvos com sucesso!");
  }, 500);
}

// ==================== AUTH BÁSICA ====================
const user = { username: "admin", password: "1234" };

function isLogged() {
  return localStorage.getItem("logado") === "true";
}
function logout() {
  localStorage.removeItem("logado");
  location.href = "index.html";
}

// ==================== TARIFAS POR BLOCO ====================
const DEFAULT_TARIFA = { minimo: 64.60, faixa_11_20: 8.94, faixa_21_50: 13.82 };

function getTarifa(bloco) {
  return bloco.tarifaConfig || DEFAULT_TARIFA;
}

function setTarifa(bloco, valores) {
  bloco.tarifaConfig = {
    minimo: Number(valores.minimo) || 0,
    faixa_11_20: Number(valores.faixa_11_20) || 0,
    faixa_21_50: Number(valores.faixa_21_50) || 0
  };
}

function calcularValorEscalonado(m3, tarifa) {
  const { minimo, faixa_11_20, faixa_21_50 } = tarifa;
  if (m3 <= 10) return minimo;
  if (m3 <= 20) return minimo + (m3 - 10) * faixa_11_20;
  const faixa2 = 10 * faixa_11_20;
  const faixa3 = (m3 - 20) * faixa_21_50;
  return minimo + faixa2 + faixa3;
}

// ==================== STORAGE HELPERS ====================
function carregarBlocos() {
  return JSON.parse(localStorage.getItem("blocos")) || [];
}

function salvarBlocos(blocos) {
  localStorage.setItem("blocos", JSON.stringify(blocos));
}

// ==================== BOOT / ROTAS ====================
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname;

  // Página de login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    if (isLogged()) location.href = "dashboard.html";
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = document.getElementById("username").value.trim();
      const p = document.getElementById("password").value;
      if (u === user.username && p === user.password) {
        localStorage.setItem("logado", "true");
        location.href = "dashboard.html";
      } else {
        document.getElementById("login-error").textContent = "Usuário ou senha inválido.";
      }
    });
    return; // não continua
  }

  // Páginas internas exigem login (há script inline nas páginas também)
  if (!isLogged()) return;

  // Roteamento simples
  if (path.endsWith("dashboard.html")) {
    renderizarListaDeBlocos();
  } else if (path.endsWith("bloco.html")) {
    renderizarBlocoIndividual();
  } else if (path.endsWith("boletos.html")) {
    renderizarBoletosPage();
  }
});

// ==================== CRUD DE BLOCOS ====================
function criarBloco() {
  const nome = prompt("Nome do novo bloco:");
  if (!nome) return;

  const endereco = prompt("Endereço do bloco:") || "";
  const sindico = prompt("Síndico:") || "";

  const blocos = carregarBlocos();
  if (blocos.find(b => b.nome.toLowerCase() === nome.toLowerCase())) {
    alert("Já existe um bloco com esse nome.");
    return;
  }

  // Pré-popula 32 apartamentos como exemplo
  const leitura_atual = [];
  for (let i = 1; i <= 32; i++) {
    leitura_atual.push({
      numero: `${100 + i}-A`,
      responsavel: "",
      leitura_anterior: 0,
      leitura_atual: 0,
      total_m3: 0,
      total_rs: 0,
      obs: ""
    });
  }

  blocos.push({
    nome, endereco, sindico,
    leitura_atual,
    historico: {},
    tarifaConfig: { ...DEFAULT_TARIFA } // 👈 tarifas independentes por bloco
  });

  salvarBlocos(blocos);
  renderizarListaDeBlocos();
  alert("Bloco criado com sucesso!");
}

function renderizarListaDeBlocos() {
  const blocos = carregarBlocos();
  const container = document.getElementById("blocos-container");
  if (!container) return;
  container.innerHTML = "";

  if (blocos.length === 0) {
    container.innerHTML = `
      <div class="bloco">
        <p>Nenhum bloco cadastrado ainda.</p>
        <button onclick="criarBloco()">+ Adicionar Bloco</button>
      </div>
    `;
    return;
  }

  blocos.forEach((bloco, index) => {
    const div = document.createElement("div");
    div.className = "bloco";
    div.innerHTML = `
      <h2>${bloco.nome}</h2>
      <p><strong>Endereço:</strong> ${bloco.endereco || "-"}</p>
      <p><strong>Síndico:</strong> ${bloco.sindico || "-"}</p>
      <p><strong>Tarifa mínima:</strong> R$ ${getTarifa(bloco).minimo.toFixed(2)}</p>
      <div class="acoes">
        <button onclick="window.location.href='bloco.html?id=${index}'">🔍 Acessar Bloco</button>
        <button class="btn-danger-outline" onclick="excluirBloco(${index})">🗑️ Excluir Bloco</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function excluirBloco(index) {
  const blocos = carregarBlocos();
  const bloco = blocos[index];
  if (!bloco) { alert("Bloco não encontrado."); return; }

  const qtdApt = bloco.leitura_atual?.length || 0;
  const qtdMeses = Object.keys(bloco.historico || {}).length;

  const ok = confirm(
    `Excluir o bloco "${bloco.nome}"?\n\n` +
    `• Apartamentos cadastrados: ${qtdApt}\n` +
    `• Meses no histórico: ${qtdMeses}\n\n` +
    `Esta ação não pode ser desfeita.`
  );
  if (!ok) return;

  blocos.splice(index, 1);
  salvarBlocos(blocos);
  renderizarListaDeBlocos();
  alert("Bloco excluído com sucesso.");
}

// ==================== PÁGINA DO BLOCO ====================
function renderizarBlocoIndividual() {
  const blocos = carregarBlocos();
  const id = Number(new URLSearchParams(location.search).get("id"));
  const bloco = blocos[id];

  const container = document.getElementById("bloco-detalhes");
  if (!container) return;

  if (!bloco) {
    container.innerHTML = `<div class="bloco"><h2>Bloco não encontrado.</h2></div>`;
    return;
  }

  if (!bloco.leitura_atual) bloco.leitura_atual = [];
  if (!bloco.historico) bloco.historico = {};
  if (!bloco.tarifaConfig) bloco.tarifaConfig = { ...DEFAULT_TARIFA };
  salvarBlocos(blocos);

  container.innerHTML = `
    <div class="bloco">
      <h2>${bloco.nome}</h2>
      <p><strong>Endereço:</strong> ${bloco.endereco || "-"}</p>
      <p><strong>Síndico:</strong> ${bloco.sindico || "-"}</p>

      <h3 style="margin-top:10px;">Configurações de Tarifa 💧</h3>
      <form class="tarifa-form" onsubmit="return false;">
        <label for="tarifa-minimo-bloco">Tarifa mínima (até 10 m³):</label>
        <input type="number" step="0.01" id="tarifa-minimo-bloco" class="input-curto">

        <label for="tarifa-11-20-bloco">Tarifa por m³ de 11 a 20:</label>
        <input type="number" step="0.01" id="tarifa-11-20-bloco" class="input-curto">

        <label for="tarifa-21-50-bloco">Tarifa por m³ acima de 20:</label>
        <input type="number" step="0.01" id="tarifa-21-50-bloco" class="input-curto">

        <button type="button" onclick="salvarTarifaDoBloco(${id})">💾 Salvar Tarifas deste Bloco</button>
      </form>

      <div class="acoes">
        <button type="button" onclick="adicionarApartamentoDireto(${id})">+ Adicionar Apartamento</button>
        <button type="button" onclick="salvarLeituraDoMes(${id})">💾 Salvar Leitura do Mês</button>
      </div>

      <h3>📌 Leitura Atual (${mesAtualLabel()})</h3>
      ${gerarTabelaLeituraAtual(bloco, id)}
    </div>

    <h3 style="margin-top:18px;">📚 Histórico de Leituras</h3>
    ${gerarHistorico(bloco)}
  `;

  preencherTarifaForm(bloco);
}
