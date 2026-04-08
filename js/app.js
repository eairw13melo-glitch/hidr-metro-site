let dados = JSON.parse(localStorage.getItem("hidrometro")) || { blocos: [] };

function salvar() {
  localStorage.setItem("hidrometro", JSON.stringify(dados));
}

function adicionarBloco() {
  const nome = document.getElementById("blocoNome").value;
  const sindico = document.getElementById("sindicoNome").value;
  if (!nome || !sindico) return alert("Preencha todos os campos");

  const bloco = {
    id: Date.now(),
    nome,
    sindico,
    apartamentos: []
  };

  // Criar automaticamente 32 apartamentos
  for (let i = 1; i <= 32; i++) {
    bloco.apartamentos.push({
      numero: i,
      responsavel: "",
      leituraAnterior: 0,
      leituraAtual: 0,
      consumo: 0
    });
  }

  dados.blocos.push(bloco);
  salvar();
  render();
}

function atualizarApartamento(blocoId, apIndex, campo, valor) {
  const bloco = dados.blocos.find(b => b.id === blocoId);
  bloco.apartamentos[apIndex][campo] = valor;

  const ap = bloco.apartamentos[apIndex];
  ap.consumo = ap.leituraAtual - ap.leituraAnterior;

  salvar();
}

function render() {
  const container = document.getElementById("blocos");
  container.innerHTML = "";

  dados.blocos.forEach(bloco => {
    const div = document.createElement("section");
    div.innerHTML = `
      <h2>${bloco.nome} — Síndico: ${bloco.sindico}</h2>
      <table>
        <thead>
          <tr>
            <th>Ap</th>
            <th>Responsável</th>
            <th>Leitura Anterior</th>
            <th>Leitura Atual</th>
            <th>Consumo</th>
          </tr>
        </thead>
        <tbody>
          ${bloco.apartamentos.map((ap, i) => `
            <tr>
              <td>${ap.numero}</td>
              <td>
                <input value="${ap.responsavel}"
                  oninput="atualizarApartamento(${bloco.id}, ${i}, 'responsavel', this.value)">
              </td>
              <td>
                <input type="number" value="${ap.leituraAnterior}"
                  oninput="atualizarApartamento(${bloco.id}, ${i}, 'leituraAnterior', Number(this.value))">
              </td>
              <td>
                <input type="number" value="${ap.leituraAtual}"
                  oninput="atualizarApartamento(${bloco.id}, ${i}, 'leituraAtual', Number(this.value))">
              </td>
              <td>${ap.consumo}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    container.appendChild(div);
  });
}

render();
``
