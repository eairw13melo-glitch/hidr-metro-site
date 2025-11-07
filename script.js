// script.js

// Simples autenticação
const user = { username: "admin", password: "1234" };

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      if (username === user.username && password === user.password) {
        window.location.href = "dashboard.html";
      } else {
        document.getElementById('login-error').textContent = "Usuário ou senha inválido.";
      }
    });
  }

  const leituraForm = document.getElementById('leitura-form');
  if (leituraForm) {
    leituraForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const unidade = document.getElementById('unidade').value;
      const data = document.getElementById('data').value;
      const valor = document.getElementById('valor').value;

      const leitura = { unidade, data, valor };

      let historico = JSON.parse(localStorage.getItem('leituras')) || [];
      historico.push(leitura);
      localStorage.setItem('leituras', JSON.stringify(historico));
      alert("Leitura salva com sucesso!");
      leituraForm.reset();
      carregarHistorico();
    });

    carregarHistorico();
  }
});

function carregarHistorico() {
  const tbody = document.querySelector('#historico tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const historico = JSON.parse(localStorage.getItem('leituras')) || [];
  historico.forEach(l => {
    const row = `<tr><td>${l.unidade}</td><td>${l.data}</td><td>${l.valor}</td></tr>`;
    tbody.innerHTML += row;
  });
}
