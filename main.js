// Ponto de Entrada Principal e Roteamento (main.js)

// Ponto de Entrada Principal e Roteamento (main.js)

// Importação e Exposição de Funções para o Escopo Global (window)
// Isso é necessário porque o HTML usa 'onclick="funcao()"' e não está usando type="module"

async function initialize() {
  // Importa todos os módulos
  const auth = await import('./auth.js');
  const utils = await import('./utils.js');
  const calculos = await import('./calculos.js');
  const blocoLogic = await import('./bloco-logic.js');

  // Expõe as funções de auth
  window.isLogged = auth.isLogged;
  window.logout = auth.logout;
  window.hardResetConfirm = auth.hardResetConfirm;
  
  // Expõe as funções de utils
  window.atualizarContadorStorage = utils.atualizarContadorStorage;
  window.exportarDadosJSON = utils.exportarDadosJSON;
  window.acionarImportacaoJSON = utils.acionarImportacaoJSON;
  window.importarDadosJSON = utils.importarDadosJSON;

  // Expõe as funções de calculos
  window.toggleCalculadora = calculos.toggleCalculadora;
  window.calcularValor = calculos.calcularValor;
  window.atualizarTextoExplicativo = calculos.atualizarTextoExplicativo;

  // Expõe as funções de blocoLogic
  Object.keys(blocoLogic).forEach(key => {
    window[key] = blocoLogic[key];
  });

  // ============== BOOT / ROTAS ==============
  document.addEventListener("DOMContentLoaded", () => {
    const path = location.pathname;

    // Página de login: a lógica de login está em login-seguro.js
    if (document.getElementById("login-form")) return;

    // Páginas internas exigem login (há script inline nas páginas também)
    if (!auth.isLogged()) return;

    // Roteamento simples
    if (path.endsWith("dashboard.html")) {
      blocoLogic.renderizarListaDeBlocos();
      utils.atualizarContadorStorage(); // Chama a função ao carregar o dashboard
    } else if (path.endsWith("bloco.html")) {
      blocoLogic.renderizarBlocoIndividual();
    } else if (path.endsWith("boletos.html")) {
      blocoLogic.renderizarBoletosPage();
    }
  });
}

initialize();
