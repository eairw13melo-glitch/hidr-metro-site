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
    return; // não continua
  }

  // Páginas internas exigem login (há script inline nas páginas também)
  if (!isLogged()) return;

  // Roteamento simples
  if (path.endsWith("dashboard.html")) {
    renderizarListaDeBlocos();
  } else if (path.endsWith("bloco.html")) {
    renderizarBlocoIndividual();
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
  // saneamento
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

  // Preencher form de tarifa
  preencherTarifaForm(bloco);
}

function preencherTarifaForm(bloco) {
  const t = getTarifa(bloco);
  document.getElementById("tarifa-minimo-bloco").value = t.minimo;
  document.getElementById("tarifa-11-20-bloco").value = t.faixa_11_20;
  document.getElementById("tarifa-21-50-bloco").value = t.faixa_21_50;
}

function salvarTarifaDoBloco(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  setTarifa(bloco, {
    minimo: document.getElementById("tarifa-minimo-bloco").value,
    faixa_11_20: document.getElementById("tarifa-11-20-bloco").value,
    faixa_21_50: document.getElementById("tarifa-21-50-bloco").value
  });

  // Recalcula valores atuais com a nova tarifa
  const tarifa = getTarifa(bloco);
  bloco.leitura_atual = bloco.leitura_atual.map(apt => {
    apt.total_rs = calcularValorEscalonado(apt.total_m3, tarifa).toFixed(2);
    return apt;
  });

  salvarBlocos(blocos);
  alert("Tarifas deste bloco salvas!");
  renderizarBlocoIndividual();
}

