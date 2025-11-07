// script.js

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
            <td><input type="text" class="pequeno" value="${apt.numero}" onchange="editarCampo(${blocoIndex}, ${i}, 'numero', this.value)"></td>
            <td><input type="text" value="${apt.responsavel}" onchange="editarCampo(${blocoIndex}, ${i}, 'responsavel', this.value)"></td>
            <td><input type="number" class="menor" value="${apt.leitura_anterior}" onchange="editarCampo(${blocoIndex}, ${i}, 'leitura_anterior', this.value)"></td>
            <td><input type="number" class="menor" value="${apt.leitura_atual}" oninput="atualizarCampo(${blocoIndex}, ${i}, this.value)"></td>
            <td>${apt.total_m3}</td>
            <td><input type="text" class="media" value="R$ ${apt.total_rs}" readonly></td>
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
  apt.total_rs = (apt.total_m3 * 2).toFixed(2);
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

function editarCampo(blocoIndex, aptIndex, campo, valor) {
  const blocos = carregarBlocos();
  blocos[blocoIndex].leitura_atual[aptIndex][campo] = valor;
  salvarBlocos(blocos);
}

function salvarApartamentoDireto(blocoIndex, aptIndex) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].leitura_atual[aptIndex];
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

  const mes = mesAtual();
  bloco.historico = bloco.historico || {};

  bloco.historico[mes] = JSON.parse(JSON.stringify(bloco.leitura_atual));

  bloco.leitura_atual = bloco.leitura_atual.map(apt => ({
    ...apt,
    leitura_anterior: apt.leitura_atual,
    leitura_atual: 0,
    total_m3: 0,
    total_rs: 0,
    obs: ""
  }));

  salvarBlocos(blocos);
  alert("Leitura salva no histórico!");
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


