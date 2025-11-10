// =====================================================
// Projeto: Leitura de Hidrômetro
// Versão: v1.1.4
// Data: 11/11/2025
// Descrição: Código principal — revisão total de botões,
// cálculo simplificado (mínimo + excedente) e importação XLSX funcional.
// =====================================================

// ============== AUTH BÁSICA ==============
const user = { username: "admin", password: "1234" };

function isLogged() {
  return localStorage.getItem("logado") === "true";
}
function logout() {
  localStorage.removeItem("logado");
  location.href = "index.html";
}

// ============== TARIFAS POR BLOCO ==============
const DEFAULT_TARIFA = { minimo: 64.6, faixa_11_20: 8.94, faixa_21_50: 0 };

// Cálculo: mínimo + excedente
function calcularValorEscalonado(m3, tarifa) {
  const { minimo, faixa_11_20 } = tarifa;
  if (m3 <= 10) return minimo;
  return minimo + (m3 - 10) * faixa_11_20;
}

function getTarifa(bloco) {
  return bloco.tarifaConfig || DEFAULT_TARIFA;
}
function setTarifa(bloco, valores) {
  bloco.tarifaConfig = {
    minimo: Number(valores.minimo) || 0,
    faixa_11_20: Number(valores.faixa_11_20) || 0,
    faixa_21_50: 0
  };
}

// ============== STORAGE HELPERS ==============
function carregarBlocos() {
  try {
    return JSON.parse(localStorage.getItem("blocos")) || [];
  } catch {
    return [];
  }
}
function salvarBlocos(blocos) {
  localStorage.setItem("blocos", JSON.stringify(blocos));
}

// ============== BOOT / ROTAS ==============
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname;
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
    return;
  }

  if (!isLogged()) return;
  if (path.endsWith("dashboard.html")) renderizarListaDeBlocos();
  if (path.endsWith("bloco.html")) renderizarBlocoIndividual();
  if (path.endsWith("boletos.html")) renderizarBoletosPage();
});

// ============== CRUD DE BLOCOS ==============
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
    tarifaConfig: { ...DEFAULT_TARIFA }
  });

  salvarBlocos(blocos);
  renderizarListaDeBlocos();
  alert("Bloco criado com sucesso!");
}

