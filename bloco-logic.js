// Lógica de Bloco e UI (bloco-logic.js)

import { carregarBlocos, salvarBlocos, showToast, formatarMesLabel, mesAtual, formatarMoeda, numeroPorExtenso, exportToXLSX } from './utils.js';
import { getTarifa, recalcularValoresDoBloco, calcularValorEscalonado } from './calculos.js';

// ====================================================================
// CRUD DE BLOCOS (Dashboard)
// ====================================================================

export function criarBloco() {
  const nome = prompt("Digite o nome do novo bloco:");
  if (nome) {
    const blocos = carregarBlocos();
    blocos.push({
      nome: nome,
      leitura_atual: [],
      historico: {},
      tarifaConfig: null,
      config: {
        total_m3_sabesp: 0,
        total_rs_sabesp: 0,
        taxa_extra: 0,
        rateio_m3: 0,
        rateio_rs: 0,
        obs_boleto: ""
      }
    });
    salvarBlocos(blocos);
    renderizarListaDeBlocos();
  }
}

export function editarBloco(index) {
  const blocos = carregarBlocos();
  const bloco = blocos[index];
  if (!bloco) return;

  const novoNome = prompt("Digite o novo nome para o bloco:", bloco.nome);
  if (novoNome) {
    bloco.nome = novoNome;
    salvarBlocos(blocos);
    renderizarListaDeBlocos();
  }
}

export function excluirBloco(index) {
  if (confirm("Tem certeza que deseja excluir este bloco e todos os seus dados?")) {
    const blocos = carregarBlocos();
    blocos.splice(index, 1);
    salvarBlocos(blocos);
    renderizarListaDeBlocos();
  }
}

export function renderizarListaDeBlocos() {
  const blocos = carregarBlocos();
  const container = document.getElementById('lista-blocos');
  if (!container) return;

  container.innerHTML = '';

  if (blocos.length === 0) {
    container.innerHTML = '<p style="text-align: center; margin-top: 20px;">Nenhum bloco cadastrado. Clique em "Adicionar Bloco" para começar.</p>';
    return;
  }

  blocos.forEach((bloco, index) => {
    const blocoDiv = document.createElement('div');
    blocoDiv.className = 'bloco';
    blocoDiv.innerHTML = `
      <h2>${bloco.nome}</h2>
      <div class="acoes">
        <button onclick="window.location.href='bloco.html?id=${index}'">Ver Detalhes</button>
        <button onclick="editarBloco(${index})">Editar Nome</button>
        <button class="btn-danger" onclick="excluirBloco(${index})">Excluir</button>
      </div>
    `;
    container.appendChild(blocoDiv);
  });
}

// ====================================================================
// LÓGICA DE BLOCO INDIVIDUAL (bloco.html)
// ====================================================================

// Funções de bloco individual (migradas do script.js)
export function renderizarBlocoIndividual() {
  const blocos = carregarBlocos();
  const id = Number(new URLSearchParams(location.search).get("id"));
  const bloco = blocos[id];

  const container = document.getElementById("bloco-detalhes");
  if (!container) return;

  if (!bloco) {
    container.innerHTML = `<div class="bloco"><h2>Bloco não encontrado.</h2></div>`;
    return;
  }
  
  // Saneamento e inicialização de campos
  if (!bloco.leitura_atual) bloco.leitura_atual = [];
  if (!bloco.historico) bloco.historico = {};
  if (!bloco.tarifaConfig) bloco.tarifaConfig = { ...DEFAULT_TARIFA };
  if (!bloco.contaSabesp) bloco.contaSabesp = 0.00;
  if (!bloco.boletoConfig) {
    bloco.boletoConfig = {
      servico_leitura_rs: 6.25,
      condominio_rs: 50.00,
      multas_outros_rs: 0.00,
      obs_geral: "MULTA ATRASO BOLETO R$5,00\nTX RELIGAÇÃO DE AGUA R$20,00\nMULTA INFRAÇÃO DE NORMAS R$20,00\nDOIS BOLETOS DE ÁGUA ATRASADOS RESULTARÁ NO CORTE DÁ ÁGUA"
    };
  }
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

      <h3 style="margin-top:10px;">Verificação de Cálculo (Boleto) ✅</h3>
      <div id="verificacao-calculo">
        <p>Clique no botão abaixo para verificar se o valor total da conta Sabesp (R$ ${bloco.contaSabesp.toFixed(2)}) está correto com base no rateio.</p>
        <button type="button" onclick="verificarCalculoBoleto(${id})">Verificar Cálculo</button>
        <p id="resultado-verificacao" style="font-weight: bold; margin-top: 5px;"></p>
      </div>

      <div class="acoes">
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

export function adicionarApartamento() {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const blocos = carregarBlocos();
  const bloco = blocos[id];

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
    obs: "",
    obs_boleto: ""
  });

  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

