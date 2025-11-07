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

// Carrega blocos
function carregarBlocos() {
  return JSON.parse(localStorage.getItem("blocos")) || [];
}

// Salva blocos
function salvarBlocos(blocos) {
  localStorage.setItem("blocos", JSON.stringify(blocos));
}

// Cria novo bloco
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
  salvarBlocos(blocos);
  renderizarListaDeBlocos();
  alert("Bloco criado!");
}

// Renderiza a lista de blocos (dashboard.html)
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

// Renderiza bloco individual (bloco.html)
function renderizarBlocoIndividual() {
  const blocos = carregarBlocos();
  const id = new URLSearchParams(window.location.search).get("id");
  const bloco = blocos[id];

  if (!bloco) {
    document.body.innerHTML = "<h2>Bloco não encontrado.</h2>";
    return;
  }

  const container = document.getElementById("bloco-detalhes");
  container.innerHTML = `
    <div class="bloco">
      <h2>${bloco.nome}</h2>
      <p><strong>Endereço:</strong> ${bloco.endereco}</p>
      <p><strong>Síndico:</strong> ${bloco.sindico}</p>

      <button onclick="adicionarApartamentoDireto(${id})">+ Adicionar Apartamento</button>
      <button onclick="resetarBloco(${id})" style="background:red;">🗑️ Resetar Bloco</button>

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
          ${bloco.apartamentos.map((apt, aptIndex) => `
            <tr>
              <td><input type="text" class="pequeno" value="${apt.numero}" onchange="editarCampo(${id}, ${aptIndex}, 'numero', this.value)"></td>
              <td><input type="text" value="${apt.responsavel}" onchange="editarCampo(${id}, ${aptIndex}, 'responsavel', this.value)"></td>
              <td><input type="number" class="menor" value="${apt.leitura_anterior}" readonly></td>
              <td><input type="number" class="menor" value="${apt.leitura_atual}" oninput="atualizarCampo(${id}, ${aptIndex}, this.value)"></td>
              <td>${apt.total_m3}</td>
              <td><input type="text" class="menor" value="R$ ${apt.total_rs}" readonly></td>
              <td><input type="text" value="${apt.obs}" onchange="editarCampo(${id}, ${aptIndex}, 'obs', this.value)"></td>
              <td>
                <button onclick="salvarApartamentoDireto(${id}, ${aptIndex})">💾</button>
                <button onclick="removerApartamento(${id}, ${aptIndex})" style="background:darkred;">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Ações em apartamentos
function editarCampo(blocoIndex, aptIndex, campo, valor) {
  const blocos = carregarBlocos();
  blocos[blocoIndex].apartamentos[aptIndex][campo] = valor;
  salvarBlocos(blocos);
}

function atualizarCampo(blocoIndex, aptIndex, valor) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].apartamentos[aptIndex];
  apt.leitura_atual = Number(valor);
  apt.total_m3 = apt.leitura_atual - apt.leitura_anterior;
  apt.total_rs = (apt.total_m3 * 2).toFixed(2);
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

function salvarApartamentoDireto(blocoIndex, aptIndex) {
  const blocos = carregarBlocos();
  const apt = blocos[blocoIndex].apartamentos[aptIndex];
  apt.leitura_anterior = apt.leitura_atual;
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

function removerApartamento(blocoIndex, aptIndex) {
  if (!confirm("Remover este apartamento?")) return;
  const blocos = carregarBlocos();
  blocos[blocoIndex].apartamentos.splice(aptIndex, 1);
  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

function adicionarApartamentoDireto(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];

  const numero = prompt("Número do novo apartamento (ex: 134-B):");
  if (!numero) return;

  const existe = bloco.apartamentos.find(a => a.numero === numero);
  if (existe) {
    alert("Esse número já existe.");
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

  salvarBlocos(blocos);
  renderizarBlocoIndividual();
}

function resetarBloco(index) {
  if (!confirm("Deseja apagar este bloco e todos os apartamentos?")) return;
  const blocos = carregarBlocos();
  blocos.splice(index, 1);
  salvarBlocos(blocos);
  window.location.href = "dashboard.html";
}

// Gerenciamento modal
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
  salvarBlocos(blocos);
  alert("Bloco atualizado!");
  fecharModal();
  renderizarListaDeBlocos();
}

