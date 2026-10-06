# Página de vaga — Consultor(a) Comercial | BS Finances

Página estática (HTML/CSS/JS, sem build) com apresentação da empresa, selo GPTW e
formulário de candidatura em 4 etapas:

1. **Seus dados** — nome completo, e-mail, telefone/WhatsApp, currículo (PDF/DOC/DOCX) e consentimento LGPD
2. **Perfil** — carro próprio, disponibilidade para viajar
3. **Experiência** — vendas (+ há quanto tempo), produtos financeiros (+ quais/onde), agro (+ detalhe)
4. **Pretensão salarial** — com resumo para conferência antes do envio

As perguntas de detalhe só aparecem quando a resposta é "Sim".

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Pode ser publicada em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages, Hostinger etc.).

## Para onde vão as candidaturas

Edite `config.js`:

| `modoEnvio`     | `endpoint`                                   | O que acontece |
|-----------------|----------------------------------------------|----------------|
| `""` (padrão)   | —                                            | Modo demonstração: nada é enviado (dados aparecem no console). |
| `"apps-script"` | URL do App da Web do Google Apps Script      | Envia cada candidatura para **vagas@bsfinances.com.br com o currículo anexado**, registra na planilha e (opcional) guarda cópia no Drive. Veja `backend/apps-script.gs`. |
| `"multipart"`   | Formspree, n8n, Make, Zapier ou backend próprio | `POST multipart/form-data` com todos os campos + arquivo `curriculo`. |

## Ajustes de identidade visual (pendentes)

- **Logo:** `assets/logo-bs.png` (oficial) e `assets/favicon.png` (folha do logo).
- **Selo GPTW:** coloque o selo oficial em `assets/gptw-selo.png`. Enquanto o arquivo não existir,
  a página mostra um selo provisório desenhado em CSS.
- **Cores:** amarelo `#F2CB02` e verde `#7BB92B` extraídos do logo, com verde-escuro `#13291B` de apoio. Tokens no topo de `styles.css`.
- **Textos:** o "Sobre" foi escrito a partir do posicionamento do diagnóstico de Instagram
  (representante BB Consórcios focada no produtor rural). Revise antes de publicar.
- **E-mail de contato** exibido em caso de erro: `emailContato` em `config.js`.
