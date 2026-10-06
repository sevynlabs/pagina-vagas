/**
 * Backend opcional (gratuito) para a página de vagas da BS Finances.
 * Salva cada candidatura em uma planilha Google e o currículo em uma pasta do Drive.
 *
 * Como usar:
 * 1. Crie uma planilha no Google Sheets e abra Extensões > Apps Script.
 * 2. Cole este arquivo e preencha PASTA_CURRICULOS_ID (ID da pasta do Drive, na URL da pasta).
 * 3. Implantar > Nova implantação > Tipo "App da Web"
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 * 4. Copie a URL gerada e cole em config.js:
 *      modoEnvio: "apps-script",
 *      endpoint: "https://script.google.com/macros/s/XXXX/exec"
 * 5. EMAIL_NOTIFICACAO recebe um e-mail a cada candidatura (vagas@bsfinances.com.br).
 */

var PASTA_CURRICULOS_ID = "COLE_AQUI_O_ID_DA_PASTA";
var NOME_ABA = "Candidaturas";
var EMAIL_NOTIFICACAO = "vagas@bsfinances.com.br"; // deixe "" para não receber e-mail a cada candidatura

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

    if (data.curriculo_base64) {
      var bytes = Utilities.base64Decode(data.curriculo_base64);
      var nomeArquivo = (data.nome || "candidato") + " - " + data.curriculo_nome;
      var blob = Utilities.newBlob(bytes, data.curriculo_tipo, nomeArquivo);
      var arquivo = DriveApp.getFolderById(PASTA_CURRICULOS_ID).createFile(blob);
      data.curriculo_link = arquivo.getUrl();
    }

    var sheet = getSheet_();
    sheet.appendRow(COLUNAS.map(function (c) { return data[c[0]] || ""; }));

    if (EMAIL_NOTIFICACAO) {
      MailApp.sendEmail({
        to: EMAIL_NOTIFICACAO,
        subject: "Nova candidatura: " + (data.vaga || "") + " — " + (data.nome || ""),
        body: COLUNAS.map(function (c) { return c[1] + ": " + (data[c[0]] || "-"); }).join("\n"),
      });
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