// ============== DASHBOARD ==============
function renderizarListaDeBlocos() {
  const blocos = carregarBlocos();
  const container = document.getElementById("blocos-container");
  if (!container) return;
  container.innerHTML = "";

  if (blocos.length === 0) {
    container.innerHTML = `<div class="bloco"><p>Nenhum bloco cadastrado ainda.</p><button onclick="criarBloco()">+ Adicionar Bloco</button></div>`;
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
      </div>`;
    container.appendChild(div);
  });
}

// ============== PÁGINA DO BLOCO ==============
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

  bloco.leitura_atual ||= [];
  bloco.historico ||= {};
  bloco.tarifaConfig ||= { ...DEFAULT_TARIFA };
  salvarBlocos(blocos);

  const tarifa = getTarifa(bloco);

  container.innerHTML = `
    <div class="bloco">
      <h2>${bloco.nome}</h2>
      <p><strong>Endereço:</strong> ${bloco.endereco || "-"}</p>
      <p><strong>Síndico:</strong> ${bloco.sindico || "-"}</p>
      <p style="color:#1e3a8a"><strong>💧 Fórmula ativa:</strong> mínimo + excedente fixo</p>

      <h3>Configurações de Tarifa</h3>
      <form onsubmit="return false;">
        <label>Tarifa mínima (até 10 m³):</label>
        <input type="number" step="0.01" id="tarifa-minimo-bloco" value="${tarifa.minimo}">
        <label>Valor por m³ excedente:</label>
        <input type="number" step="0.01" id="tarifa-11-20-bloco" value="${tarifa.faixa_11_20}">
        <button type="button" onclick="salvarTarifaDoBloco(${id})">💾 Salvar Tarifas</button>
      </form>

      <div class="acoes">
        <button onclick="adicionarApartamentoDireto(${id})">+ Adicionar Apartamento</button>
        <button onclick="salvarLeituraDoMes(${id})">💾 Salvar Leitura do Mês</button>
      </div>

      <h3>📌 Leitura Atual (${mesAtualLabel()})</h3>
      ${gerarTabelaLeituraAtual(bloco, id)}
    </div>

    <h3>📚 Histórico de Leituras</h3>
    ${gerarHistorico(bloco)}
  `;
}

// ======== Salvar Tarifas (corrigido) ========
function salvarTarifaDoBloco(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  if (!bloco) return;

  setTarifa(bloco, {
    minimo: document.getElementById("tarifa-minimo-bloco").value,
    faixa_11_20: document.getElementById("tarifa-11-20-bloco").value
  });

  const tarifa = getTarifa(bloco);
  bloco.leitura_atual = bloco.leitura_atual.map(apt => {
    apt.total_rs = calcularValorEscalonado(apt.total_m3, tarifa).toFixed(2);
    return apt;
  });

  salvarBlocos(blocos);
  alert("✅ Tarifas salvas e valores recalculados!");
  renderizarBlocoIndividual();
}

// ============== EDIÇÃO E CÁLCULOS ==============
function atualizarCampo(blocoIndex, aptIndex, valor) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  const apt = bloco.leitura_atual[aptIndex];

  apt.leitura_atual = Number(valor) || 0;
  const diff = apt.leitura_atual - (Number(apt.leitura_anterior) || 0);
  apt.total_m3 = Math.max(0, diff);

  const tarifa = getTarifa(bloco);
  apt.total_rs = calcularValorEscalonado(apt.total_m3, tarifa).toFixed(2);

  salvarBlocos(blocos);

  document.getElementById(`m3-${blocoIndex}-${aptIndex}`).textContent = apt.total_m3;
  document.getElementById(`rs-${blocoIndex}-${aptIndex}`).value = `R$ ${apt.total_rs}`;
}

function editarCampo(blocoIndex, aptIndex, campo, valor) {
  const blocos = carregarBlocos();
  blocos[blocoIndex].leitura_atual[aptIndex][campo] = valor;
  salvarBlocos(blocos);
}

// ============== IMPORTAÇÃO E EXPORTAÇÃO XLSX ==============
function importarLeituraAtual(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheet];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const blocos = carregarBlocos();
      const id = Number(new URLSearchParams(location.search).get("id"));
      const bloco = blocos[id];
      if (!bloco) return;

      const tarifa = getTarifa(bloco);
      bloco.leitura_atual = json.map(row => {
        const ant = Number(row["Leitura Anterior"]) || 0;
        const atu = Number(row["Leitura Atual"]) || 0;
        const m3 = Math.max(0, atu - ant);
        return {
          numero: row["Hidrômetro Nº"] || "",
          responsavel: row["Responsável"] || "",
          leitura_anterior: ant,
          leitura_atual: atu,
          total_m3: m3,
          total_rs: calcularValorEscalonado(m3, tarifa).toFixed(2),
          obs: row["Observações"] || ""
        };
      });

      salvarBlocos(blocos);
      alert("✅ Leitura importada com sucesso!");
      renderizarBlocoIndividual();
    } catch (err) {
      alert("❌ Erro ao importar planilha: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function exportarLeituraAtual() {
  if (!window.XLSX) { alert("Biblioteca XLSX não carregada."); return; }
  const blocos = carregarBlocos();
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const bloco = blocos[id];
  if (!bloco) return alert("Bloco não encontrado.");

  const dados = bloco.leitura_atual || [];
  const wsData = [["Hidrômetro Nº","Responsável","Leitura Anterior","Leitura Atual","m³","R$","Observações"]];
  dados.forEach(a => wsData.push([a.numero,a.responsavel,a.leitura_anterior,a.leitura_atual,a.total_m3,`R$ ${a.total_rs}`,a.obs]));
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leitura Atual");
  XLSX.writeFile(wb, `Leitura_${(bloco.nome||"Bloco")}_${mesAtual()}.xlsx`);
}

// ======== Gerar exemplo XLSX ========
function gerarExemploXLSX() {
  if (!window.XLSX) { alert("Biblioteca XLSX não carregada."); return; }

  const exemplo = [
    ["Hidrômetro Nº","Responsável","Leitura Anterior","Leitura Atual","m³","R$","Observações"],
    ["101-A","João Silva",0,12,12,"R$ 94,68","Consumo normal"],
    ["102-A","Maria Souza",0,8,8,"R$ 64,60","Dentro da tarifa mínima"],
    ["103-A","Carlos Lima",10,25,15,"R$ 111,35","Excedente leve"],
    ["104-A","Ana Paula",5,16,11,"R$ 77,54","Leitura ajustada"]
  ];
  const ws = XLSX.utils.aoa_to_sheet(exemplo);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leitura Atual");
  XLSX.writeFile(wb, "leitura_exemplo.xlsx");
  alert("📘 Arquivo de exemplo gerado com sucesso!");
}

// ============== UTILITÁRIOS ==============
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}`;
}
function mesAtualLabel() {
  const d = new Date();
  return d.toLocaleString("pt-BR", { month: "long", year: "numeric" });
}
function formatarMesLabel(mes) {
  const [ano, m] = mes.split("-");
  const d = new Date(`${ano}-${m}-01`);
  return d.toLocaleString("pt-BR", { month: "long", year: "numeric" });
}
