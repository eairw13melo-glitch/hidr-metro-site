let dados = JSON.parse(localStorage.getItem("hidrometro")) || {
  blocoAtual: null,
  blocos: {}
};

function salvar() {
  localStorage.setItem("hidrometro", JSON.stringify(dados));
}

/* ========= TELA INICIAL ========= */

function criarBloco() {
  const nome = document.getElementById("blocoNome").value.trim();
  const sindico = document.getElementById("sindicoNome").value.trim();

  if (!nome || !sindico) {
    alert("Preencha o nome do bloco e do síndico");
    return;
  }

  if (dados.blocos[nome]) {
    alert("Este bloco já existe");
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

  const nomes = Object.keys(dados.blocos);

  if (nomes.length === 0) {
    lista.innerHTML = "<p>Nenhum bloco cadastrado.</p>";
    return;
  }

  nomes.forEach(nome => {
    const bloco = dados.blocos[nome];

    const div = document.createElement("div");
    div.className = "bloco-card";
    div.innerHTML = `
      <h3>📁 ${nome}</h3>
      <p><strong>Síndico:</strong> ${bloco.sindico}</p>

      <button onclick="abrirBloco('${nome}')">Abrir</button>
      <button onclick="editarBloco('${nome}')" style="background:#fbbc04">Editar</button>
      <button onclick="excluirBloco('${nome}')" style="background:#d93025">Excluir</button>
    `;

    lista.appendChild(div);
  });
}

function abrirBloco(nome) {
  dados.blocoAtual = nome;
  salvar();
  window.location.href = "bloco.html";
}

/* ========= TELA DO BLOCO ========= */

function carregarBloco() {
  if (!dados.blocoAtual) return;

  const bloco = dados.blocos[dados.blocoAtual];

  document.getElementById("tituloBloco").innerText = dados.blocoAtual;
  document.getElementById("sindicoBloco").innerText =
    `Síndico: ${bloco.sindico}`;

  const tabela = document.getElementById("tabelaApartamentos");
  tabela.innerHTML = "";

  bloco.apartamentos.forEach((ap, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ap.numero}</td>
      <td>
        <input value="${ap.responsavel}"
          oninput="atualizarCampo(${index}, 'responsavel', this.value)">
      </td>
      <td>
        <input type="number" value="${ap.leituraAnterior}"
          oninput="atualizarCampo(${index}, 'leituraAnterior', Number(this.value))">
      </td>
      <td>
        <input type="number" value="${ap.leituraAtual}"
          oninput="atualizarCampo(${index}, 'leituraAtual', Number(this.value))">
      </td>
      <td>${ap.consumo}</td>
    `;
    tabela.appendChild(tr);
  });
}

function atualizarCampo(index, campo, valor) {
  const bloco = dados.blocos[dados.blocoAtual];
  const ap = bloco.apartamentos[index];

  ap[campo] = valor;
  ap.consumo = ap.leituraAtual - ap.leituraAnterior;

  salvar();
  carregarBloco();
}

function voltar() {
  window.location.href = "index.html";
}

function editarBloco(nomeAtual) {
  const bloco = dados.blocos[nomeAtual];

  const novoNome = prompt("Novo nome do bloco:", nomeAtual);
  if (!novoNome) return;

  const novoSindico = prompt("Novo nome do síndico:", bloco.sindico);
  if (!novoSindico) return;

  // Se mudou o nome do bloco, precisamos recriar a "pasta virtual"
  if (novoNome !== nomeAtual) {
    if (dados.blocos[novoNome]) {
      alert("Já existe um bloco com esse nome");
      return;
    }

    dados.blocos[novoNome] = {
      sindico: novoSindico,
      apartamentos: bloco.apartamentos
    };

    delete dados.blocos[nomeAtual];
  } else {
    bloco.sindico = novoSindico;
  }

  salvar();
  renderBlocos();
}
``

/* ========= INIT ========= */
renderBlocos();
carregarBloco();
