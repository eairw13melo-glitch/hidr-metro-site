// Funções de Autenticação e Utilitários de Sessão (auth.js)

export function isLogged() {
  return localStorage.getItem("logado") === "true";
}

export function logout() {
  localStorage.removeItem("logado");
  window.location.href = "index.html";
}

export function hardResetConfirm() {
  if (confirm("ATENÇÃO: Isso apagará TODOS os dados salvos no seu navegador (leituras, blocos, configurações) e recarregará a página. Deseja continuar?")) {
    localStorage.clear();
    window.location.reload();
  }
}
