// Funções de Cálculo (calculos.js)

import { carregarBlocos, salvarBlocos, showToast } from './utils.js';

export const DEFAULT_TARIFA = { minimo: 64.60, faixa_11_20: 8.94, faixa_21_50: 13.82 };

export function getTarifa(bloco) {
  return bloco.tarifaConfig || DEFAULT_TARIFA;
}

export function setTarifa(bloco, valores) {
  bloco.tarifaConfig = {
    minimo: Number(valores.minimo) || 0,
    faixa_11_20: Number(valores.faixa_11_20) || 0,
    faixa_21_50: Number(valores.faixa_21_50) || 0
  };
}

export function calcularValorEscalonado(m3, tarifa) {
  // A tarifa real por m³ é calculada no rateio, mas esta função usa as tarifas configuradas.
  // O usuário indicou que a lógica deve ser: Mínimo + (m3 - 10) * Valor_por_m3_Rateado.
  // No entanto, a função original usa as tarifas fixas (faixa_11_20, faixa_21_50).
  // Para refletir a lógica do usuário, vamos simplificar a tarifa para usar apenas a faixa_11_20 como o valor por m³ excedente.
  // A tarifa real de rateio será aplicada na função calcularRateioSabesp.
  
  const { minimo, faixa_11_20 } = tarifa; // Usando apenas o mínimo e a primeira faixa como tarifa excedente
  
  if (m3 <= 10) {
    return minimo;
  }
  
  // Lógica do usuário: Mínimo + (m3 - 10) * Valor_por_m3_Excedente
  // Usamos faixa_11_20 como o valor por m³ excedente para manter a estrutura de configuração.
  return minimo + (m3 - 10) * faixa_11_20;
}

// Função para recalcular o valor de todos os apartamentos no bloco
export function recalcularValoresDoBloco(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  if (!bloco) return;

  const tarifa = getTarifa(bloco);
  bloco.leitura_atual.forEach(apt => {
    const valorBase = calcularValorEscalonado(apt.total_m3, tarifa);
    apt.total_rs = valorBase.toFixed(2);
  });

  salvarBlocos(blocos);
  calcularRateioSabesp(blocoIndex); // Chama o rateio da Sabesp após o recalculo base
}

// Funções de Rateio (Sabesp)
export function calcularRateioSabesp(blocoIndex) {
  const blocos = carregarBlocos();
  const bloco = blocos[blocoIndex];
  if (!bloco) return;

  const contaSabesp = bloco.contaSabesp || 0;
  const apartamentos = bloco.leitura_atual || [];
  const tarifa = getTarifa(bloco);

  // 1. Recalcula o valor base de cada apartamento
  let totalArrecadadoBase = 0;
  apartamentos.forEach(apt => {
    const valorBase = calcularValorEscalonado(apt.total_m3, tarifa);
    apt.total_rs_base = valorBase.toFixed(2); // Salva o valor base
    apt.total_rs = valorBase.toFixed(2); // Inicializa o valor final com o base
    totalArrecadadoBase += valorBase;
  });

  const diferenca = contaSabesp - totalArrecadadoBase;

  if (diferenca > 0.01) { // Falta dinheiro (débito)
    // Distribui a diferença proporcionalmente ao consumo (m³)
    const totalM3 = apartamentos.reduce((acc, apt) => acc + apt.total_m3, 0);
    let totalRateado = 0;

    apartamentos.forEach(apt => {
      if (totalM3 > 0) {
        const proporcao = apt.total_m3 / totalM3;
        const rateio = diferenca * proporcao;
        const novoTotal = parseFloat(apt.total_rs) + rateio;
        apt.total_rs = novoTotal.toFixed(2);
        totalRateado += rateio;
      }
    });

    // Ajuste de arredondamento (se houver)
    const diferencaRateada = diferenca - totalRateado;
    if (diferencaRateada > 0.01) {
      // Adiciona o restante ao primeiro apartamento
      apartamentos[0].total_rs = (parseFloat(apartamentos[0].total_rs) + diferencaRateada).toFixed(2);
    }

    salvarBlocos(blocos);
    // renderizarBlocoIndividual(); // Será chamado pelo bloco-logic.js

    showToast(`⚠️ Débito de R$ ${diferenca.toFixed(2)} na conta Sabesp. O valor foi rateado proporcionalmente ao consumo.`, true);

  } else if (diferenca < -0.01) { // Sobra dinheiro (crédito)
    const sobra = Math.abs(diferenca);
    showToast(`✅ Sobra de R$ ${sobra.toFixed(2)} no cálculo da conta Sabesp.`, false);
    // Não altera os valores individuais, apenas informa a sobra
  }
  
  // Atualiza totais (será chamado pelo bloco-logic.js)
  // atualizarTotais(blocoIndex);
}

// Funções da Calculadora
export function calcularValor() {
  const consumo = parseFloat(document.getElementById("consumo").value) || 0;
  const valorMinimo = parseFloat(document.getElementById("valorMinimo").value) || 0;
  const valorM3 = parseFloat(document.getElementById("valorM3").value) || 0;
  const valorTotalEl = document.getElementById("valorTotal");

  let valorFinal = 0;

  if (consumo <= 10) {
    valorFinal = valorMinimo;
  } else {
    valorFinal = valorMinimo + (consumo - 10) * valorM3;
  }

  valorTotalEl.value = valorFinal.toFixed(2);
}

export function atualizarTextoExplicativo() {
  const consumo = parseFloat(document.getElementById("consumo").value) || 0;
  const valorMinimo = parseFloat(document.getElementById("valorMinimo").value) || 0;
  const valorM3 = parseFloat(document.getElementById("valorM3").value) || 0;
  const valorTotal = parseFloat(document.getElementById("valorTotal").value) || 0;
  const textoEl = document.getElementById("textoExplicativo");
  const whatsappLink = document.getElementById("whatsappLink");

  let texto = "";
  let valorExcedente = 0;

  if (consumo <= 10) {
    texto = `O consumo de **${consumo} m³** está dentro da faixa mínima. O valor a pagar é o mínimo de **${formatarMoeda(valorMinimo)}**.`;
  } else {
    valorExcedente = (consumo - 10) * valorM3;
    texto = `O consumo de **${consumo} m³** excedeu a faixa mínima em **${consumo - 10} m³**.
    <br>
    - Valor Mínimo (até 10m³): **${formatarMoeda(valorMinimo)}**
    - Valor Excedente (${consumo - 10}m³ x ${formatarMoeda(valorM3)}): **${formatarMoeda(valorExcedente)}**
    <br>
    **Total:** **${formatarMoeda(valorTotal)}**`;
  }

  textoEl.innerHTML = texto;

  // Atualiza link do WhatsApp
  const mensagem = `Olá, meu consumo de água foi de ${consumo} m³. O valor total da minha conta é de ${formatarMoeda(valorTotal)}.`;
  whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}

export function toggleCalculadora() {
  const calc = document.getElementById("calculator-container");
  const listaBlocos = document.getElementById("lista-blocos");
  
  if (calc && listaBlocos) {
    if (calc.style.display === "none" || calc.style.display === "") {
      // Abrir calculadora
      calc.style.display = "block";
      listaBlocos.style.display = 'none';
      calcularValor();
      atualizarTextoExplicativo();
    } else {
      // Fechar calculadora
      calc.style.display = "none";
      listaBlocos.style.display = 'block';
    }
  }
}
