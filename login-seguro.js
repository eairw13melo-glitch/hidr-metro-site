// As credenciais de login devem ser armazenadas de forma segura (ex: em um servidor ou banco de dados).
// Para esta aplicação local, usaremos o localStorage para simular o armazenamento de credenciais.
// A senha padrão foi removida para forçar o usuário a definir uma nova no primeiro acesso.
const usuarioSalvo = JSON.parse(localStorage.getItem("credenciais")) || null;

// Se não houver credenciais salvas, o usuário será forçado a criar uma.
if (!usuarioSalvo && location.pathname.endsWith("index.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    const title = document.querySelector("h1");
    const btn = document.getElementById("btn-login");
    
    if (form && title && btn) {
      title.textContent = "Primeiro Acesso: Crie seu Login";
      btn.textContent = "Criar Login";
      form.removeEventListener("submit", loginHandler); // Remove o listener de login
      form.addEventListener("submit", criarLoginHandler); // Adiciona o listener de criação
    }
  });
}

async function criarLoginHandler(e) {
  e.preventDefault();
  const erroEl = document.getElementById("login-error");
  erroEl.textContent = "";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  
  if (username.length < 4 || password.length < 4) {
    erroEl.textContent = "Usuário e senha devem ter no mínimo 4 caracteres.";
    showToast("Usuário e senha devem ter no mínimo 4 caracteres.", true);
    return;
  }

  const passwordHash = await hash(password);
  const novasCredenciais = { username, passwordHash };
  localStorage.setItem("credenciais", JSON.stringify(novasCredenciais));
  
  showToast("Login criado com sucesso! Redirecionando...", false);
  setTimeout(() => window.location.reload(), 1500);
}

// Renomeando a função de login para ser usada no addEventListener
const loginHandler = async (e) => {
  e.preventDefault();

  const erroEl = document.getElementById("login-error");
  erroEl.textContent = "";

  if (estaBloqueado()) {
    erroEl.textContent = "Login temporariamente bloqueado. Aguarde um minuto.";
    showToast("Login temporariamente bloqueado. Aguarde um minuto.", true);
    return;
  }

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (!username || !password) {
    erroEl.textContent = "Preencha usuário e senha.";
    showToast("Preencha usuário e senha.", true);
    return;
  }

  const senhaHash = await hash(password);

  document.getElementById("btn-login").disabled = true;
  await new Promise(r => setTimeout(r, 500));

  const credenciaisSalvas = JSON.parse(localStorage.getItem("credenciais"));

  if (credenciaisSalvas && username === credenciaisSalvas.username && senhaHash === credenciaisSalvas.passwordHash) {
    resetarTentativas();
    sessionStorage.setItem("token", gerarToken());
    localStorage.setItem("logado", "true");
    location.href = "dashboard.html";
    showToast("Login realizado com sucesso!");
  } else {
    registrarTentativaFalha();
    erroEl.textContent = "Credenciais inválidas.";
    showToast("Credenciais inválidas.", true);
  }

  document.getElementById("btn-login").disabled = false;
};

// Atualizando o listener de submit
document.getElementById("login-form").addEventListener("submit", loginHandler);

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



// Função para exibir mensagens de sucesso ou erro (Toast)
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000); // Remove a mensagem após 3 segundos
}
