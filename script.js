// script.js
const tarifaConfig = {
  minimo: 64.60,
  faixa_11_20: 8.94,
  faixa_21_50: 13.82
};


const user = { username: "admin", password: "1234" };

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("login-form")) {
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const u = document.getElementById("username").value;
      const p = document.getElementById("password").value;
      if (u === user.username && p === user.password) {
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("login-error").textContent = "Usuário ou senha inválido.";
      }
    });
  }

  const path = location.pathname;
  if (path.includes("dashboard.html")) {
    renderizarListaDeBlocos();
  } else if (path.includes("bloco.html")) {
    renderizarBlocoIndividual();
  }
});

function carregarBlocos() {
  return JSON.parse(localStorage.getItem("blocos")) || [];
}

function salvarBlocos(blocos) {
  localStorage.setItem("blocos", JSON.stringify(blocos));
}

function criarBloco() {
  const nome = prompt("Nome do novo bloco:");
  if (!nome) return;

  const endereco = prompt("Endereço:");
  const sindico = prompt("Síndico:");

  const blocos = carregarBlocos();
  if (blocos.find(b => b.nome === nome)) {
    alert("Esse bloco já existe!");
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

  blocos.push({ nome, endereco, sindico, leitura_atual, historico: {} });
  salvarBlocos(blocos);
  renderizarListaDeBlocos();
  alert("Bloco criado!");
}

function renderizarListaDeBlocos() {
  const blocos = carregarBlocos();
  const container = document.getElementById("blocos-container");
  if (!container) return;
  container.innerHTML = "";

  blocos.forEach((bloco, index) => {
    const div = document.createElement("div");
    div.className = "bloco";
    div.innerHTML = `
      <h2>${bloco.nome}</h2>
      <p><strong>Endereço:</strong> ${bloco.endereco}</p>
      <p><strong>Síndico:</strong> ${bloco.sindico}</p>
      <button onclick="window.location.href='bloco.html?id=${index}'">🔍 Acessar Bloco</button>
    `;
    container.appendChild(div);
  });
}

function renderizarBlocoIndividual() {
  const blocos = carregarBlocos();
  const id = new URLSearchParams(window.location.search).get("id");
  const bloco = blocos[id];
  if (!bloco) {
    document.body.innerHTML = "<h2>Bloco não encontrado.</h2>";
    return;
  }

    // ✅ Corrige blocos antigos que não têm os novos campos
  if (!bloco.leitura_atual) {
    bloco.leitura_atual = [];
  }
  if (!bloco.historico) {
    bloco.historico = {};
  }

  salvarBlocos(blocos); // Salva as correções
  const container = document.getElementById("bloco-detalhes");
  container.innerHTML = `
    <div class="bloco">
      <h2>${bloco.nome}</h2>
      <p><strong>Endereço:</strong> ${bloco.endereco}</p>
      <p><strong>Síndico:</strong> ${bloco.sindico}</p>

      <button onclick="adicionarApartamentoDireto(${id})">+ Adicionar Apartamento</button>
      <button onclick="salvarLeituraDoMes(${id})">💾 Salvar Leitura do Mês</button>
      <button onclick="resetarBloco(${id})" style="background:red;">🗑️ Resetar Bloco</button>

      <h3>📌 Leitura Atual (${mesAtualLabel()})</h3>
      ${gerarTabelaLeituraAtual(bloco, id)}
    </div>

    <h3 style="margin-top:30px;">📚 Histórico de Leituras</h3>
    ${gerarHistorico(bloco)}
  `;
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
            <td><input type="text" class="pequeno" value="${apt.numero}" id="numero-${blocoIndex}-${i}"></td>
            <td><input type="text" value="${apt.responsavel}" onchange="editarCampo(${blocoIndex}, ${i}, 'responsavel', this.value)"></td>
            <td><input type="number" class="menor" value="${apt.leitura_anterior}" onchange="editarCampo(${blocoIndex}, ${i}, 'leitura_anterior', this.value)"></td>
            <td><input type="number" class="menor" value="${apt.leitura_atual}" oninput="atualizarCampo(${blocoIndex}, ${i}, this.value)"></td>
            <td id="m3-${blocoIndex}-${i}">${apt.total_m3}</td>
            <td><input type="text" id="rs-${blocoIndex}-${i}" class="media" value="R$ ${apt.total_rs}" readonly></td>
            <td><input type="text" value="${apt.obs}" onchange="editarCampo(${blocoIndex}, ${i}, 'obs', this.value)"></td>
            <td>
              <button onclick="salvarApartamentoDireto(${blocoIndex}, ${i})">💾</button>

              <button onclick="removerApartamento(${blocoIndex}, ${i})" style="background:darkred;">🗑️</button>
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

  if (meses.length === 0) return `<p>Nenhuma leitura registrada ainda.</p>`;

  return meses.map(mes => {
    return `
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
    `;
  }).join("");
}

function atualizarCampo(blocoIndex, aptIndex, valor) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].leitura_atual[aptIndex];

  apt.leitura_atual = Number(valor);
  apt.total_m3 = apt.leitura_atual - apt.leitura_anterior;
  apt.total_rs = calcularValorEscalonado(apt.total_m3).toFixed(2);

  salvarBlocos(blocos);

  // Atualiza visualmente os campos diretamente
  document.querySelector(`#m3-${blocoIndex}-${aptIndex}`).textContent = apt.total_m3;
  document.querySelector(`#rs-${blocoIndex}-${aptIndex}`).value = `R$ ${apt.total_rs}`;
}

