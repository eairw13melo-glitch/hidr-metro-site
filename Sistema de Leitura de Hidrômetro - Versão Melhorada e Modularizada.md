# Sistema de Leitura de Hidrômetro - Versão Melhorada e Modularizada

## O que foi melhorado?

Esta atualização foca em **Segurança**, **Organização do Código** e **Correção de Funcionalidades** essenciais, além de melhorias de **UX/Desempenho**.

### 1. Organização do Código (Modularização)
O extenso arquivo `script.js` foi dividido em módulos menores, facilitando a manutenção e a adição de novas funcionalidades:
- `main.js`: Ponto de entrada principal e inicialização.
- `utils.js`: Funções utilitárias (Toast, formatação, etc.).
- `auth.js`: Lógica de autenticação e alteração de senha.
- `calculos.js`: Funções de cálculo de tarifa e rateio.
- `bloco-logic.js`: Lógica de CRUD de blocos, apartamentos e histórico.
- **O antigo `script.js` foi removido.**

### 2. Segurança
- **Credenciais Padrão Removidas:** As credenciais de login (`admin`/`1234`) foram removidas do código. No primeiro acesso, o sistema forçará a criação de um novo usuário e senha, armazenados de forma segura (hash) no `localStorage`.
- **Content Security Policy (CSP):** Adicionada uma política de segurança nos arquivos HTML para mitigar ataques de Cross-Site Scripting (XSS).

### 3. Correção e Implementação de Funcionalidades
- **Cálculo de Armazenamento Local:** Corrigido o erro que exibia 0.00 MB. O contador agora mostra o uso real do `localStorage`.
- **Imprimir Recibo:** A funcionalidade de impressão de recibo foi corrigida e está funcionando corretamente, permitindo a visualização e exportação para PDF.
- **Exportar/Importar Histórico de Leitura:** As funções de exportação (para XLSX) e importação (para JSON) do histórico foram corrigidas e implementadas.

### 4. Melhorias de UX/Desempenho
- **Logo na Calculadora:** A logo do usuário (`logorecibo.png`) foi adicionada à Calculadora de Conta de Água no Dashboard.
- **Soma Total das Colunas M³ e R$:** Adicionada uma linha de **totalizadores** nas tabelas de leitura.

## Arquivos Modificados e Novos

| Ação | Arquivo | Descrição |
| :--- | :--- | :--- |
| **NOVO** | `main.js` | Ponto de entrada principal. |
| **NOVO** | `utils.js` | Funções utilitárias e de UI. |
| **NOVO** | `auth.js` | Lógica de autenticação e alteração de senha. |
| **NOVO** | `calculos.js` | Funções de cálculo de tarifa e rateio. |
| **NOVO** | `bloco-logic.js` | Lógica de CRUD de blocos e apartamentos. |
| **REMOVIDO** | `script.js` | Substituído pelos módulos acima. |
| **MODIFICADO** | `index.html` | Adição de CSP. |
| **MODIFICADO** | `dashboard.html` | Adição de CSP e logo na calculadora. |
| **MODIFICADO** | `bloco.html` | Adição de CSP e botões de Import/Export Histórico. |
| **MODIFICADO** | `boletos.html` | Adição de CSP. |
| **MODIFICADO** | `login-seguro.js` | Remoção de credenciais padrão e nova lógica de primeiro acesso. |
| **MODIFICADO** | `style.css` | Pequenos ajustes de estilo. |

## Como usar os arquivos atualizados

1. **Substitua os arquivos antigos pelos novos** (incluindo a remoção do `script.js` e a adição dos 5 novos arquivos `.js`).
2. **Abra o arquivo `index.html` no navegador.**
3. **Primeiro Acesso:** O sistema pedirá para você criar um novo usuário e senha.
4. **Faça login** e explore as novas funcionalidades e correções.

---

**Desenvolvido por:** Manus AI  
**Data da atualização:** 14/11/2025
