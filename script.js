// =====================================================
// Projeto: Leitura de Hidrômetro
// Versão: v1.1.1
// Data: 10/11/2025
// Descrição: Código principal — cálculo simplificado (mínimo + excedente),
// com CRUD de blocos, leituras, histórico e boletos.
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
const DEFAULT_TARIFA = { minimo: 64.60, faixa_11_20: 8.94, faixa_21_50: 13.82 };

// NOVO CÁLCULO SIMPLIFICADO — v1.1.1
function calcularValorEscalonado(m3, tarifa) {
  const { minimo, faixa_11_20 } = tarifa; // faixa_11_20 = valor por m³ excedente
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
    faixa_21_50: Number(valores.faixa_21_50) || 0
  };
}

// ============== STORAGE HELPERS ==============
function carregarBlocos() {
  return JSON.parse(localStorage.getItem("blocos")) || [];
}
function salvarBlocos(blocos) {
  localStorage.setItem("blocos", JSON.stringify(blocos));
}

// ============== BOOT / ROTAS ==============
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
    return;
  }

  // Páginas internas exigem login
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

  // Pré-popula 32 apartamentos
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
      </div>`;
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

        <label for="tarifa-11-20-bloco">Valor por m³ excedente:</label>
        <input type="number" step="0.01" id="tarifa-11-20-bloco" class="input-curto">

        <button type="button" onclick="salvarTarifaDoBloco(${id})">💾 Salvar Tarifas</button>
      </form>

      <div class="acoes">
        <button type="button" onclick="adicionarApartamentoDireto(${id})">+ Adicionar Apartamento</button>
        <button type="button" onclick="salvarLeituraDoMes(${id})">💾 Salvar Leitura do Mês</button>
      </div>

      <h3 style="margin-top:10px;">📌 Leitura Atual (${mesAtualLabel()})</h3>
      ${gerarTabelaLeituraAtual(bloco, id)}
    </div>

    <h3 style="margin-top:18px;">📚 Histórico de Leituras</h3>
    ${gerarHistorico(bloco)}
  `;

  preencherTarifaForm(bloco);
}

function preencherTarifaForm(bloco) {
  const t = getTarifa(bloco);
  document.getElementById("tarifa-minimo-bloco").value = t.minimo;
  document.getElementById("tarifa-11-20-bloco").value = t.faixa_11_20;
}

function salvarTarifaDoBloco(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  setTarifa(bloco, {
    minimo: document.getElementById("tarifa-minimo-bloco").value,
    faixa_11_20: document.getElementById("tarifa-11-20-bloco").value,
    faixa_21_50: 0
  });

  const tarifa = getTarifa(bloco);
  bloco.leitura_atual = bloco.leitura_atual.map(apt => {
    apt.total_rs = calcularValorEscalonado(apt.total_m3, tarifa).toFixed(2);
    return apt;
  });

  salvarBlocos(blocos);
  alert("Tarifas salvas com sucesso!");
  renderizarBlocoIndividual();
}

// ======== Atualização de campo e cálculo automático ========
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

  const m3El = document.getElementById(`m3-${blocoIndex}-${aptIndex}`);
  const rsEl = document.getElementById(`rs-${blocoIndex}-${aptIndex}`);
  if (m3El) m3El.textContent = apt.total_m3;
  if (rsEl) rsEl.value = `R$ ${apt.total_rs}`;
}
