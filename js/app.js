let dados = JSON.parse(localStorage.getItem("hidrometro")) || { blocos: {} };

function salvar() {
  localStorage.setItem("hidrometro", JSON.stringify(dados));
}

function criarBloco() {
  const nome = document.getElementById("blocoNome").value;
  const sindico = document.getElementById("sindicoNome").value;

  if (!nome || !sindico) {
    alert("Preencha o nome do bloco e do síndico");
    return;
  }

  if (dados.blocos[nome]) {
    alert("Bloco já existe");
    return;
  }

  // Criando a "pasta" do bloco
  dados.blocos[nome] = {
    sindico,
    apartamentos: []
  };

  // Criando os 32 apartamentos (estrutura da planilha)
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
  render();
}
