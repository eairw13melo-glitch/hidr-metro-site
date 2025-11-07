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

// BLOCO + APARTAMENTOS
function criarBloco() {
  const nome = prompt("Nome do novo bloco:");
  if (!nome) return;

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

  blocos.push({ nome, apartamentos });
  localStorage.setItem("blocos", JSON.stringify(blocos));
  carregarBlocos();
  alert("Bloco criado com sucesso!");
}

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

function carregarBloco() {
  const blocoIndex = document.getElementById("blocoSelect").value;
  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];
  if (blocoIndex === "") return;

  const bloco = blocos[blocoIndex];
  const container = document.getElementById("tabela-container");

  let html = `
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
        <td><input type="text" id="rs-${i}" value="${apt.total_rs}" readonly></td>
        <td><input type="text" id="obs-${i}" value="${apt.obs}"></td>
        <td><button onclick="salvarApartamento(${blocoIndex}, ${i})">Salvar</button></td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function atualizarConsumo(i) {
  const anterior = Number(document.getElementById(`anterior-${i}`).value);
  const atual = Number(document.getElementById(`atual-${i}`).value);
  const total = atual - anterior;
  document.getElementById(`m3-${i}`).textContent = total >= 0 ? total : 0;

  // Placeholder do total em R$ (ajustar depois com fórmula)
  const totalReais = total >= 0 ? (total * 2).toFixed(2) : "0.00";
  document.getElementById(`rs-${i}`).value = `R$ ${totalReais}`;
}

function salvarApartamento(blocoIndex, aptIndex) {
  const blocos = JSON.parse(localStorage.getItem("blocos")) || [];
  const bloco = blocos[blocoIndex];
  const apt = bloco.apartamentos[aptIndex];

  apt.responsavel = document.getElementById(`resp-${aptIndex}`).value;
  apt.leitura_atual = Number(document.getElementById(`atual-${aptIndex}`).value);
  apt.total_m3 = apt.leitura_atual - apt.leitura_anterior;
  apt.total_rs = (apt.total_m3 * 2).toFixed(2); // Valor fixo temporário
  apt.obs = document.getElementById(`obs-${aptIndex}`).value;

  // Atualiza leitura anterior para próxima vez
  apt.leitura_anterior = apt.leitura_atual;

  localStorage.setItem("blocos", JSON.stringify(blocos));
  alert("Apartamento salvo!");
  carregarBloco();
}
