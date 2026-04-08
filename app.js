const form = document.getElementById("form");
const historico = document.getElementById("historico");

let dados = JSON.parse(localStorage.getItem("leituras")) || [];

function render() {
  historico.innerHTML = "";
  dados.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.imovel}</td>
      <td>${item.leitura}</td>
      <td>${item.data}</td>
    `;
    historico.appendChild(tr);
  });
}

form.addEventListener("submit", e => {
  e.preventDefault();

  const imovel = document.getElementById("imovel").value;
  const leitura = document.getElementById("leitura").value;

  dados.push({
    imovel,
    leitura,
    data: new Date().toLocaleDateString()
  });

  localStorage.setItem("leituras", JSON.stringify(dados));
  render();
  form.reset();
});

render();