export function removerApartamento(blocoIndex, aptIndex) {
  if (!confirm("Remover este apartamento?")) return;
  const blocos = carregarBlocos();
  blocos[blocoIndex].leitura_atual.splice(aptIndex, 1);
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

export function salvarLeitura(blocoIndex, aptIndex, input) {
  // Esta função não existe no script.js original, mas é um bom nome para a lógica de atualização de campo
  // Vou usar a lógica de atualizarCampo do script.js
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  const apt = bloco.leitura_atual[aptIndex];

  apt.leitura_atual = Number(input.value) || 0;
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
  
  atualizarTotais(blocoIndex);
}

export function resetarBlocoPerguntar() {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const blocos = carregarBlocos();
  const bloco = blocos[id];
  
  if (confirm(`Tem certeza que deseja resetar o bloco "${bloco.nome}"? Isso apagará todas as leituras atuais e o histórico.`)) {
    bloco.leitura_atual = [];
    bloco.historico = {};
    salvarBlocos(blocos);
    renderizarBlocoIndividual();
    showToast("Bloco resetado com sucesso!");
  }
}

// Funções auxiliares internas
function mesAtualLabel() {
  const data = new Date();
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
              onchange="editarCampo(${blocoIndex}, ${i}, 'leitura_anterior', Number(this.value)||0); salvarLeitura(${blocoIndex}, ${i}, document.querySelector('#leitura-atual-${blocoIndex}-${i}'))">
            </td>
            <td><input type="number" class="menor" value="${apt.leitura_atual}" id="leitura-atual-${blocoIndex}-${i}" oninput="salvarLeitura(${blocoIndex}, ${i}, this)"></td>
            <td id="m3-${blocoIndex}-${i}">${apt.total_m3}</td>
            <td><input type="text" id="rs-${blocoIndex}-${i}" class="media" value="R$ ${apt.total_rs}" readonly></td>
            <td><input type="text" value="${apt.obs}" onchange="editarCampo(${blocoIndex}, ${i}, 'obs', this.value)"></td>
            <td><input type="text" value="${apt.obs_boleto}" onchange="editarCampo(${blocoIndex}, ${i}, 'obs_boleto', this.value)"></td>
            <td>
              <button type="button" onclick="salvarApartamentoDireto(${blocoIndex}, ${i})">💾</button>
              <button type="button" onclick="abrirModalCapturaFoto(${blocoIndex}, ${i})">📷</button>
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
  // apt.leitura_anterior = apt.leitura_atual; // Isso não deve ser feito aqui, mas sim ao salvar o mês
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

function salvarLeituraDoMes(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  const mes = mesAtual();

  if (bloco.historico[mes]) {
    if (!confirm(`O histórico para o mês ${formatarMesLabel(mes)} já existe. Deseja sobrescrever?`)) {
      return;
    }
  }

  // 1. Salva a leitura atual no histórico
  bloco.historico[mes] = JSON.parse(JSON.stringify(bloco.leitura_atual)); // Deep copy

  // 2. Atualiza a leitura_anterior para a próxima leitura
  bloco.leitura_atual.forEach(apt => {
    apt.leitura_anterior = apt.leitura_atual;
    apt.leitura_atual = 0; // Zera a leitura atual para o próximo mês
    apt.total_m3 = 0;
    apt.total_rs = 0;
    apt.obs = "";
  });

  salvarBlocos(blocos);
  renderizarBlocoIndividual();
  showToast(`Leitura do mês ${formatarMesLabel(mes)} salva com sucesso!`);
}

function excluirHistorico(blocoIndex, mes) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  if (confirm(`Tem certeza que deseja excluir o histórico do mês ${formatarMesLabel(mes)}?`)) {
    delete bloco.historico[mes];
    salvarBlocos(blocos);
    renderizarBlocoIndividual();
    showToast("Histórico excluído com sucesso!");
  }
}

function atualizarTotais(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  
  const totalM3 = bloco.leitura_atual.reduce((acc, apt) => acc + (Number(apt.total_m3) || 0), 0);
  const totalRS = bloco.leitura_atual.reduce((acc, apt) => acc + (parseFloat(apt.total_rs) || 0), 0);

  const totalM3El = document.getElementById(`total-m3-${blocoIndex}`);
  const totalRSEl = document.getElementById(`total-rs-${blocoIndex}`);

  if (totalM3El) totalM3El.textContent = totalM3.toFixed(2);
  if (totalRSEl) totalRSEl.textContent = formatarMoeda(totalRS);
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

  salvarBlocos(blocos);
  recalcularValoresDoBloco(blocoIndex); // Recalcula todos os valores e faz o rateio da Sabesp
  showToast("Tarifas salvas com sucesso!");
  renderizarBlocoIndividual();
}

function preencherBoletoConfigForm(bloco) {
  const b = bloco.boletoConfig;
  // Campo Conta Sabesp
  const contaSabespInput = document.getElementById("contaSabesp");
  if (contaSabespInput) {
    contaSabespInput.value = bloco.contaSabesp ? bloco.contaSabesp.toFixed(2) : "0.00";
  }
  
  document.getElementById("boleto-servico-leitura").value = b.servico_leitura_rs;
  document.getElementById("boleto-condominio").value = b.condominio_rs;
  document.getElementById("boleto-multas-outros").value = b.multas_outros_rs;
  document.getElementById("boleto-obs-geral").value = b.obs_geral;
}

function salvarBoletoConfigDoBloco(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  bloco.contaSabesp = Number(document.getElementById("contaSabesp").value) || 0;
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
  renderizarBlocoIndividual(); // Força a re-renderização para atualizar a tabela e a verificação
}

function verificarCalculoBoleto(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  const resultadoEl = document.getElementById('resultado-verificacao');
  
  if (!bloco || !resultadoEl) return;

  // 1. Calcular o valor total do rateio (soma dos total_rs de todos os apartamentos)
  const totalRateio = bloco.leitura_atual.reduce((acc, apt) => acc + (parseFloat(apt.total_rs) || 0), 0);
  
  // 2. Obter o valor da conta Sabesp configurado
  const contaSabesp = parseFloat(bloco.contaSabesp) || 0;
  
  // 3. Comparar os valores
  // Usamos um pequeno delta (0.01) para compensar erros de ponto flutuante
  const diferenca = Math.abs(totalRateio - contaSabesp);
  
  if (diferenca < 0.01) {
    resultadoEl.style.color = 'green';
    resultadoEl.textContent = `✅ Cálculo Verificado: O total do rateio (${formatarMoeda(totalRateio)}) é igual ao valor da Conta Sabesp (${formatarMoeda(contaSabesp)}).`;
  } else {
    resultadoEl.style.color = 'red';
    resultadoEl.textContent = `❌ Divergência de Cálculo: O total do rateio (${formatarMoeda(totalRateio)}) é diferente do valor da Conta Sabesp (${formatarMoeda(contaSabesp)}). Diferença: ${formatarMoeda(diferenca)}.`;
  }
}

function gerarExplicacaoWhatsApp(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  
  if (!bloco) return;

  const totalM3 = bloco.leitura_atual.reduce((acc, apt) => acc + (Number(apt.total_m3) || 0), 0);
  const totalRS = bloco.leitura_atual.reduce((acc, apt) => acc + (parseFloat(apt.total_rs) || 0), 0);
  const contaSabesp = parseFloat(bloco.contaSabesp) || 0;
  const diferenca = contaSabesp - totalRS;
  
  let mensagem = `*RESUMO DO RATEIO - ${bloco.nome}*\n\n`;
  mensagem += `Mês de Referência: ${mesAtualLabel()}\n`;
  mensagem += `Consumo Total (m³): ${totalM3.toFixed(2)}\n`;
  mensagem += `Conta Sabesp (R$): ${formatarMoeda(contaSabesp)}\n`;
  mensagem += `Rateio Total (R$): ${formatarMoeda(totalRS)}\n`;
  
  if (Math.abs(diferenca) > 0.01) {
    mensagem += `\n*Diferença (Rateio - Sabesp):* ${formatarMoeda(diferenca)}\n`;
    if (diferenca > 0) {
      mensagem += `*Status:* Sobra de crédito no rateio.\n`;
    } else {
      mensagem += `*Status:* Débito rateado proporcionalmente ao consumo.\n`;
    }
  } else {
    mensagem += `*Status:* Rateio bate com a conta Sabesp.\n`;
  }
  
  mensagem += `\n*Valores Individuais:*\n`;
  bloco.leitura_atual.forEach(apt => {
    mensagem += `Apto ${apt.numero}: ${apt.total_m3}m³ -> ${formatarMoeda(parseFloat(apt.total_rs))}\n`;
  });
  
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(whatsappLink, '_blank');
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

// Funções de Impressão/PDF
export function imprimirRecibo() {
  // Oculta os botões de ação antes de imprimir
  const actions = document.querySelector('#modal-visualizacao-recibo .recibo-actions');
  if (actions) actions.style.display = 'none';
  
  // Imprime o conteúdo do modal
  window.print();
  
  // Reexibe os botões após a impressão (com um pequeno delay para garantir que a impressão seja iniciada)
  setTimeout(() => {
    if (actions) actions.style.display = 'flex';
  }, 500);
}

export function exportarParaPDF() {
  const element = document.getElementById('reciboContainer');
  const nomeRecibo = document.getElementById('reciboNumero').innerText.replace(' ', '_');
  
  // Configurações para o PDF
  const opt = {
    margin: 10,
    filename: `${nomeRecibo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Gera o PDF
  if (window.html2pdf) {
    window.html2pdf().set(opt).from(element).save();
  } else {
    alert("Biblioteca html2pdf não carregada. Verifique a sua conexão ou recarregue a página.");
  }
}

// Funções de Boleto
export function renderizarBoletosPage() {
  // Esta função será migrada do script.js na próxima etapa.
  console.warn("Função renderizarBoletosPage pendente de migração.");
}

export function atualizarBoletos() {
  // Esta função será migrada do script.js na próxima etapa.
  console.warn("Função atualizarBoletos pendente de migração.");
}

// Funções de Importação/Exportação (Correção pendente)
export function exportarLeituraAtual() {
  if (typeof XLSX === 'undefined') {
    showToast("Biblioteca XLSX não carregada.", true);
    return;
  }

  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const blocos = carregarBlocos();
  const bloco = blocos[id];
  if (!bloco) {
    showToast("Bloco não encontrado.", true);
    return;
  }

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
  showToast("Leitura atual exportada com sucesso!");
}

export function importarLeituraAtual(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const blocos = carregarBlocos();
      const id = Number(new URLSearchParams(location.search).get("id"));
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
      showToast("Leitura importada com sucesso!");
      renderizarBlocoIndividual();
    } catch (error) {
      console.error("Erro ao importar leitura:", error);
      showToast(`Erro ao processar o arquivo XLSX: ${error.message}`, true);
    }
    event.target.value = ''; // Limpa o input
  };

  reader.readAsArrayBuffer(file);
}

export function gerarTemplateImportacao() {
  // Esta função será migrada do script.js na próxima etapa.
  console.warn("Função gerarTemplateImportacao pendente de migração.");
}

export function exportarHistorico(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  if (!bloco || !bloco.historico || Object.keys(bloco.historico).length === 0) {
    showToast("Não há histórico para exportar neste bloco.", true);
    return;
  }

  // Prepara os dados para exportação em formato de planilha
  const dataToExport = [["Mês", "Apto", "Responsável", "Leitura Anterior", "Leitura Atual", "Consumo m³", "Valor R$", "Obs"]];
  
  Object.keys(bloco.historico).sort().reverse().forEach(mes => {
    bloco.historico[mes].forEach(apt => {
      dataToExport.push([
        formatarMesLabel(mes),
        apt.numero,
        apt.responsavel,
        apt.leitura_anterior,
        apt.leitura_atual,
        apt.total_m3,
        apt.total_rs,
        apt.obs
      ]);
    });
  });

  const fileName = `historico_${bloco.nome.replace(/\s+/g, "_")}`;
  exportToXLSX(dataToExport, fileName, "Histórico");
  showToast("Histórico exportado para Excel com sucesso!");
}

export function importarHistorico(blocoIndex, event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (typeof importedData !== 'object' || Array.isArray(importedData) || importedData === null) {
        throw new Error("Formato de arquivo inválido. O arquivo deve ser um objeto JSON representando o histórico.");
      }

      if (confirm("ATENÇÃO: A importação substituirá TODO o histórico existente deste bloco. Deseja continuar?")) {
        const blocos = carregarBlocos();
        blocos[blocoIndex].historico = importedData;
        salvarBlocos(blocos);
        showToast("Histórico importado com sucesso! A página será recarregada.");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error("Erro ao importar histórico:", error);
      showToast(`Erro ao processar o arquivo JSON: ${error.message}`, true);
    }
    event.target.value = ''; // Limpa o input
  };
  reader.readAsText(file);
}

// Funções de Recibo (Correção pendente)
export function gerarReciboParaImpressao(event) {
  event.preventDefault();
  
  const selectBloco = document.getElementById('select-bloco-recibo');
  const selectMes = document.getElementById('select-mes-recibo');
  
  const blocoIndex = parseInt(selectBloco.value);
  const mes = selectMes.value;
  
  if (isNaN(blocoIndex) || mes === "") {
    alert("Por favor, selecione o Bloco e o Mês.");
    return;
  }
  
  gerarRecibo(blocoIndex, mes);
}

function gerarRecibo(blocoIndex, mes) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  
  if (!bloco || !bloco.historico || !bloco.historico[mes]) {
    alert("Dados do bloco ou do mês selecionado não encontrados no histórico.");
    fecharModalImpressaoRecibo();
    return;
  }
  
  const dadosRecibo = bloco.historico[mes];
  
  // 1. Calcular o valor total do recibo (soma dos total_rs do histórico)
  let valorTotal = 0;
  
  if (Array.isArray(dadosRecibo)) { // O histórico é um array de apartamentos
    dadosRecibo.forEach(apt => {
      const valor = parseFloat(apt.total_rs);
      if (!isNaN(valor)) {
        valorTotal += valor;
      }
    });
  }
  
  // Se o valor total for 0 ou NaN, retorna um erro
  if (valorTotal <= 0 || isNaN(valorTotal)) {
    console.error("Erro na Geração do Recibo. Valor Total Calculado:", valorTotal);
    alert("Não foi possível calcular o valor total do recibo. Verifique os dados de leitura e a conta Sabesp para o mês selecionado.");
    fecharModalImpressaoRecibo();
    return;
  }
  
  // 2. Formatar os dados
  const valorFormatado = formatarMoeda(valorTotal);
  const valorExtenso = numeroPorExtenso(valorTotal);
  
  const pagador = bloco.nome;
  const referente = `Leitura referente ao mês de ${formatarMesLabel(mes).toLowerCase()}`;
  
  // Data de hoje
  const data = new Date();
  const dia = data.getDate();
  const mesAtualExtenso = data.toLocaleDateString('pt-BR', { month: 'long' });
  const ano = data.getFullYear();
  
  const cidade = "Itapetininga"; // Cidade fixa conforme modelo
  const dataFormatada = `${cidade}, ${dia} de ${mesAtualExtenso} de ${ano}`;
  
  // 3. Preencher o HTML do recibo
  document.getElementById("reciboNumero").innerText = `Recibo nº ${String(blocoIndex + 1).padStart(2, "0")}`; // Usando o índice do bloco como número provisório
  document.getElementById("valorFormatado").innerText = valorFormatado;
  
  document.getElementById("reciboTexto").innerHTML = `
    Recebi(emos) de <strong>${pagador}</strong>, a importância de <strong>${valorFormatado} (${valorExtenso})</strong>,
    referente à <strong>${referente}</strong>.
    <br><br>
    Para maior clareza, firmo(amos) o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo
    <strong>quitação plena, geral e irrevogável</strong> pela quantia recebida.
  `;
  
  document.getElementById("reciboData").innerText = dataFormatada;
  
  // 4. Exibir o modal de visualização
  document.getElementById('modal-visualizacao-recibo').style.display = 'block';
  
  // 5. Fechar o modal de seleção
  fecharModalImpressaoRecibo();
}

export function fecharModalVisualizacaoRecibo() {
  document.getElementById('modal-visualizacao-recibo').style.display = 'none';
}

// ====================================================================
// IMPRESSÃO DE RECIBO (Correção pendente)
// ====================================================================

export function abrirModalImpressaoRecibo() {
  const modal = document.getElementById('modal-impressao-recibo');
  if (!modal) return;
  
  popularBlocosRecibo();
  modal.style.display = 'block';
}

export function fecharModalImpressaoRecibo() {
  const modal = document.getElementById('modal-impressao-recibo');
  if (modal) modal.style.display = 'none';
}

export function popularBlocosRecibo() {
  const blocos = carregarBlocos();
  const selectBloco = document.getElementById('select-bloco-recibo');
  if (!selectBloco) return;

  selectBloco.innerHTML = '<option value="">-- Selecione um Bloco --</option>';
  blocos.forEach((bloco, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = bloco.nome;
    selectBloco.appendChild(option);
  });
  
  if (blocos.length > 0) {
    popularMesesRecibo();
  }
}

export function popularMesesRecibo() {
  const selectBloco = document.getElementById('select-bloco-recibo');
  const selectMes = document.getElementById('select-mes-recibo');
  if (!selectBloco || !selectMes) return;

  const blocoIndex = parseInt(selectBloco.value);
  selectMes.innerHTML = '<option value="">-- Selecione o Mês --</option>';

  if (blocoIndex === "") return;

  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  
  if (bloco && bloco.historico) {
    const meses = Object.keys(bloco.historico).sort().reverse();
    
    meses.forEach(mes => {
      const option = document.createElement('option');
      option.value = mes;
      option.textContent = formatarMesLabel(mes);
      selectMes.appendChild(option);
    });
  }
}

export function gerarReciboParaImpressao(event) {
  // Esta função será migrada e CORRIGIDA na próxima etapa.
  console.warn("Função gerarReciboParaImpressao pendente de migração e correção.");
}

export function fecharModalVisualizacaoRecibo() {
  // Esta função será migrada do script.js na próxima etapa.
  console.warn("Função fecharModalVisualizacaoRecibo pendente de migração.");
}

export function imprimirRecibo() {
  // Esta função será migrada e CORRIGIDA na próxima etapa.
  console.warn("Função imprimirRecibo pendente de migração e correção.");
}

export function exportarParaPDF() {
  // Esta função será migrada do script.js na próxima etapa.
  console.warn("Função exportarParaPDF pendente de migração.");
}

// ====================================================================
// LÓGICA DE BOLETOS (boletos.html)
// ====================================================================

export function renderizarBoletosPage() {
  // Esta função será migrada do script.js na próxima etapa.
  console.warn("Função renderizarBoletosPage pendente de migração.");
}

export function atualizarBoletos() {
  // Esta função será migrada do script.js na próxima etapa.
  console.warn("Função atualizarBoletos pendente de migração.");
}

// ====================================================================
// LÓGICA DE IMPORTAÇÃO/EXPORTAÇÃO (bloco.html)
// ====================================================================

export function exportarLeituraAtual() {
  if (typeof XLSX === 'undefined') {
    showToast("Biblioteca XLSX não carregada.", true);
    return;
  }

  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const blocos = carregarBlocos();
  const bloco = blocos[id];
  if (!bloco) {
    showToast("Bloco não encontrado.", true);
    return;
  }

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
  showToast("Leitura atual exportada com sucesso!");
}

export function importarLeituraAtual(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const blocos = carregarBlocos();
      const id = Number(new URLSearchParams(location.search).get("id"));
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
      showToast("Leitura importada com sucesso!");
      renderizarBlocoIndividual();
    } catch (error) {
      console.error("Erro ao importar leitura:", error);
      showToast(`Erro ao processar o arquivo XLSX: ${error.message}`, true);
    }
    event.target.value = ''; // Limpa o input
  };

  reader.readAsArrayBuffer(file);
}

export function gerarTemplateImportacao() {
  // Esta função será migrada do script.js na próxima etapa.
  console.warn("Função gerarTemplateImportacao pendente de migração.");
}

export function exportarHistorico(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  if (!bloco || !bloco.historico || Object.keys(bloco.historico).length === 0) {
    showToast("Não há histórico para exportar neste bloco.", true);
    return;
  }

  // Prepara os dados para exportação em formato de planilha
  const dataToExport = [["Mês", "Apto", "Responsável", "Leitura Anterior", "Leitura Atual", "Consumo m³", "Valor R$", "Obs"]];
  
  Object.keys(bloco.historico).sort().reverse().forEach(mes => {
    bloco.historico[mes].forEach(apt => {
      dataToExport.push([
        formatarMesLabel(mes),
        apt.numero,
        apt.responsavel,
        apt.leitura_anterior,
        apt.leitura_atual,
        apt.total_m3,
        apt.total_rs,
        apt.obs
      ]);
    });
  });

  const fileName = `historico_${bloco.nome.replace(/\s+/g, "_")}`;
  exportToXLSX(dataToExport, fileName, "Histórico");
  showToast("Histórico exportado para Excel com sucesso!");
}

export function importarHistorico(blocoIndex, event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (typeof importedData !== 'object' || Array.isArray(importedData) || importedData === null) {
        throw new Error("Formato de arquivo inválido. O arquivo deve ser um objeto JSON representando o histórico.");
      }

      if (confirm("ATENÇÃO: A importação substituirá TODO o histórico existente deste bloco. Deseja continuar?")) {
        const blocos = carregarBlocos();
        blocos[blocoIndex].historico = importedData;
        salvarBlocos(blocos);
        showToast("Histórico importado com sucesso! A página será recarregada.");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error("Erro ao importar histórico:", error);
      showToast(`Erro ao processar o arquivo JSON: ${error.message}`, true);
    }
    event.target.value = ''; // Limpa o input
  };
  reader.readAsText(file);
}
