# Leitura de Hidrômetro — App Web

## Destaques
- Login simples (`admin/1234`)
- Cadastro, exclusão e gestão de **blocos**
- **Tarifas por bloco** (independentes)
- Lançamento de leituras + cálculo escalonado
- Exportar XLSX (leitura atual e fechamento) / Importar XLSX
- Histórico mensal (`YYYY-MM`, com sufixo `-a`, `-b` se múltiplos fechamentos no mês)

## Pastas/Arquivos
- `index.html` — login
- `dashboard.html` — lista de blocos (+ criar, importar/exportar, **excluir**)
- `bloco.html` — cada bloco (tarifa do bloco + leituras + histórico)
- `script.js` — lógica
- `style.css` — estilos

> Os dados ficam no **localStorage** do navegador.
