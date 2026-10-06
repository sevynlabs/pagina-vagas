/**
 * Configuração da página de vaga.
 * Edite aqui sem precisar mexer no HTML/JS.
 */
window.VAGA_CONFIG = {
  // Para onde o formulário é enviado.
  //  - "multipart": POST multipart/form-data (Formspree, Make, n8n, Zapier, backend próprio).
  //  - "apps-script": POST JSON com o currículo em base64 para um Google Apps Script
  //    (veja backend/apps-script.gs — salva na planilha e o currículo no Drive).
  //  - "": modo demonstração (não envia nada, apenas mostra a tela de sucesso e loga no console).
  modoEnvio: "",
  endpoint: "",

  // Currículo
  curriculoTamanhoMaxMB: 5,
  curriculoExtensoes: [".pdf", ".doc", ".docx"],

  // Contato exibido em caso de erro no envio
  emailContato: "vagas@bsfinances.com.br",
};
