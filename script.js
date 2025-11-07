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
  renderizarTodosBlocos();
});

// CRIAÇÃO DE BLOCO
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
  renderizarTodosBlocos();
  alert("Bloco criado com sucesso!");
}

// CARREGAR BLOCOS
function carregarBlocos() {
  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];
  return blocos;
}

// RENDERIZAR TODOS OS BLOCOS
function renderizarTodosBlocos() {
  const blocos = carregarBlocos();
  const container = document.getElementById("blocos-container");
  if (!container) return;

  container.innerHTML = "";

  blocos.forEach((bloco, blocoIndex) => {
    let html = `
      <div class="bloco">
        <h2>${bloco.nome}</h2>
        <p><strong>Endereço:</strong> ${bloco.endereco}</p>
        <p><strong>Síndico:</strong> ${bloco.sindico}</p>

        <button onclick="adicionarApartamentoDireto(${blocoIndex})">+ Adicionar Apartamento</button>
        <button onclick="resetarBloco(${blocoIndex})" style="background: red;">🗑️ Resetar Bloco</button>

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
    `;

    bloco.apartamentos.forEach((apt, aptIndex) => {
      html += `
        <tr>
          <td><input type="text" class="pequeno" value="${apt.numero}" onchange="editarCampo(${blocoIndex}, ${aptIndex}, 'numero', this.value)"></td>
          <td><input type="text" value="${apt.responsavel}" onchange="editarCampo(${blocoIndex}, ${aptIndex}, 'responsavel', this.value)"></td>
          <td><input type="number" class="menor" value="${apt.leitura_anterior}" readonly></td>
          <td><input type="number" class="menor" value="${apt.leitura_atual}" oninput="atualizarCampo(${blocoIndex}, ${aptIndex}, this.value)"></td>
          <td>${apt.total_m3}</td>
          <td><input type="text" class="menor" value="R$ ${apt.total_rs}" readonly></td>
          <td><input type="text" value="${apt.obs}" onchange="editarCampo(${blocoIndex}, ${aptIndex}, 'obs', this.value)"></td>
          <td>
            <button onclick="salvarApartamentoDireto(${blocoIndex}, ${aptIndex})">💾</button>
            <button onclick="removerApartamento(${blocoIndex}, ${aptIndex})" style="background: darkred;">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML += html;
  });
}

// ATUALIZAÇÃO DOS CAMPOS
function atualizarCampo(blocoIndex, aptIndex, valor) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].apartamentos[aptIndex];

  apt.leitura_atual = Number(valor);
  apt.total_m3 = apt.leitura_atual - apt.leitura_anterior;
  apt.total_rs = (apt.total_m3 * 2).toFixed(2);

  localStorage.setItem("blocos", JSON.stringify(blocos));
  renderizarTodosBlocos();
}

function editarCampo(blocoIndex, aptIndex, campo, valor) {
  const blocos = carregarBlocos();
  blocos[blocoIndex].apartamentos[aptIndex][campo] = valor;
  localStorage.setItem("blocos", JSON.stringify(blocos));
}

function salvarApartamentoDireto(blocoIndex, aptIndex) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].apartamentos[aptIndex];

  apt.leitura_anterior = apt.leitura_atual;

  localStorage.setItem("blocos", JSON.stringify(blocos));
  renderizarTodosBlocos();
}

function removerApartamento(blocoIndex, aptIndex) {
  if (!confirm("Remover este apartamento?")) return;
  const blocos = carregarBlocos();
  blocos[blocoIndex].apartamentos.splice(aptIndex, 1);
  localStorage.setItem("blocos", JSON.stringify(blocos));
  renderizarTodosBlocos();
}

function adicionarApartamentoDireto(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  const numero = prompt("Número do novo apartamento (ex: 133-A):");
  if (!numero) return;

  const existe = bloco.apartamentos.find(a => a.numero === numero);
  if (existe) {
    alert("Já existe um apartamento com esse número.");
    return;
  }

  bloco.apartamentos.push({
    numero,
    responsavel: "",
    leitura_anterior: 0,
    leitura_atual: 0,
    total_m3: 0,
    total_rs: 0,
    obs: ""
  });

  localStorage.setItem("blocos", JSON.stringify(blocos));
  renderizarTodosBlocos();
}

function resetarBloco(blocoIndex) {
  if (!confirm("Deseja excluir este bloco e todos os apartamentos?")) return;
  const blocos = carregarBlocos();
  blocos.splice(blocoIndex, 1);
  localStorage.setItem("blocos", JSON.stringify(blocos));
  renderizarTodosBlocos();
}

// GERENCIAMENTO VIA MODAL
function gerenciarBlocos() {
  const blocos = carregarBlocos();
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
      <button onclick="resetarBloco(${i})" style="background:red;">Excluir</button>
    </div>
  `).join('');

  document.getElementById("modal-blocos").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal-blocos").style.display = "none";
}

function salvarEdicaoBloco(i) {
  const blocos = carregarBlocos();

  blocos[i].nome = document.getElementById(`edit-nome-${i}`).value;
  blocos[i].endereco = document.getElementById(`edit-endereco-${i}`).value;
  blocos[i].sindico = document.getElementById(`edit-sindico-${i}`).value;

  localStorage.setItem("blocos", JSON.stringify(blocos));
  alert("Bloco atualizado!");
  renderizarTodosBlocos();
  fecharModal();
}

