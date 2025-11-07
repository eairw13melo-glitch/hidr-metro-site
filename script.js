// LOGIN
const user = { username: "admin", password: "1234" };

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
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

  carregarBlocos();
});

// CRIAÇÃO DE BLOCO COM ENDEREÇO E SÍNDICO
function criarBloco() {
  const nome = prompt("Nome do novo bloco:");
  if (!nome) return;

  const endereco = prompt("Endereço do bloco:");
  if (endereco === null) return;

  const sindico = prompt("Nome do síndico:");
  if (sindico === null) return;

  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];

  if (blocos.find(b => b.nome === nome)) {
    alert("Este bloco já existe.");
    return;
  }

  const apartamentos = [];
  for (let i = 1; i <= 32; i++) {
    apartamentos.push({
      numero: `${100 + i}-A`,
      responsavel: "",
      leitura_anterior: 0,
      leitura_atual: 0,
      total_m3: 0,
      total_rs: 0,
      obs: ""
    });
  }

  blocos.push({ nome, endereco, sindico, apartamentos });
  localStorage.setItem("blocos", JSON.stringify(blocos));
  carregarBlocos();
  alert("Bloco criado com sucesso!");
}

// CARREGAR BLOCOS NO SELECT
function carregarBlocos() {
  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];
  const select = document.getElementById("blocoSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Selecione um bloco</option>`;
  blocos.forEach((b, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = b.nome;
    select.appendChild(opt);
  });
}

// CARREGAR DADOS DO BLOCO ATUAL
function carregarBloco() {
  const blocoIndex = document.getElementById("blocoSelect").value;
  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];
  if (blocoIndex === "") return;

  const bloco = blocos[blocoIndex];
  const container = document.getElementById("tabela-container");

  let html = `
    <h3>${bloco.nome}</h3>
    <p><strong>Endereço:</strong> ${bloco.endereco || ""}</p>
    <p><strong>Síndico:</strong> ${bloco.sindico || ""}</p>

    <table>
      <thead>
        <tr>
          <th>Hidrômetro Nº</th>
          <th>Responsável</th>
          <th>Leitura Anterior</th>
          <th>Leitura Atual</th>
          <th>Total m³</th>
          <th>Total em R$</th>
          <th>Obs</th>
          <th>Salvar</th>
        </tr>
      </thead>
      <tbody>
  `;

  bloco.apartamentos.forEach((apt, i) => {
    html += `
      <tr>
        <td>${apt.numero}</td>
        <td><input type="text" id="resp-${i}" value="${apt.responsavel}"></td>
        <td><input type="number" id="anterior-${i}" value="${apt.leitura_anterior}" readonly></td>
        <td><input type="number" id="atual-${i}" value="${apt.leitura_atual}" oninput="atualizarConsumo(${i})"></td>
        <td id="m3-${i}">${apt.total_m3}</td>
        <td><input type="text" id="rs-${i}" value="R$ ${apt.total_rs}" readonly></td>
        <td><input type="text" id="obs-${i}" value="${apt.obs}"></td>
        <td><button onclick="salvarApartamento(${blocoIndex}, ${i})">Salvar</button></td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// ATUALIZAR CONSUMO M³ E R$
function atualizarConsumo(i) {
  const anterior = Number(document.getElementById(`anterior-${i}`).value);
  const atual = Number(document.getElementById(`atual-${i}`).value);
  const total = atual - anterior;
  document.getElementById(`m3-${i}`).textContent = total >= 0 ? total : 0;

  // Substituir esse valor pelo cálculo real quando disponível
  const totalReais = total >= 0 ? (total * 2).toFixed(2) : "0.00";
  document.getElementById(`rs-${i}`).value = `R$ ${totalReais}`;
}

// SALVAR DADOS DE UM APARTAMENTO
function salvarApartamento(blocoIndex, aptIndex) {
  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];
  const bloco = blocos[blocoIndex];
  const apt = bloco.apartamentos[aptIndex];

  apt.responsavel = document.getElementById(`resp-${aptIndex}`).value;
  apt.leitura_atual = Number(document.getElementById(`atual-${aptIndex}`).value);
  apt.total_m3 = apt.leitura_atual - apt.leitura_anterior;
  apt.total_rs = (apt.total_m3 * 2).toFixed(2); // valor temporário
  apt.obs = document.getElementById(`obs-${aptIndex}`).value;

  // Atualiza leitura anterior
  apt.leitura_anterior = apt.leitura_atual;

  localStorage.setItem("blocos", JSON.stringify(blocos));
  alert("Apartamento salvo!");
  carregarBloco();
}

// GERENCIAR BLOCOS - MODAL
function gerenciarBlocos() {
  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];
  const container = document.getElementById("lista-blocos");

  container.innerHTML = blocos.map((b, i) => `
    <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
      <label>Nome:</label>
      <input type="text" id="edit-nome-${i}" value="${b.nome}">
      <label>Endereço:</label>
      <input type="text" id="edit-endereco-${i}" value="${b.endereco || ''}">
      <label>Síndico:</label>
      <input type="text" id="edit-sindico-${i}" value="${b.sindico || ''}">
      <button onclick="salvarEdicaoBloco(${i})">Salvar</button>
      <button onclick="excluirBloco(${i})" style="background:red;">Excluir</button>
    </div>
  `).join('');

  document.getElementById("modal-blocos").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal-blocos").style.display = "none";
}

function salvarEdicaoBloco(i) {
  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];

  blocos[i].nome = document.getElementById(`edit-nome-${i}`).value;
  blocos[i].endereco = document.getElementById(`edit-endereco-${i}`).value;
  blocos[i].sindico = document.getElementById(`edit-sindico-${i}`).value;

  localStorage.setItem("blocos", JSON.stringify(blocos));
  alert("Bloco atualizado!");
  carregarBlocos();
  carregarBloco();
  fecharModal();
}

function excluirBloco(i) {
  if (confirm("Tem certeza que deseja excluir este bloco?")) {
    const blocos = JSON.parse(localStorage.getItem("blocos")) || [];
    blocos.splice(i, 1);
    localStorage.setItem("blocos", JSON.stringify(blocos));
    alert("Bloco removido.");
    carregarBlocos();
    fecharModal();
    document.getElementById("tabela-container").innerHTML = "";
  }
}
