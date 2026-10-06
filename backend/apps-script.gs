/**
 * Backend opcional (gratuito) para a página de vagas da BS Finances.
 * A cada candidatura:
 *  - envia um e-mail para EMAIL_NOTIFICACAO com as respostas e o CURRÍCULO ANEXADO
 *    (responder o e-mail já responde direto ao candidato);
 *  - registra uma linha na planilha;
 *  - guarda uma cópia do currículo no Drive (opcional: deixe PASTA_CURRICULOS_ID vazio para não guardar).
 *
 * Como usar:
 * 1. Crie uma planilha no Google Sheets e abra Extensões > Apps Script.
 * 2. Cole este arquivo. (Opcional) Preencha PASTA_CURRICULOS_ID com o ID da pasta do Drive
 *    (o trecho da URL depois de /folders/).
 * 3. Implantar > Nova implantação > Tipo "App da Web"
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 * 4. Copie a URL gerada e cole em config.js:
 *      modoEnvio: "apps-script",
 *      endpoint: "https://script.google.com/macros/s/XXXX/exec"
 * 5. Na primeira implantação o Google pede autorização (Gmail, Planilhas e Drive): aceite.
 *    Os e-mails saem da conta Google que implantou o script.
 */

var PASTA_CURRICULOS_ID = ""; // opcional: ID da pasta do Drive para guardar cópia dos currículos
var NOME_ABA = "Candidaturas";
var EMAIL_NOTIFICACAO = "vagas@bsfinances.com.br"; // recebe cada candidatura com o currículo anexado

var COLUNAS = [
  ["enviado_em", "Data"],
  ["vaga", "Vaga"],
  ["nome", "Nome"],
  ["email", "E-mail"],
  ["telefone", "Telefone"],
  ["curriculo_link", "Currículo"],
  ["carro_proprio", "Carro próprio"],
  ["disponibilidade_viagem", "Disponibilidade p/ viajar"],
  ["experiencia_vendas", "Exp. vendas"],
  ["tempo_vendas", "Tempo em vendas"],
  ["experiencia_financeiro", "Exp. produtos financeiros"],
  ["produtos_financeiros", "Quais produtos"],
  ["financeiro_onde", "Onde / quanto tempo"],
  ["experiencia_agro", "Exp. agro"],
  ["agro_detalhe", "Detalhe agro"],
  ["pretensao_salarial", "Pretensão salarial"],
  ["consentimento_lgpd", "Consentimento LGPD"],
  ["origem", "Origem"],
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);

    var blob = null;
    if (data.curriculo_base64) {
      var bytes = Utilities.base64Decode(data.curriculo_base64);
      var nomeArquivo = "Currículo - " + (data.nome || "candidato") + " - " + data.curriculo_nome;
      blob = Utilities.newBlob(bytes, data.curriculo_tipo, nomeArquivo);
      if (PASTA_CURRICULOS_ID) {
        data.curriculo_link = DriveApp.getFolderById(PASTA_CURRICULOS_ID).createFile(blob).getUrl();
      } else {
        data.curriculo_link = "Anexado no e-mail";
      }
    }

    var sheet = getSheet_();
    sheet.appendRow(COLUNAS.map(function (c) { return data[c[0]] || ""; }));

    if (EMAIL_NOTIFICACAO) {
      var email = {
        to: EMAIL_NOTIFICACAO,
        subject: "Nova candidatura: " + (data.vaga || "") + " — " + (data.nome || ""),
        body: COLUNAS.map(function (c) { return c[1] + ": " + (data[c[0]] || "-"); }).join("\n"),
        name: "Vagas BS Finances",
      };
      if (blob) email.attachments = [blob];
      if (data.email) email.replyTo = data.email;
      MailApp.sendEmail(email);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA) || ss.insertSheet(NOME_ABA);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUNAS.map(function (c) { return c[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUNAS.length).setFontWeight("bold");
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
