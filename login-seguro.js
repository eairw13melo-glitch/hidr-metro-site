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

  if (username === usuarioSalvo.username && senhaHash === usuarioSalvo.passwordHash) {
    resetarTentativas();
    sessionStorage.setItem("token", gerarToken());
    localStorage.setItem("logado", "true");
    
    // AVISO DE SEGURANÇA: Este sistema não é seguro para produção.
    alert("AVISO DE SEGURANÇA: O login atual é fixo (admin/1234) e o status de login é armazenado localmente (localStorage). Este sistema NÃO é seguro para uso em produção ou com dados sensíveis. Considere implementar um backend com autenticação real.");
    
    location.href = "dashboard.html";
    showToast("Login realizado com sucesso!");
  } else {
    registrarTentativaFalha();
    erroEl.textContent = "Credenciais inválidas.";
    showToast("Credenciais inválidas.", true);
  }

  document.getElementById("btn-login").disabled = false;
});

// Função para exibir mensagens de sucesso ou erro (Toast)
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000); // Remove a mensagem após 3 segundos
}
