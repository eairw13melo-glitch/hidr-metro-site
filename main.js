// Ponto de Entrada Principal e Roteamento (main.js)

// Importação e Exposição de Funções para o Escopo Global (window)
// A forma mais robusta para scripts não-módulo é usar um único arquivo.
// Como não podemos usar um bundler, vamos usar a importação dinâmica, mas com um
// tratamento de erro mais robusto e garantindo que o DOMContentLoaded só chame
// as funções após a inicialização.

// O problema é que o HTML chama funções antes do initialize() terminar.
// A solução é garantir que o initialize() seja a primeira coisa a ser chamada
// e que ele termine antes de qualquer interação.

async function initialize() {
  try {
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
    window.showToast = utils.showToast;
    window.formatarMoeda = utils.formatarMoeda; // Necessário para calculos.js

    // Expõe as funções de calculos
    window.toggleCalculadora = calculos.toggleCalculadora;
    window.calcularValor = calculos.calcularValor;
    window.atualizarTextoExplicativo = calculos.atualizarTextoExplicativo;
    window.calcularRateioSabesp = calculos.calcularRateioSabesp;

    // Expõe as funções de blocoLogic
    Object.keys(blocoLogic).forEach(key => {
      window[key] = blocoLogic[key];
    });

    // ============== BOOT / ROTAS ==============
    // Executa o roteamento imediatamente após a inicialização
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
  } catch (error) {
    console.error("Erro fatal na inicialização do main.js:", error);
    alert("Erro fatal ao carregar o sistema. Verifique os arquivos JavaScript no console.");
  }
}

// Garante que a inicialização só ocorra após o DOM estar pronto
document.addEventListener("DOMContentLoaded", initialize);
