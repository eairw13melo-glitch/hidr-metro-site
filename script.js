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
    return JSON.parse(localStorage.getItem(key)) || [];
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


// ============== AUTH BÁSICA ==============
// A lógica de autenticação está em login-seguro.js.
// Mantendo apenas funções de utilidade.

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
	
	// Função para recalcular o valor de todos os apartamentos no bloco
	function recalcularValoresDoBloco(blocoIndex) {
	  const blocos = carregarBlocos();
	  const bloco = blocos[blocoIndex];
	  if (!bloco) return;
	
	  const tarifa = getTarifa(bloco);
	  bloco.leitura_atual.forEach(apt => {
	    const valorBase = calcularValorEscalonado(apt.total_m3, tarifa);
	    apt.total_rs = valorBase.toFixed(2);
	  });
	
	  salvarBlocos(blocos);
	  calcularRateioSabesp(blocoIndex); // Chama o rateio da Sabesp após o recalculo base
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

	  // Página de login: a lógica de login está em login-seguro.js
	  if (document.getElementById("login-form")) return;

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
      obs: "",
      // Novo campo para observação individual do boleto
      obs_boleto: ""
    });
  }

  blocos.push({
    nome, endereco, sindico,
    leitura_atual,
    historico: {},
    tarifaConfig: { ...DEFAULT_TARIFA }, // 👈 tarifas independentes por bloco
// Novos campos para boletos (padrão do bloco)
	    contaSabesp: 0.00, // Novo campo para o valor da conta Sabesp
	    boletoConfig: {
      servico_leitura_rs: 6.25, // Valor padrão do modelo
      condominio_rs: 50.00, // Valor padrão do modelo
      multas_outros_rs: 0.00,
      obs_geral: "MULTA ATRASO BOLETO R$5,00\nTX RELIGAÇÃO DE AGUA R$20,00\nMULTA INFRAÇÃO DE NORMAS R$20,00\nDOIS BOLETOS DE ÁGUA ATRASADOS RESULTARÁ NO CORTE DÁ ÁGUA"
    }
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
	  if (!bloco.contaSabesp) bloco.contaSabesp = 0.00; // Garante o campo da conta Sabesp
  if (!bloco.boletoConfig) {
    bloco.boletoConfig = {
      servico_leitura_rs: 6.25,
      condominio_rs: 50.00,
      multas_outros_rs: 0.00,
      obs_geral: "MULTA ATRASO BOLETO R$5,00\nTX RELIGAÇÃO DE AGUA R$20,00\nMULTA INFRAÇÃO DE NORMAS R$20,00\nDOIS BOLETOS DE ÁGUA ATRASADOS RESULTARÁ NO CORTE DÁ ÁGUA"
    };
  }
// Garante que todos os apartamentos tenham o campo obs_boleto
	  bloco.leitura_atual = bloco.leitura_atual.map(apt => {
	    if (!apt.obs_boleto) apt.obs_boleto = "";
	    return apt;
	  });
	  salvarBlocos(blocos);
	
	  // Chama a função de cálculo principal após a renderização
	  calcularRateioSabesp(id);

  container.innerHTML = `
    <div class="bloco">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2>${bloco.nome}</h2>
        <div class="acoes">
          <button type="button" onclick="editarInformacoesBloco(${id})">✏️ Editar</button>
          <button type="button" onclick="gerarExplicacaoWhatsApp(${id})" style="background-color: #25D366;">💬 Explicar Cálculo</button>
        </div>
      </div>
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

	      <h3 style="margin-top:10px;">Configurações de Boleto 🧾</h3>
	      <form class="boleto-form" onsubmit="return false;">
	        <label for="contaSabesp">Valor da Conta Sabesp (R$):</label>
	        <input type="number" id="contaSabesp" step="0.01" placeholder="Ex: 1500.00" class="input-curto" onchange="salvarContaSabesp();" />
        <label for="boleto-servico-leitura">Serviço de Leitura (R$):</label>
        <input type="number" step="0.01" id="boleto-servico-leitura" class="input-curto">

        <label for="boleto-condominio">Condomínio (R$):</label>
        <input type="number" step="0.01" id="boleto-condominio" class="input-curto">

        <label for="boleto-multas-outros">Multas / Outros (R$):</label>
        <input type="number" step="0.01" id="boleto-multas-outros" class="input-curto">

        <label for="boleto-obs-geral">Observações Gerais (para todos os boletos):</label>
        <textarea id="boleto-obs-geral" rows="4"></textarea>

        <button type="button" onclick="salvarBoletoConfigDoBloco(${id})">💾 Salvar Configurações de Boleto</button>
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
	  // Preencher form de boleto
	  preencherBoletoConfigForm(bloco);
	  // Atualizar totais da tabela
	  atualizarTotais(id);
	}

function preencherBoletoConfigForm(bloco) {
  const b = bloco.boletoConfig;
  // Novo campo Conta Sabesp
  const contaSabespInput = document.getElementById("contaSabesp");
  if (contaSabespInput) {
    contaSabespInput.value = bloco.contaSabesp.toFixed(2);
  }
  
  document.getElementById("boleto-servico-leitura").value = b.servico_leitura_rs;
  document.getElementById("boleto-condominio").value = b.condominio_rs;
  document.getElementById("boleto-multas-outros").value = b.multas_outros_rs;
  document.getElementById("boleto-obs-geral").value = b.obs_geral;
}

function salvarBoletoConfigDoBloco(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  bloco.boletoConfig = {
    servico_leitura_rs: Number(document.getElementById("boleto-servico-leitura").value) || 0,
    condominio_rs: Number(document.getElementById("boleto-condominio").value) || 0,
    multas_outros_rs: Number(document.getElementById("boleto-multas-outros").value) || 0,
    obs_geral: document.getElementById("boleto-obs-geral").value
  };

  salvarBlocos(blocos);
  showToast("Configurações de boleto salvas!");
  renderizarBlocoIndividual();
}

function preencherTarifaForm(bloco) {
  const t = getTarifa(bloco);
  document.getElementById("tarifa-minimo-bloco").value = t.minimo;
  document.getElementById("tarifa-11-20-bloco").value = t.faixa_11_20;
  document.getElementById("tarifa-21-50-bloco").value = t.faixa_21_50;
}

function editarInformacoesBloco(id) {
  const blocos = carregarBlocos();
  const bloco = blocos[id];
  if (!bloco) { alert("Bloco não encontrado."); return; }

  const novoNome = prompt("Novo nome do bloco:", bloco.nome);
  if (novoNome === null) return; // Cancelado

  const novoEndereco = prompt("Novo endereço do bloco:", bloco.endereco || "");
  if (novoEndereco === null) return; // Cancelado

  const novoSindico = prompt("Novo síndico:", bloco.sindico || "");
  if (novoSindico === null) return; // Cancelado

  // Verifica se o novo nome já existe em outro bloco
  const nomeExiste = blocos.some((b, index) => index !== id && b.nome.toLowerCase() === novoNome.toLowerCase());
  if (nomeExiste) {
    alert("Já existe um bloco com esse nome.");
    return;
  }

  bloco.nome = novoNome;
  bloco.endereco = novoEndereco;
  bloco.sindico = novoSindico;

  salvarBlocos(blocos);
  renderizarBlocoIndividual();
  showToast("Informações do bloco atualizadas!");
}

function salvarTarifaDoBloco(blocoIndex) {
	  const blocos = carregarBlocos();
	  const bloco = blocos[blocoIndex];
	
	  setTarifa(bloco, {
	    minimo: document.getElementById("tarifa-minimo-bloco").value,
	    faixa_11_20: document.getElementById("tarifa-11-20-bloco").value,
	    faixa_21_50: document.getElementById("tarifa-21-50-bloco").value
	  });
	
	  salvarBlocos(blocos);
	  recalcularValoresDoBloco(blocoIndex); // Recalcula todos os valores e faz o rateio da Sabesp
	  showToast("Tarifas salvas com sucesso!");
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
          <th>Obs (Leitura)</th>
          <th>Obs (Boleto)</th>
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
            <td><input type="text" value="${apt.obs_boleto}" onchange="editarCampo(${blocoIndex}, ${i}, 'obs_boleto', this.value)"></td>
            <td>
              <button type="button" onclick="salvarApartamentoDireto(${blocoIndex}, ${i})">💾</button>
              <button type="button" class="btn-danger" onclick="removerApartamento(${blocoIndex}, ${i})">🗑️</button>
            </td>
          </tr>
        `).join("")}
        <tr style="background-color: var(--cinza-medio); font-weight: bold;">
          <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL:</td>
          <td id="total-m3-${blocoIndex}">0</td>
          <td id="total-rs-${blocoIndex}">R$ 0.00</td>
          <td colspan="3"></td>
        </tr>
      </tbody>
    </table>
  `;
}

function gerarHistorico(bloco) {
  const historico = bloco.historico || {};
  const meses = Object.keys(historico).sort().reverse();
  if (meses.length === 0) return `<div class="bloco"><p>Nenhuma leitura registrada ainda.</p></div>`;

  const id = Number(new URLSearchParams(location.search).get("id"));

  return meses.map(mes => `
    <div class="bloco">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4>📅 ${formatarMesLabel(mes)}</h4>
        <button class="btn-danger-outline" onclick="excluirHistorico(${id}, '${mes}')">🗑️ Excluir Histórico</button>
      </div>
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
          <tr style="background-color: var(--cinza-medio); font-weight: bold;">
            <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL:</td>
            <td>${historico[mes].reduce((acc, apt) => acc + (Number(apt.total_m3) || 0), 0).toFixed(2)}</td>
            <td>R$ ${historico[mes].reduce((acc, apt) => acc + (parseFloat(apt.total_rs) || 0), 0).toFixed(2)}</td>
            <td></td>
          </tr>
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
	  const valorBase = calcularValorEscalonado(apt.total_m3, tarifa);
	  apt.total_rs = valorBase.toFixed(2);
	
	  salvarBlocos(blocos);
	  calcularRateioSabesp(blocoIndex); // Recalcula o rateio da Sabesp após a alteração
	
	  // Atualiza UI
  const m3El = document.getElementById(`m3-${blocoIndex}-${aptIndex}`);
  const rsEl = document.getElementById(`rs-${blocoIndex}-${aptIndex}`);
  if (m3El) m3El.textContent = apt.total_m3;
  if (rsEl) rsEl.value = `R$ ${apt.total_rs}`;
  
  // Atualiza totais
  atualizarTotais(blocoIndex);
}