function gerarTabelaLeituraAtual(bloco, blocoIndex) {
  return `
    <table>
      <thead>
        <tr>
          <th>Hidrômetro Nº</th>
          <th>Responsável</th>
          <th>Anterior</th>
          <th>Atual</th>
          <th>m³</th>
          <th>R$</th>
          <th>Obs</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${bloco.leitura_atual.map((apt, i) => `
          <tr>
            <td>
              <label class="sr-only" for="numero-${blocoIndex}-${i}">Número</label>
              <input type="text" class="pequeno" value="${apt.numero}" id="numero-${blocoIndex}-${i}">
            </td>
            <td><input type="text" value="${apt.responsavel}" onchange="editarCampo(${blocoIndex}, ${i}, 'responsavel', this.value)"></td>
            <td><input type="number" class="menor" value="${apt.leitura_anterior}"
              onchange="editarCampo(${blocoIndex}, ${i}, 'leitura_anterior', Number(this.value)||0); atualizarCampo(${blocoIndex}, ${i}, document.querySelector('#numero-${blocoIndex}-${i}').value, true)">
            </td>
            <td><input type="number" class="menor" value="${apt.leitura_atual}" oninput="atualizarCampo(${blocoIndex}, ${i}, this.value)"></td>
            <td id="m3-${blocoIndex}-${i}">${apt.total_m3}</td>
            <td><input type="text" id="rs-${blocoIndex}-${i}" class="media" value="R$ ${apt.total_rs}" readonly></td>
            <td><input type="text" value="${apt.obs}" onchange="editarCampo(${blocoIndex}, ${i}, 'obs', this.value)"></td>
            <td>
              <button type="button" onclick="salvarApartamentoDireto(${blocoIndex}, ${i})">💾</button>
              <button type="button" class="btn-danger" onclick="removerApartamento(${blocoIndex}, ${i})">🗑️</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function gerarHistorico(bloco) {
  const historico = bloco.historico || {};
  const meses = Object.keys(historico).sort().reverse();
  if (meses.length === 0) return `<div class="bloco"><p>Nenhuma leitura registrada ainda.</p></div>`;

  return meses.map(mes => `
    <div class="bloco">
      <h4>📅 ${formatarMesLabel(mes)}</h4>
      <table>
        <thead>
          <tr>
            <th>Hidrômetro Nº</th>
            <th>Responsável</th>
            <th>Anterior</th>
            <th>Atual</th>
            <th>m³</th>
            <th>R$</th>
            <th>Obs</th>
          </tr>
        </thead>
        <tbody>
          ${historico[mes].map(apt => `
            <tr>
              <td>${apt.numero}</td>
              <td>${apt.responsavel}</td>
              <td>${apt.leitura_anterior}</td>
              <td>${apt.leitura_atual}</td>
              <td>${apt.total_m3}</td>
              <td>R$ ${apt.total_rs}</td>
              <td>${apt.obs}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `).join("");
}

// ============== EDIÇÃO/ATUALIZAÇÃO DE CAMPOS ==============
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

  // Atualiza UI
  const m3El = document.getElementById(`m3-${blocoIndex}-${aptIndex}`);
  const rsEl = document.getElementById(`rs-${blocoIndex}-${aptIndex}`);
  if (m3El) m3El.textContent = apt.total_m3;
  if (rsEl) rsEl.value = `R$ ${apt.total_rs}`;
}

function editarCampo(blocoIndex, aptIndex, campo, valor) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].leitura_atual[aptIndex];
  apt[campo] = campo.includes("leitura") ? (Number(valor) || 0) : valor;
  salvarBlocos(blocos);
}

function salvarApartamentoDireto(blocoIndex, aptIndex) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].leitura_atual[aptIndex];
  const novoNumero = document.getElementById(`numero-${blocoIndex}-${aptIndex}`).value.trim();
  if (novoNumero) apt.numero = novoNumero;
  apt.leitura_anterior = apt.leitura_atual; // fecha o ciclo
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

function removerApartamento(blocoIndex, aptIndex) {
  if (!confirm("Remover este apartamento?")) return;
  const blocos = carregarBlocos();
  blocos[blocoIndex].leitura_atual.splice(aptIndex, 1);
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

function adicionarApartamentoDireto(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  const numero = prompt("Número do novo apartamento:");
  if (!numero) return;

  if (bloco.leitura_atual.find(a => a.numero === numero)) {
    alert("Número já cadastrado.");
    return;
  }

  bloco.leitura_atual.push({
    numero,
    responsavel: "",
    leitura_anterior: 0,
    leitura_atual: 0,
    total_m3: 0,
    total_rs: 0,
    obs: ""
  });

  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

// ============== FECHAMENTO DO MÊS ==============
function mesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}
function mesAtualLabel() {
  const hoje = new Date();
  return hoje.toLocaleString("pt-BR", { month: "long", year: "numeric" });
}
function formatarMesLabel(mes) {
  const [ano, numeroMes] = mes.split("-");
  const date = new Date(`${ano}-${(numeroMes || "01")}-01`);
  return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

function salvarLeituraDoMes(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  if (!bloco) { alert("Bloco não encontrado."); return; }

  const base = mesAtual(); // YYYY-MM
  let mes = base, i = 0;
  bloco.historico = bloco.historico || {};
  while (bloco.historico[mes]) { i++; mes = `${base}-${String.fromCharCode(96 + i)}`; }

  // 1) Grava no histórico
  bloco.historico[mes] = JSON.parse(JSON.stringify(bloco.leitura_atual || []));

  // 2) Exporta Excel (se possível)
  const fazerExport = () => {
    const dados = bloco.historico[mes];
    const wsData = [
      ["Hidrômetro Nº","Responsável","Leitura Anterior","Leitura Atual","m³","R$","Observações"],
      ...dados.map(apt => [
        apt.numero, apt.responsavel, apt.leitura_anterior, apt.leitura_atual, apt.total_m3, `R$ ${apt.total_rs}`, apt.obs
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leitura");
    const nomeArquivo = `Leitura_${(bloco.nome||"Bloco")}_${mes}.xlsx`.replace(/\s+/g, "_");
    XLSX.writeFile(wb, nomeArquivo);
  };

  if (window.XLSX) {
    try { fazerExport(); } catch (e) { console.error(e); alert("Falha ao exportar Excel, mas o histórico foi salvo."); }
  } else {
    alert("Histórico salvo. Para exportar Excel, verifique a conexão e recarregue a página (biblioteca não carregada).");
  }

  // 3) Prepara próxima rodada
  bloco.leitura_atual = (bloco.leitura_atual || []).map(apt => ({
    numero: apt.numero,
    responsavel: apt.responsavel,
    leitura_anterior: apt.leitura_atual,
    leitura_atual: 0,
    total_m3: 0,
    total_rs: 0,
    obs: ""
  }));

  salvarBlocos(blocos);
  renderizarBlocoIndividual();
  alert("Leitura salva no histórico.");
}

// ============== EXPORTAÇÃO / IMPORTAÇÃO ==============
function checarXLSX(prontoCb) {
  if (window.XLSX) { prontoCb(); return; }
  alert("Biblioteca de planilhas não carregou.\nVerifique sua internet ou o bloqueio de scripts e tente novamente.");
}

function exportarParaExcel(dados, nomeBloco, mes) {
  const worksheetData = [
    ["Hidrômetro Nº","Responsável","Leitura Anterior","Leitura Atual","m³","R$","Observações"],
    ...dados.map(apt => [
      apt.numero,
      apt.responsavel,
      apt.leitura_anterior,
      apt.leitura_atual,
      apt.total_m3,
      `R$ ${apt.total_rs}`,
      apt.obs
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leitura");
  const nomeArquivo = `Leitura_${nomeBloco}_${mes}.xlsx`.replace(/\s+/g, "_");
  XLSX.writeFile(workbook, nomeArquivo);
}

function exportarLeituraAtual() {
  checarXLSX(() => {
    const blocos = carregarBlocos();
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    const bloco = blocos[id];
    if (!bloco) { alert("Bloco não encontrado."); return; }

    const dados = bloco.leitura_atual || [];
    const worksheetData = [
      ["Hidrômetro Nº","Responsável","Leitura Anterior","Leitura Atual","m³","R$","Observações"],
      ...dados.map(apt => [
        apt.numero,
        apt.responsavel,
        apt.leitura_anterior,
        apt.leitura_atual,
        apt.total_m3,
        `R$ ${apt.total_rs}`,
        apt.obs
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leitura Atual");
    const mes = mesAtual().replace("-", "_");
    const nomeArquivo = `LeituraAtual_${(bloco.nome||"Bloco")}_${mes}.xlsx`.replace(/\s+/g, "_");
    XLSX.writeFile(wb, nomeArquivo);
  });
}

function importarLeituraAtual(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    const blocos = carregarBlocos();
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    const bloco = blocos[id];
    const tarifa = getTarifa(bloco);

    json.forEach((row, index) => {
      if (!bloco.leitura_atual[index]) return;

      const ant = Number(row["Leitura Anterior"]) || 0;
      const atu = Number(row["Leitura Atual"]) || 0;
      const m3 = Math.max(0, atu - ant);

      const apt = bloco.leitura_atual[index];
      apt.numero = row["Hidrômetro Nº"] || apt.numero;
      apt.responsavel = row["Responsável"] || "";
      apt.leitura_anterior = ant;
      apt.leitura_atual = atu;
      apt.total_m3 = m3;
      apt.total_rs = calcularValorEscalonado(m3, tarifa).toFixed(2);
      apt.obs = row["Observações"] || "";
    });

    salvarBlocos(blocos);
    alert("Leitura importada com sucesso!");
    renderizarBlocoIndividual();
  };

  reader.readAsArrayBuffer(file);
}

function exportarDados() {
  const dados = localStorage.getItem("blocos") || "[]";
  const blob = new Blob([dados], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "blocos_hidrometro.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importarDados(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const dados = JSON.parse(e.target.result);
      localStorage.setItem("blocos", JSON.stringify(dados));
      alert("Dados importados com sucesso!");
      location.reload();
    } catch (error) {
      alert("Erro ao importar dados. Verifique o arquivo.");
    }
  };
  reader.readAsText(file);
}

// ============== RESET ==============
function resetarBlocoPerguntar() {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const blocos = carregarBlocos();
  const bloco = blocos[id];
  if (!bloco) return;

  const count = bloco.leitura_atual?.length || 0;
  if (confirm(`Isso vai apagar a leitura atual e histórico do bloco "${bloco.nome}" (${count} apartamentos). Deseja continuar?`)) {
    resetarBloco(id);
  }
}
function resetarBloco(id) {
  const blocos = carregarBlocos();
  const bloco = blocos[id];
  if (!bloco) return;

  bloco.leitura_atual = [];
  bloco.historico = {};
  // mantém tarifaConfig do bloco
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
  alert("Bloco resetado.");
}
/* ==================== BOLETOS ==================== */
/* Preenche o <select> de origem com os meses do histórico */
function popularOrigemDadosBoletos(selectEl, bloco) {
  // opção padrão já é "atual"
  const meses = Object.keys(bloco.historico || {}).sort().reverse();
  meses.forEach(m => {
    const opt = document.createElement('option');
    opt.value = `hist:${m}`;
    opt.textContent = `Histórico ${formatarMesLabel(m)}`;
    selectEl.appendChild(opt);
  });
}

/* Divide um array em chunks de N itens (para 2 por página) */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* Formata número em BRL */
function brl(n) {
  const num = Number(n||0);
  return num.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

/* Render principal da página de boletos */
function renderizarBoletosPage() {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const blocos = carregarBlocos();
  const bloco = blocos[id];
  if (!bloco) {
    document.getElementById('boletos-root').innerHTML =
      `<div style="padding:20px">Bloco não encontrado.</div>`;
    return;
  }

  // controles
  const selOrigem = document.getElementById('origem-dados');
  const inpVenc = document.getElementById('vencimento');
  const inpFiltro = document.getElementById('filtro-responsavel');

  // defaults
  if (!inpVenc.value) {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    inpVenc.valueAsDate = d; // vencimento padrão = +15 dias
  }
  if (selOrigem && selOrigem.options.length === 1) {
    popularOrigemDadosBoletos(selOrigem, bloco);
  }

  // seleciona fonte de dados
  let dados = [];
  const origem = selOrigem ? selOrigem.value : "atual";
  if (origem === "atual") {
    dados = (bloco.leitura_atual || []).slice();
  } else if (origem.startsWith("hist:")) {
    const mes = origem.split(":")[1];
    dados = (bloco.historico?.[mes] || []).slice();
  }

  // filtro (opcional)
  const filtro = (inpFiltro?.value || "").trim().toLowerCase();
  if (filtro) {
    dados = dados.filter(a => (a.responsavel||"").toLowerCase().includes(filtro));
  }

  // ordena por número do hidrômetro
  dados.sort((a,b)=> String(a.numero).localeCompare(String(b.numero), 'pt-BR', {numeric:true}));

  // cria páginas com 2 boletos por folha
  const grupos = chunk(dados, 2);
  const root = document.getElementById('boletos-root');
  root.innerHTML = "";

  const vencLabel = (() => {
    const v = inpVenc.valueAsDate || new Date(inpVenc.value);
    if (!v || isNaN(v)) return "";
    return v.toLocaleDateString('pt-BR');
  })();

  grupos.forEach(dupla => {
    const sheet = document.createElement('section');
    sheet.className = 'boleto-sheet';

    // top half
    sheet.appendChild(criarBoletoHalf(dupla[0], vencLabel, bloco));

    // cut line
    const cut = document.createElement('div');
    cut.className = 'cut-line';
    cut.innerHTML = `<span>— — — — — — — — — — — — — —  ✂  — — — — — — — — — — — — — —</span>`;
    sheet.appendChild(cut);

    // bottom half
    sheet.appendChild(criarBoletoHalf(dupla[1], vencLabel, bloco));

    root.appendChild(sheet);
  });

  // se não houver dados, mostra aviso
  if (dados.length === 0) {
    root.innerHTML = `<div style="padding:20px">Nenhum dado para gerar boletos.</div>`;
  }
}

/* Cria a metade do boleto (um apartamento) */
function criarBoletoHalf(apt, vencLabel, bloco) {
  const half = document.createElement('div');
  half.className = 'boleto-half';

  if (!apt) {
    // metade vazia (para páginas com apenas 1 boleto)
    half.innerHTML = `<div class="boleto-head"><div class="apt">&nbsp;</div><div class="vcto">&nbsp;</div></div>
                      <div class="boleto-lines"></div>
                      <div class="boleto-total">
                        <div class="cell">TOTAL</div>
                        <div class="cell">VALOR &gt;</div>
                        <div class="cell" style="grid-column: span 2;">&nbsp;</div>
                      </div>
                      <div class="boleto-obs"><div class="label">OBS:</div><div class="area"></div></div>`;
    return half;
  }

  const valor = Number(apt.total_rs || 0);

  half.innerHTML = `
    <div class="boleto-head">
      <div class="apt">${escapeHtml(String(apt.numero || "APTO"))}</div>
      <div class="vcto">Vencimento &gt; ${vencLabel || "--/--/----"}</div>
    </div>

    <div class="boleto-lines"></div>

    <div class="boleto-total">
      <div class="cell">TOTAL</div>
      <div class="cell">VALOR &gt;</div>
      <div class="cell" style="min-width:120px; text-align:right;">${brl(valor)}</div>
      <div class="cell" style="min-width:40px;">&nbsp;</div>
    </div>

    <div class="boleto-obs">
      <div class="label">OBS:</div>
      <div class="area">${escapeHtml(apt.obs || "")}</div>
    </div>
  `;
  return half;
}

/* botão Atualizar (nos controles da página) */
function atualizarBoletos() {
  renderizarBoletosPage();
}

/* pequena ajuda p/ escapar HTML */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* hook na carga: se estiver em boletos.html, renderiza */
document.addEventListener("DOMContentLoaded", () => {
  if (location.pathname.endsWith("boletos.html")) {
    renderizarBoletosPage();
  }
});




