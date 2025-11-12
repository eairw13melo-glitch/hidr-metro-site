# Sistema de Boletos - Melhorias Implementadas

## 🎉 Novidades da Versão 2.0

### ✅ Melhorias Implementadas nos Boletos

#### 1. Campo da Conta Sabesp
O sistema já possui um campo para inserir o valor da conta Sabesp na página do bloco. Este valor é usado para:
- Calcular o rateio automático entre apartamentos
- Exibir na capa dos boletos
- Mostrar a diferença entre arrecadado e conta na contracapa

**Como usar:**
1. Acesse o bloco
2. Localize o campo "Valor da Conta Sabesp (R$)"
3. Digite o valor e pressione Enter
4. O sistema recalculará automaticamente os valores de cada apartamento

#### 2. Espaço de Assinatura Aprimorado

**Boleto Superior (para o Síndico):**
- Campo "RECEBIDO POR:" com linha para assinatura manual
- Campo "DATA:" com espaços para preenchimento (____/____/________)
- Espaçamento aumentado para facilitar a assinatura

**Boleto Inferior (para o Morador):**
- Campo "SÍNDICO:" com o nome do síndico já preenchido
- Serve como comprovante para o morador

#### 3. Linhas de Corte Profissionais

Três linhas tracejadas de ponta a ponta para corte perfeito com guilhotina:
- ✂️ Linha ANTES do primeiro boleto
- ✂️ Linha ENTRE os dois boletos
- ✂️ Linha APÓS o segundo boleto

As linhas vão de uma extremidade à outra do papel, facilitando o corte reto e preciso.

#### 4. Capa dos Boletos

Uma capa profissional com design moderno que inclui:
- **Título:** "Boletos de Água"
- **Nome do Bloco:** Em destaque
- **Informações principais:**
  - Endereço
  - Síndico
  - Mês de referência
  - Data de vencimento
- **Destaque especial:** Valor total da conta Sabesp em fonte grande
- **Rodapé:** Total de apartamentos e data de emissão

**Cores:** Gradiente azul profissional

#### 5. Contracapa com Resumo

Uma contracapa completa com todas as informações consolidadas:
- **Título:** "Resumo da Cobrança"
- **Totais calculados:**
  - Total de apartamentos
  - Consumo total (m³)
  - Valor total arrecadado
  - Conta Sabesp
  - **Diferença** (em verde se positivo, vermelho se negativo)
- **Observações:** Instruções e contato do síndico
- **Rodapé:** Data e hora de geração do documento

## 📋 Como Imprimir os Boletos

1. **Acesse a página de boletos:**
   - Entre no bloco desejado
   - Clique no botão "🧾 Boletos (imprimir)"

2. **Configure os parâmetros:**
   - Selecione a data de vencimento
   - Escolha a origem dos dados (Leitura Atual ou Histórico)
   - Opcionalmente, filtre por responsável

3. **Clique em "Atualizar"** para gerar os boletos

4. **Clique em "🖨️ Imprimir"** ou use Ctrl+P

5. **Configurações de impressão recomendadas:**
   - Orientação: Retrato
   - Tamanho: A4
   - Margens: Padrão
   - Páginas por folha: 1
   - Imprimir cores de fundo: ✅ Ativado (para ver a capa colorida)

## 🎨 Estrutura Visual dos Boletos

```
┌─────────────────────────────────────┐
│         CAPA (página 1)             │
│  - Título e nome do bloco           │
│  - Informações principais           │
│  - Valor da conta Sabesp            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ✂️ Linha de corte                  │
├─────────────────────────────────────┤
│  BOLETO 1 (Apto 101-A)              │
│  - Para o síndico                   │
│  - Com assinatura e data            │
├─────────────────────────────────────┤
│  ✂️ Linha de corte                  │
├─────────────────────────────────────┤
│  BOLETO 2 (Apto 101-A)              │
│  - Para o morador                   │
│  - Com nome do síndico              │
├─────────────────────────────────────┤
│  ✂️ Linha de corte                  │
└─────────────────────────────────────┘

... (mais páginas com boletos) ...

┌─────────────────────────────────────┐
│    CONTRACAPA (última página)       │
│  - Resumo da cobrança               │
│  - Totais consolidados              │
│  - Diferença e observações          │
└─────────────────────────────────────┘
```

## 💡 Dicas de Uso

### Para o Síndico:
1. Sempre confira o valor da conta Sabesp antes de gerar os boletos
2. Imprima a capa e contracapa junto com os boletos para ter um registro completo
3. Use a contracapa para conferir se os valores estão corretos
4. Guarde a via superior (com sua assinatura) como comprovante de entrega

### Para Cortar os Boletos:
1. Use uma guilhotina de papel para cortes perfeitos
2. Siga as linhas tracejadas de ponta a ponta
3. Cada folha terá 2 boletos (superior e inferior)
4. O boleto superior fica com o síndico
5. O boleto inferior é entregue ao morador

## 📊 Informações nos Boletos

Cada boleto contém:
- Número do apartamento/hidrômetro
- Nome do responsável
- Mês e ano de referência
- Data de vencimento
- Leitura anterior e atual
- Consumo em m³
- Valores detalhados:
  - Serviço de leitura
  - Total de consumo
  - Condomínio
  - Multas/Outros
  - **TOTAL a pagar**
- Observações gerais e específicas do apartamento
- Espaço para assinatura

## 🔄 Próximas Melhorias Sugeridas

Consulte o arquivo `sugestoes_boletos.md` para ver as 10 sugestões de melhorias futuras, incluindo:
- QR Code para pagamento PIX
- Código de barras
- Numeração sequencial
- Histórico de consumo
- E muito mais!

---

**Versão:** 2.0  
**Data:** 11/11/2025  
**Desenvolvido por:** Manus AI
