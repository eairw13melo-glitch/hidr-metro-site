let dados = JSON.parse(localStorage.getItem("hidrometro")) || {
  blocoAtual: null,
  blocos: {}
};

function salvar() {
  localStorage.setItem("hidrometro", JSON.stringify(dados));
}

/* ===== TELA INICIAL ===== */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnCriar");
  if (btn) {
    btn.addEventListener("click", criarBloco);
  }
  renderBlocos();
  carregarBloco();
});

function criarBloco() {
  const nome = document.getElementById("blocoNome").value.trim();
  const sindico = document.getElementById("sindicoNome").value.trim();

  if (!nome || !sindico) {
    alert("Preencha todos os campos");
    return;
  }

  if (dados.blocos[nome]) {
    alert("Bloco já existe");
    return;
  }

  dados.blocos[nome] = {
    sindico,
    apartamentos: []
  };

  for (let i = 1; i <= 32; i++) {
    dados.blocos[nome].apartamentos.push({
      numero: i,
      responsavel: "",
      leituraAnterior: 0,
      leituraAtual: 0,
      consumo: 0
    });
  }

  salvar();
  renderBlocos();

  document.getElementById("blocoNome").value = "";
  document.getElementById("sindicoNome").value = "";
}

function renderBlocos() {
  const lista = document.getElementById("listaBlocos");
  if (!lista) return;

  lista.innerHTML = "";

  Object.keys(dados.blocos).forEach(nome => {
    const bloco = dados.blocos[nome];

    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${nome}</strong> — Síndico: ${bloco.sindico}
      <br/>
      <button onclick="abrirBloco('${nome}')">Abrir</button>
      <button onclick="excluirBloco('${nome}')">Excluir</button>
      <hr/>
    `;
    lista.appendChild(div);
  });
}

function abrirBloco(nome) {
  dados.blocoAtual = nome;
  salvar();
  window.location.href = "bloco.html";
}

function excluirBloco(nome) {
  if (!confirm("Excluir o bloco " + nome + "?")) return;
  delete dados.blocos[nome];
  salvar();
  renderBlocos();
}

/* ===== BLOCO ===== */

function carregarBloco() {
  if (!dados.blocoAtual) return;
  const bloco = dados.blocos[dados.blocoAtual];
  if (!bloco) return;

  document.getElementById("tituloBloco").innerText = dados.blocoAtual;
  document.getElementById("sindicoBloco").innerText = "Síndico: " + bloco.sindico;

  const tabela = document.getElementById("tabelaApartamentos");
  tabela.innerHTML = "";

  bloco.apartamentos.forEach(ap => {
    tabela.innerHTML += `
      <tr>
        <td>${ap.numero}</td>
        <td>${ap.responsavel}</td>
        <td>${ap.leituraAnterior}</td>
        <td>${ap.leituraAtual}</td>
        <td>${ap.consumo}</td>
      </tr>
    `;
  });
}

function voltar() {
  window.location.href = "index.html";
}