function editarCampo(blocoIndex, aptIndex, campo, valor) {
  const blocos = carregarBlocos();
  blocos[blocoIndex].leitura_atual[aptIndex][campo] = valor;
  salvarBlocos(blocos);
}

function salvarApartamentoDireto(blocoIndex, aptIndex) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].leitura_atual[aptIndex];

  // Atualiza valor do campo número (evita re-renderizar enquanto digita)
  const novoNumero = document.getElementById(`numero-${blocoIndex}-${aptIndex}`).value;
  apt.numero = novoNumero;

  apt.leitura_anterior = apt.leitura_atual;
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

function salvarLeituraDoMes(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  let mes = mesAtual();
  let contador = 1;

  bloco.historico = bloco.historico || {};

  // Evita sobrescrever mês
  while (bloco.historico[mes]) {
    mes = `${mesAtual()}(${contador++})`;
  }

  // Salva a leitura no histórico
  bloco.historico[mes] = JSON.parse(JSON.stringify(bloco.leitura_atual));

  // Gera o Excel
  exportarParaExcel(bloco.leitura_atual, bloco.nome, mes);

  // Limpa leitura atual para próxima rodada
  bloco.leitura_atual = bloco.leitura_atual.map(apt => ({
    ...apt,
    leitura_anterior: apt.leitura_atual,
    leitura_atual: 0,
    total_m3: 0,
    total_rs: 0,
    obs: ""
  }));

  salvarBlocos(blocos);
  alert("Leitura salva no histórico e exportada para Excel!");
  renderizarBlocoIndividual();
}


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
  const date = new Date(`${ano}-${numeroMes}-01`);
  return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

function resetarBloco(index) {
  if (!confirm("Deseja excluir este bloco e todos os dados?")) return;
  const blocos = carregarBlocos();
  blocos.splice(index, 1);
  salvarBlocos(blocos);
  window.location.href = "dashboard.html";
}

function exportarParaExcel(dados, nomeBloco, mes) {
  const worksheetData = [
    [
      "Hidrômetro Nº",
      "Responsável",
      "Leitura Anterior",
      "Leitura Atual",
      "m³",
      "R$",
      "Observações"
    ],
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

  const nomeArquivo = `Leitura_${nomeBloco}_${mes}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
}

function exportarDados() {
  const dados = localStorage.getItem("blocos");
  const blob = new Blob([dados], { type: "application/json" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "blocos_hidrometro.json";
  link.click();
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
      window.location.reload();
    } catch (error) {
      alert("Erro ao importar dados. Verifique o arquivo.");
    }
  };
  reader.readAsText(file);
}

function exportarLeituraAtual() {
  const blocos = carregarBlocos();
  const id = new URLSearchParams(window.location.search).get("id");
  const bloco = blocos[id];
  const dados = bloco.leitura_atual;

  const worksheetData = [
    [
      "Hidrômetro Nº",
      "Responsável",
      "Leitura Anterior",
      "Leitura Atual",
      "m³",
      "R$",
      "Observações"
    ],
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
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leitura Atual");

  const mes = mesAtual().replace("-", "_");
  const nomeArquivo = `LeituraAtual_${bloco.nome}_${mes}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
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
    const id = new URLSearchParams(window.location.search).get("id");
    const bloco = blocos[id];

    json.forEach((row, index) => {
      if (!bloco.leitura_atual[index]) return;

      bloco.leitura_atual[index].numero = row["Hidrômetro Nº"] || bloco.leitura_atual[index].numero;
      bloco.leitura_atual[index].responsavel = row["Responsável"] || "";
      bloco.leitura_atual[index].leitura_anterior = Number(row["Leitura Anterior"]) || 0;
      bloco.leitura_atual[index].leitura_atual = Number(row["Leitura Atual"]) || 0;
      bloco.leitura_atual[index].total_m3 = bloco.leitura_atual[index].leitura_atual - bloco.leitura_atual[index].leitura_anterior;
      bloco.leitura_atual[index].total_rs = (bloco.leitura_atual[index].total_m3 * 2).toFixed(2); // ajuste tarifa se necessário
      bloco.leitura_atual[index].obs = row["Observações"] || "";
    });

    salvarBlocos(blocos);
    alert("Leitura importada com sucesso!");
    renderizarBlocoIndividual();
  };

  reader.readAsArrayBuffer(file);
}

function calcularValorEscalonado(m3) {
  const { minimo, faixa_11_20, faixa_21_50 } = tarifaConfig;

  if (m3 <= 10) {
    return minimo;
  } else if (m3 <= 20) {
    return minimo + (m3 - 10) * faixa_11_20;
  } else {
    const faixa2 = 10 * faixa_11_20;
    const faixa3 = (m3 - 20) * faixa_21_50;
    return minimo + faixa2 + faixa3;
  }
}









