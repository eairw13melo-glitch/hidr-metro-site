// =====================================================
// Projeto: Leitura de Hidrômetro
// Versão: v1.1.0
// Data: 10/11/2025
// Descrição: Lógica de autenticação segura com hash, bloqueio e token.
// =====================================================

const usuarioSalvo = {
  username: "admin",
  passwordHash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4" // hash de '1234'
};

async function hash(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function gerarToken() {
  return crypto.getRandomValues(new Uint32Array(4)).join("-");
}

function bloquearLoginTemporariamente() {
  const agora = Date.now();
  localStorage.setItem("bloqueadoAte", agora + 60000);
}

function estaBloqueado() {
  const expira = Number(localStorage.getItem("bloqueadoAte") || 0);
  return Date.now() < expira;
}

function registrarTentativaFalha() {
  let tentativas = Number(localStorage.getItem("tentativas") || 0);
  tentativas++;
  localStorage.setItem("tentativas", tentativas);
  if (tentativas >= 5) {
    bloquearLoginTemporariamente();
    localStorage.removeItem("tentativas");
    alert("Muitas tentativas incorretas. Tente novamente em 1 minuto.");
  }
}

function resetarTentativas() {
  localStorage.removeItem("tentativas");
}

const togglePass = document.getElementById("togglePass");
const passwordInput = document.getElementById("password");
togglePass.addEventListener("click", () => {
  const tipo = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = tipo;
  togglePass.textContent = tipo === "password" ? "👁️" : "🙈";
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const erroEl = document.getElementById("login-error");
  erroEl.textContent = "";

  if (estaBloqueado()) {
    erroEl.textContent = "Login temporariamente bloqueado. Aguarde um minuto.";
    return;
  }

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (!username || !password) {
    erroEl.textContent = "Preencha usuário e senha.";
    return;
  }

  const senhaHash = await hash(password);

  document.getElementById("btn-login").disabled = true;
  await new Promise(r => setTimeout(r, 500));

  if (username === usuarioSalvo.username && senhaHash === usuarioSalvo.passwordHash) {
    resetarTentativas();
    sessionStorage.setItem("token", gerarToken());
    localStorage.setItem("logado", "true");
    location.href = "dashboard.html";
  } else {
    registrarTentativaFalha();
    erroEl.textContent = "Credenciais inválidas.";
  }

  document.getElementById("btn-login").disabled = false;
});
