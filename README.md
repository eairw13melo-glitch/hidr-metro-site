# Leitura de Hidrômetro — App Web

## O que este pacote faz
- Login simples (`admin/1234`)
- Cadastro de **blocos**
- Em cada bloco:
  - **Configurações de Tarifa 💧 independentes**
  - Lançamento de leituras (Anterior/Atual → m³ → R$)
  - Exportar XLSX da leitura atual e do fechamento do mês
  - Importar XLSX da leitura atual (mapeamento por linhas)
  - Histórico de leituras por mês (`YYYY-MM`, com sufixo `-a`, `-b` se salvar mais de uma vez no mesmo mês)

## Arquitetura
- `index.html` — login
- `dashboard.html` — lista / criar / importar / exportar blocos
- `bloco.html` — tela do bloco com tarifa própria + leituras + histórico
- `script.js` — toda a lógica
- `style.css` — estilos (sem inline)

## Como usar
1. Abra `index.html` (servidor local ou direto no navegador).
2. Faça login: **admin / 1234**.
3. No **Dashboard**, crie um bloco.
4. Entre no bloco, ajuste a **tarifa do bloco** (se necessário).
5. Lance leituras (coluna “Atual”), exporte/import ou salve o mês.

> **Observação**: Este app usa `localStorage`. Os dados ficam no seu navegador.