function editarCampo(blocoIndex, aptIndex, campo, valor) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].leitura_atual[aptIndex];
  apt[campo] = campo.includes("leitura") ? (Number(valor) || 0) : valor;
  salvarBlocos(blocos);
}

// ============== LÓGICA SABESP ==============
	function salvarContaSabesp() {
	  const id = Number(new URLSearchParams(location.search).get("id"));
	  const blocos = carregarBlocos();
	  const bloco = blocos[id];
	  if (!bloco) return;
	
	  const contaSabespInput = document.getElementById("contaSabesp");
	  const novoValor = parseFloat(contaSabespInput.value) || 0;
	
	  bloco.contaSabesp = novoValor;
	  salvarBlocos(blocos);
	  calcularRateioSabesp(id);
	}
	
	function calcularRateioSabesp(blocoIndex) {
	  const blocos = carregarBlocos();
	  const bloco = blocos[blocoIndex];
	  if (!bloco) return;
	
	  const contaSabesp = bloco.contaSabesp || 0;
	  const apartamentos = bloco.leitura_atual || [];
	  const tarifa = getTarifa(bloco);
	
	  // 1. Recalcula o valor base de cada apartamento
	  let totalArrecadadoBase = 0;
	  apartamentos.forEach(apt => {
	    const valorBase = calcularValorEscalonado(apt.total_m3, tarifa);
	    apt.total_rs_base = valorBase.toFixed(2); // Salva o valor base
	    apt.total_rs = valorBase.toFixed(2); // Inicializa o valor final com o base
	    totalArrecadadoBase += valorBase;
	  });
	
	  const diferenca = contaSabesp - totalArrecadadoBase;
	
	  if (diferenca > 0.01) { // Falta dinheiro (débito)
	    // Distribui a diferença proporcionalmente ao consumo (m³)
	    const totalM3 = apartamentos.reduce((acc, apt) => acc + apt.total_m3, 0);
	    let totalRateado = 0;
	
	    apartamentos.forEach(apt => {
	      if (totalM3 > 0) {
	        const proporcao = apt.total_m3 / totalM3;
	        const rateio = diferenca * proporcao;
	        const novoTotal = parseFloat(apt.total_rs) + rateio;
	        apt.total_rs = novoTotal.toFixed(2);
	        totalRateado += rateio;
	      }
	    });
	
	    // Ajuste de arredondamento (se houver)
	    const diferencaRateada = diferenca - totalRateado;
	    if (diferencaRateada > 0.01) {
	      // Adiciona o restante ao primeiro apartamento
	      apartamentos[0].total_rs = (parseFloat(apartamentos[0].total_rs) + diferencaRateada).toFixed(2);
	    }
	
	    salvarBlocos(blocos);
	    renderizarBlocoIndividual(); // Força a re-renderização para atualizar a tabela
	
	    showToast(`⚠️ Débito de R$ ${diferenca.toFixed(2)} na conta Sabesp. O valor foi rateado proporcionalmente ao consumo.`, true);
	
	  } else if (diferenca < -0.01) { // Sobra dinheiro (crédito)
	    const sobra = Math.abs(diferenca);
	    showToast(`✅ Sobra de R$ ${sobra.toFixed(2)} no cálculo da conta Sabesp.`, false);
	    // Não altera os valores individuais, apenas informa a sobra
	  }
	
	  // Atualiza a tabela com os valores (se a função de renderização não for chamada)
	  apartamentos.forEach((apt, aptIndex) => {
	    const rsEl = document.getElementById(`rs-${blocoIndex}-${aptIndex}`);
	    if (rsEl) rsEl.value = `R$ ${apt.total_rs}`;
	  });
	  
	  // Atualiza totais
	  atualizarTotais(blocoIndex);
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

function excluirHistorico(blocoIndex, mesKey) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  if (!bloco) { alert("Bloco não encontrado."); return; }

  const mesLabel = formatarMesLabel(mesKey);
  if (!confirm(`Tem certeza que deseja excluir o histórico de leitura do mês ${mesLabel} do bloco "${bloco.nome}"?`)) return;

  delete bloco.historico[mesKey];
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
  showToast(`Histórico de ${mesLabel} excluído com sucesso!`);
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
	    obs: "",
	    // Garante que o campo de rateio não seja transferido para a próxima leitura
	    total_rs_base: 0
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

function gerarTemplateImportacao() {
  checarXLSX(() => {
    const worksheetData = [
      ["Hidrômetro Nº","Responsável","Leitura Anterior","Leitura Atual","Observações"],
      ["101-A", "João da Silva", 0, 0, "Exemplo de preenchimento"],
      ["102-B", "Maria de Souza", 10, 15, ""]
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "Modelo_Importacao_Leitura.xlsx");
  });
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
	    calcularRateioSabesp(id); // Recalcula o rateio da Sabesp após a importação
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

/* ==================== BOLETOS (robusto) ==================== */
function popularOrigemDadosBoletos(selectEl, bloco) {
  const meses = Object.keys(bloco.historico || {}).sort().reverse();
  meses.forEach(m => {
    const opt = document.createElement('option');
    opt.value = `hist:${m}`;
    opt.textContent = `Histórico ${formatarMesLabel(m)}`;
    selectEl.appendChild(opt);
  });
}
function chunk(arr, size) { const out=[]; for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }
function brl(n) { return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function escapeHtml(str){return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}

function renderizarBoletosPage() {
  const root = document.getElementById('boletos-root');
  if (!root) return;

  const idParam = new URLSearchParams(location.search).get("id");
  const id = Number(idParam);
  if (Number.isNaN(id)) {
    root.innerHTML = `<div style="padding:20px">ID do bloco ausente na URL. Abra os boletos pelo botão dentro do bloco.</div>`;
    return;
  }

  const blocos = carregarBlocos();
  const bloco = blocos[id];
  if (!bloco) {
    root.innerHTML = `<div style="padding:20px">Bloco (id=${escapeHtml(idParam)}) não encontrado.</div>`;
    return;
  }

  // controles
  const selOrigem = document.getElementById('origem-dados');
  const inpVenc = document.getElementById('vencimento');
  const inpFiltro = document.getElementById('filtro-responsavel');

  // defaults
  if (inpVenc && !inpVenc.value) {
    const d = new Date(); d.setDate(d.getDate()+15); inpVenc.valueAsDate = d;
  }
  if (selOrigem && selOrigem.options.length === 1) popularOrigemDadosBoletos(selOrigem, bloco);

  // fonte de dados
  let dados = [];
  const origem = selOrigem ? selOrigem.value : "atual";
  let mesReferencia = mesAtual(); // Padrão para o mês atual
  if (origem === "atual") {
    dados = (bloco.leitura_atual || []).slice();
  } else if (origem.startsWith("hist:")) {
    const mes = origem.split(":")[1];
    dados = (bloco.historico?.[mes] || []).slice();
    mesReferencia = mes;
  }

  const mesReferenciaLabel = formatarMesLabel(mesReferencia).toUpperCase();

  // filtro
  const filtro = (inpFiltro?.value || "").trim().toLowerCase();
  if (filtro) dados = dados.filter(a => (a.responsavel||"").toLowerCase().includes(filtro));

  // ordenar
  dados.sort((a,b)=> String(a.numero).localeCompare(String(b.numero),'pt-BR',{numeric:true}));

  // quebrar em folhas (2 por)
  const grupos = chunk(dados, 2);
  root.innerHTML = "";

  const vencLabel = (() => {
    if (!inpVenc || !inpVenc.value) return "";
    const v = inpVenc.valueAsDate || new Date(inpVenc.value);
    return isNaN(v) ? "" : v.toLocaleDateString('pt-BR');
  })();

  if (grupos.length === 0) {
    root.innerHTML = `<div style="padding:20px">Nenhum dado para gerar boletos.</div>`;
    return;
  }

  // Criar CAPA
  const capa = document.createElement('section');
  capa.className = 'boleto-capa';
  const totalSabesp = bloco.contaSabesp || 0;
  capa.innerHTML = `
    <div class="capa-content">
      <h1>Boletos de Água</h1>
      <h2>${escapeHtml(bloco.nome || 'Bloco')}</h2>
      <div class="capa-info">
        <p><strong>Endereço:</strong> ${escapeHtml(bloco.endereco || '-')}</p>
        <p><strong>Síndico:</strong> ${escapeHtml(bloco.sindico || '-')}</p>
        <p><strong>Mês de Referência:</strong> ${mesReferenciaLabel}</p>
        <p><strong>Vencimento:</strong> ${vencLabel || '--/--/----'}</p>
      </div>
      <div class="capa-destaque">
        <p class="capa-label">Valor Total da Conta Sabesp</p>
        <p class="capa-valor">${brl(totalSabesp)}</p>
      </div>
      <div class="capa-rodape">
        <p>Total de apartamentos: ${dados.length}</p>
        <p>Data de emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  `;
  root.appendChild(capa);

  grupos.forEach(dupla => {
    const sheet = document.createElement('section');
    sheet.className = 'boleto-sheet';
    
    // Linha de corte antes do primeiro boleto (sem tesoura)
    const cutTop = document.createElement('div');
    cutTop.className = 'cut-line no-scissor';
    cutTop.innerHTML = `<span>— — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —</span>`;
    sheet.appendChild(cutTop);
    
    sheet.appendChild(criarBoletoHalf(dupla[0], vencLabel, mesReferenciaLabel, bloco));
    
    // Linha de corte entre os boletos (com tesoura)
    const cut = document.createElement('div');
    cut.className = 'cut-line';
    cut.innerHTML = `<span>— — — — — — — — — — — — — —  ✂  — — — — — — — — — — — — — —</span>`;
    sheet.appendChild(cut);
    
    sheet.appendChild(criarBoletoHalf(dupla[1], vencLabel, mesReferenciaLabel, bloco));
    
    // Linha de corte após o segundo boleto (sem tesoura)
    const cutBottom = document.createElement('div');
    cutBottom.className = 'cut-line no-scissor';
    cutBottom.innerHTML = `<span>— — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —</span>`;
    sheet.appendChild(cutBottom);
    
    root.appendChild(sheet);
  });

  // Criar CONTRACAPA
  const contracapa = document.createElement('section');
  contracapa.className = 'boleto-contracapa';
  
  // Calcular totais
  let totalM3 = 0;
  let totalValor = 0;
  dados.forEach(apt => {
    totalM3 += Number(apt.total_m3) || 0;
    totalValor += Number(apt.total_rs) || 0;
  });
  
  contracapa.innerHTML = `
    <div class="contracapa-content">
      <h2>Resumo da Cobrança</h2>
      <div class="contracapa-info">
        <h3>${escapeHtml(bloco.nome || 'Bloco')}</h3>
        <p><strong>Mês de Referência:</strong> ${mesReferenciaLabel}</p>
      </div>
      <div class="contracapa-totais">
        <div class="total-item">
          <span class="total-label">Total de Apartamentos:</span>
          <span class="total-valor">${dados.length}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Consumo Total (m³):</span>
          <span class="total-valor">${totalM3.toFixed(2)}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Valor Total Arrecadado:</span>
          <span class="total-valor">${brl(totalValor)}</span>
        </div>
        <div class="total-item destaque">
          <span class="total-label">Conta Sabesp:</span>
          <span class="total-valor">${brl(bloco.contaSabesp || 0)}</span>
        </div>
        <div class="total-item ${(totalValor - (bloco.contaSabesp || 0)) >= 0 ? 'positivo' : 'negativo'}">
          <span class="total-label">Diferença:</span>
          <span class="total-valor">${brl(totalValor - (bloco.contaSabesp || 0))}</span>
        </div>
      </div>
      <div class="contracapa-obs">
        <p><strong>Observações:</strong></p>
        <p>Este documento contém os boletos de água referentes ao mês de ${mesReferenciaLabel}.</p>
        <p>Em caso de dúvidas, entre em contato com o síndico: ${escapeHtml(bloco.sindico || '-')}</p>
      </div>
      <div class="contracapa-rodape">
        <p>Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
    </div>
  `;
  root.appendChild(contracapa);
}

function criarBoletoHalf(apt, vencLabel, mesReferenciaLabel, bloco) {
  const half = document.createElement('div');
  half.className = 'boleto-half';

  if (!apt) {
    half.innerHTML = `
      <div class="boleto-header-row">
        <div class="boleto-apt-info">APTO</div>
        <div class="boleto-vencimento">Vencimento > ${vencLabel || "--/--/----"}</div>
      </div>
      <div class="boleto-header-row">
        <div class="boleto-responsavel-label">RESPONSÁVEL</div>
        <div class="boleto-responsavel-nome">&nbsp;</div>
      </div>
      <div class="boleto-header-row">
        <div class="boleto-mes-ref-label">MÊS E ANO DE REFERÊNCIA</div>
        <div class="boleto-mes-ref-valor">${mesReferenciaLabel || "--/----"}</div>
      </div>
      <div class="boleto-lines-placeholder"></div>
      <div class="boleto-total-placeholder"></div>
      <div class="boleto-obs-placeholder"></div>
      <div class="boleto-assinatura">
        <div class="assinatura-linha">
          <div class="assinatura-label">SÍNDICO:</div>
          <div class="assinatura-campo">${escapeHtml(bloco.sindico || '_______________________________________')}</div>
        </div>
      </div>
    `;
    return half;
  }

  const bConfig = bloco.boletoConfig || {};
  const servicoLeitura = Number(bConfig.servico_leitura_rs || 0);
  const condominio = Number(bConfig.condominio_rs || 0);
  const multasOutros = Number(bConfig.multas_outros_rs || 0);
  const ttConsumo = Number(apt.total_rs || 0);
  const total = servicoLeitura + ttConsumo + condominio + multasOutros;

  const obsGeral = bConfig.obs_geral || "";
  const obsApto = apt.obs_boleto || "";
  const obsCompleta = obsGeral + (obsGeral && obsApto ? "\n" : "") + obsApto;

  // Simulação de datas de leitura (não temos as datas reais, então usamos um placeholder)
  const dataLeituraAnt = "06/10/2025"; // Placeholder
  const dataLeituraAtual = "04/11/2025"; // Placeholder

  half.innerHTML = `
    <div class="boleto-header-row">
      <div class="boleto-apt-info">${escapeHtml(String(apt.numero || "APTO"))}</div>
      <div class="boleto-vencimento">Vencimento > ${vencLabel || "--/--/----"}</div>
    </div>
    <div class="boleto-header-row">
      <div class="boleto-responsavel-label">RESPONSÁVEL</div>
      <div class="boleto-responsavel-nome">${escapeHtml(apt.responsavel || "-")}</div>
    </div>
    <div class="boleto-header-row">
      <div class="boleto-mes-ref-label">MÊS E ANO DE REFERÊNCIA</div>
      <div class="boleto-mes-ref-valor">${mesReferenciaLabel || "--/----"}</div>
    </div>

    <div class="boleto-lines">
      <div class="line-item">
        <div class="item-label">LEITURA HIDRÔMETRO ANTERIOR</div>
        <div class="item-date">${dataLeituraAnt}</div>
        <div class="item-value">${apt.leitura_anterior}</div>
        <div class="item-unit"></div>
      </div>
      <div class="line-item">
        <div class="item-label">LEITURA HIDRÔMETRO ATUAL</div>
        <div class="item-date">${dataLeituraAtual}</div>
        <div class="item-value">${apt.leitura_atual}</div>
        <div class="item-unit">${apt.total_m3} M³</div>
      </div>
      <div class="line-item">
        <div class="item-label">SERVIÇO DE LEITURA HIDRÔMETRO</div>
        <div class="item-date">VALOR ></div>
        <div class="item-value-rs">${brl(servicoLeitura)}</div>
      </div>
      <div class="line-item">
        <div class="item-label">TT CONSUMO</div>
        <div class="item-date">VALOR ></div>
        <div class="item-value-rs">${brl(ttConsumo)}</div>
      </div>
      <div class="line-item">
        <div class="item-label">CONDOMÍNIO</div>
        <div class="item-date">VALOR ></div>
        <div class="item-value-rs">${brl(condominio)}</div>
      </div>
      <div class="line-item">
        <div class="item-label">MULTAS / OUTROS</div>
        <div class="item-date">VALOR ></div>
        <div class="item-value-rs">${brl(multasOutros)}</div>
      </div>
      <div class="line-item total-line">
        <div class="item-label">TOTAL</div>
        <div class="item-date">VALOR ></div>
        <div class="item-value-rs">${brl(total)}</div>
      </div>
    </div>

    <div class="boleto-obs">
      <div class="label">OBS:</div>
      <div class="area">${escapeHtml(obsCompleta).replace(/\n/g, '<br>')}</div>
    </div>
    <div class="boleto-assinatura">
      <div class="assinatura-linha">
        <div class="assinatura-label">RECEBIDO POR:</div>
        <div class="assinatura-campo">_______________________________________</div>
      </div>
      <div class="assinatura-linha">
        <div class="assinatura-label">DATA:</div>
        <div class="assinatura-campo-data">____/____/________</div>
      </div>
    </div>
  `;
  return half;
}

// botão Atualizar (nos controles da página de boletos)
function gerarExplicacaoWhatsApp(id) {
  const blocos = carregarBlocos();
  const bloco = blocos[id];
  if (!bloco) { alert("Bloco não encontrado."); return; }

  const tarifa = getTarifa(bloco);
  const { minimo, faixa_11_20, faixa_21_50 } = tarifa;

  let texto = `*Explicação do Cálculo da Conta de Água - Bloco ${bloco.nome}*\n\n`;
  texto += `O cálculo da conta de água segue uma tabela escalonada, baseada no consumo em metros cúbicos (m³).\n\n`;

  texto += `*1. Consumo Mínimo (até 10 m³):*\n`;
  texto += `  - Para um consumo de até 10 m³, o valor fixo a ser pago é de *R$ ${minimo.toFixed(2).replace('.', ',')}*.\n\n`;

  texto += `*2. Faixa Intermediária (de 11 m³ a 20 m³):*\n`;
  texto += `  - Se o consumo ultrapassar 10 m³, cada m³ extra (até o limite de 20 m³) é cobrado a *R$ ${faixa_11_20.toFixed(2).replace('.', ',')}*.\n`;
  texto += `  - *Fórmula:* Valor Mínimo + (m³ consumidos acima de 10) * R$ ${faixa_11_20.toFixed(2).replace('.', ',')}\n\n`;

  texto += `*3. Faixa Superior (acima de 20 m³):*\n`;
  texto += `  - Se o consumo ultrapassar 20 m³, cada m³ extra (acima de 20 m³) é cobrado a *R$ ${faixa_21_50.toFixed(2).replace('.', ',')}*.\n`;
  texto += `  - *Fórmula:* Valor Mínimo + (10 * R$ ${faixa_11_20.toFixed(2).replace('.', ',')}) + (m³ consumidos acima de 20) * R$ ${faixa_21_50.toFixed(2).replace('.', ',')}\n\n`;

  texto += `*Exemplo de Cálculo (Consumo de 25 m³):*\n`;
  texto += `  - *1ª Faixa (0 a 10 m³):* R$ ${minimo.toFixed(2).replace('.', ',')}\n`;
  texto += `  - *2ª Faixa (11 a 20 m³):* 10 m³ * R$ ${faixa_11_20.toFixed(2).replace('.', ',')} = R$ ${(10 * faixa_11_20).toFixed(2).replace('.', ',')}\n`;
  const excedente20 = 25 - 20;
  const valorExcedente20 = excedente20 * faixa_21_50;
  texto += `  - *3ª Faixa (acima de 20 m³):* ${excedente20} m³ * R$ ${faixa_21_50.toFixed(2).replace('.', ',')} = R$ ${valorExcedente20.toFixed(2).replace('.', ',')}\n`;
  const totalExemplo = minimo + (10 * faixa_11_20) + valorExcedente20;
  texto += `  - *Total:* R$ ${totalExemplo.toFixed(2).replace('.', ',')}\n\n`;

  texto += `*Observação:* Estes valores são baseados nas tarifas configuradas para o seu bloco.`;

  // Copia o texto para a área de transferência e abre o WhatsApp
  navigator.clipboard.writeText(texto).then(() => {
    showToast("Texto copiado! Abrindo WhatsApp...");
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(whatsappUrl, '_blank');
  }).catch(err => {
    console.error('Erro ao copiar texto: ', err);
    alert("Erro ao copiar texto. Tente novamente.");
  });
}

function atualizarBoletos(){ 
  try { renderizarBoletosPage(); } 
  catch(e){ console.error(e); alert("Erro ao gerar boletos. Veja o console para detalhes."); } 
}

// Função para calcular o valor total a ser pago
function calcularValor() {
  const consumo = parseFloat(document.getElementById("consumo").value); // Consumo em m³
  const valorMinimo = parseFloat(document.getElementById("valorMinimo").value); // Valor mínimo em R$
  const valorM3 = parseFloat(document.getElementById("valorM3").value); // Valor por m³ excedente

  // Validação: Se algum campo estiver vazio ou inválido
  if (isNaN(consumo) || isNaN(valorMinimo) || isNaN(valorM3)) {
    document.getElementById("valorTotal").value = "Preencha todos os campos corretamente!";
    return;
  }

  let valorTotal = valorMinimo; // Começa com o valor mínimo

  // Se o consumo for maior que 10m³, calcular o excedente
  if (consumo > 10) {
    const excedente = consumo - 10; // Subtrai os 10m³ que já estão inclusos no valor mínimo
    valorTotal += excedente * valorM3; // Soma o valor do excedente
  }

  // Atualiza o campo de valor total
  document.getElementById("valorTotal").value = valorTotal.toFixed(2);
}

// Função para atualizar o texto explicativo e gerar o link do WhatsApp
function atualizarTextoExplicativo() {
  const consumo = parseFloat(document.getElementById("consumo").value); // Consumo em m³
  const valorMinimo = parseFloat(document.getElementById("valorMinimo").value); // Valor mínimo em R$
  const valorM3 = parseFloat(document.getElementById("valorM3").value); // Valor por m³ excedente

  let textoExplicativo = "<h3>Como é feito o cálculo:</h3>";

  // Validação: Se algum campo estiver vazio ou inválido
  if (isNaN(consumo) || isNaN(valorMinimo) || isNaN(valorM3)) {
    textoExplicativo += "<p>Por favor, preencha todos os campos corretamente para calcular o valor.</p>";
    document.getElementById("textoExplicativo").innerHTML = textoExplicativo;
    return;
  }

  // Caso o consumo seja menor ou igual a 10m³
  if (consumo <= 10) {
    textoExplicativo += `<p>Se o consumo for de até 10 m³, o valor a ser pago será o valor mínimo: R$ ${valorMinimo.toFixed(2)}.</p>`;
  } else {
    // Caso o consumo seja maior que 10m³
    const excedente = consumo - 10;
    const valorExcedente = excedente * valorM3;
    const valorTotal = valorMinimo + valorExcedente;

    textoExplicativo += `<p>Se o consumo for superior a 10 m³, o valor excedente será calculado.`;
    textoExplicativo += ` O valor excedente é dado por (Consumo - 10) * Valor por m³.`;
    textoExplicativo += ` Neste exemplo, com um consumo de ${consumo} m³, temos um valor excedente de ${excedente} m³.`;
    textoExplicativo += ` O cálculo do valor excedente será: ${excedente} * R$ ${valorM3.toFixed(2)} = R$ ${valorExcedente.toFixed(2)}.`;
    textoExplicativo += ` O total a ser pago será: R$ ${valorExcedente.toFixed(2)} + R$ ${valorMinimo.toFixed(2)} = R$ ${valorTotal.toFixed(2)}.</p>`;
  }

  // Atualiza o texto explicativo na página
  document.getElementById("textoExplicativo").innerHTML = textoExplicativo;

  // Gerando o link do WhatsApp com o texto explicativo
  const textoParaWhatsapp = encodeURIComponent(textoExplicativo);
  const whatsappUrl = `https://wa.me/?text=${textoParaWhatsapp}`;
  document.getElementById("whatsappLink").href = whatsappUrl;
}




// ============== FUNÇÃO PARA ATUALIZAR TOTAIS ==============
function atualizarTotais(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  if (!bloco) return;
  
  let totalM3 = 0;
  let totalRs = 0;
  
  bloco.leitura_atual.forEach(apt => {
    totalM3 += Number(apt.total_m3) || 0;
    totalRs += parseFloat(apt.total_rs) || 0;
  });
  
  // Atualiza os elementos na UI
  const totalM3El = document.getElementById(`total-m3-${blocoIndex}`);
  const totalRsEl = document.getElementById(`total-rs-${blocoIndex}`);
  
  if (totalM3El) totalM3El.textContent = totalM3.toFixed(2);
  if (totalRsEl) totalRsEl.textContent = `R$ ${totalRs.toFixed(2)}`;
}
