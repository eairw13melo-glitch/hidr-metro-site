// Ponto de Entrada Principal e Roteamento (main.js)

import { isLogged, logout, hardResetConfirm } from './auth.js';
import { atualizarContadorStorage, exportarDadosJSON, acionarImportacaoJSON, importarDadosJSON } from './utils.js';
import { toggleCalculadora } from './calculos.js';
import { 
  renderizarListaDeBlocos, criarBloco, editarBloco, excluirBloco, 
  abrirModalImpressaoRecibo, popularMesesRecibo, gerarReciboParaImpressao, 
  fecharModalVisualizacaoRecibo, imprimirRecibo, exportarParaPDF, 
  renderizarBlocoIndividual, renderizarBoletosPage, atualizarBoletos, 
  exportarLeituraAtual, importarLeituraAtual, gerarTemplateImportacao, 
  exportarHistorico, importarHistorico,
  removerApartamento, salvarLeitura, resetarBlocoPerguntar, adicionarApartamento
} from './bloco-logic.js';

// Expondo funções globais para uso no HTML (necessário para onclick)
window.isLogged = isLogged;
window.logout = logout;
window.hardResetConfirm = hardResetConfirm;
window.toggleCalculadora = toggleCalculadora;
window.exportarDadosJSON = exportarDadosJSON;
window.acionarImportacaoJSON = acionarImportacaoJSON;
window.importarDadosJSON = importarDadosJSON;

// Funções de Bloco/UI
window.renderizarListaDeBlocos = renderizarListaDeBlocos;
window.criarBloco = criarBloco;
window.editarBloco = editarBloco;
window.excluirBloco = excluirBloco;
window.abrirModalImpressaoRecibo = abrirModalImpressaoRecibo;
window.popularMesesRecibo = popularMesesRecibo;
window.gerarReciboParaImpressao = gerarReciboParaImpressao;
window.fecharModalVisualizacaoRecibo = fecharModalVisualizacaoRecibo;
window.imprimirRecibo = imprimirRecibo;
window.exportarParaPDF = exportarParaPDF;
window.renderizarBlocoIndividual = renderizarBlocoIndividual;
window.renderizarBoletosPage = renderizarBoletosPage;
window.atualizarBoletos = atualizarBoletos;
window.exportarLeituraAtual = exportarLeituraAtual;
window.importarLeituraAtual = importarLeituraAtual;
window.gerarTemplateImportacao = gerarTemplateImportacao;
window.exportarHistorico = exportarHistorico;
window.importarHistorico = importarHistorico;
window.removerApartamento = removerApartamento;
window.salvarLeitura = salvarLeitura;
window.resetarBlocoPerguntar = resetarBlocoPerguntar;
window.adicionarApartamento = adicionarApartamento;


// ============== BOOT / ROTAS ==============
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname;

  // Página de login: a lógica de login está em login-seguro.js
  if (document.getElementById("login-form")) return;

  // Páginas internas exigem login (há script inline nas páginas também)
  if (!isLogged()) return;

  // Roteamento simples
  if (path.endsWith("dashboard.html")) {
    renderizarListaDeBlocos();
    atualizarContadorStorage(); // Chama a função ao carregar o dashboard
  } else if (path.endsWith("bloco.html")) {
    renderizarBlocoIndividual();
  } else if (path.endsWith("boletos.html")) {
    renderizarBoletosPage();
  }
});
