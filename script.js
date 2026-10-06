(function () {
  "use strict";

  var CFG = Object.assign({
    modoEnvio: "",
    endpoint: "",
    curriculoTamanhoMaxMB: 5,
    curriculoExtensoes: [".pdf", ".doc", ".docx"],
    emailContato: "",
  }, window.VAGA_CONFIG || {});

  var form = document.getElementById("formVaga");
  var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
  var indicators = document.querySelectorAll("[data-step-indicator]");
  var btnPrev = document.getElementById("btnPrev");
  var btnNext = document.getElementById("btnNext");
  var btnSubmit = document.getElementById("btnSubmit");
  var progressBar = document.getElementById("progressBar");
  var feedback = document.getElementById("formFeedback");
  var fileInput = document.getElementById("curriculo");
  var dropzone = document.getElementById("dropzone");
  var fileName = document.getElementById("fileName");
  var current = 0;

  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("maxMb").textContent = CFG.curriculoTamanhoMaxMB;

  /* ---------- Navegação entre etapas ---------- */
  function showStep(i) {
    current = i;
    steps.forEach(function (s, idx) { s.classList.toggle("is-active", idx === i); });
    indicators.forEach(function (el, idx) {
      el.classList.toggle("is-active", idx === i);
      el.classList.toggle("is-done", idx < i);
    });
    progressBar.style.width = ((i + 1) / steps.length) * 100 + "%";
    btnPrev.hidden = i === 0;
    btnNext.hidden = i === steps.length - 1;
    btnSubmit.hidden = i !== steps.length - 1;
    feedback.hidden = true;
    if (i === steps.length - 1) renderSummary();
  }

  function scrollToForm() {
    document.getElementById("candidatura").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  btnNext.addEventListener("click", function () {
    if (!validateStep(current)) return;
    showStep(current + 1);
    scrollToForm();
  });
  btnPrev.addEventListener("click", function () {
    showStep(current - 1);
    scrollToForm();
  });

  // Enter avança de etapa em vez de enviar o formulário
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && current < steps.length - 1) {
      e.preventDefault();
      btnNext.click();
    }
  });

  /* ---------- Perguntas condicionais ---------- */
  form.querySelectorAll("input[data-reveal]").forEach(function (input) {
    input.addEventListener("change", function () {
      form.querySelectorAll('input[name="' + input.name + '"][data-reveal]').forEach(function (sib) {
        var id = sib.getAttribute("data-reveal");
        if (!id) return;
        var box = document.getElementById(id);
        var show = sib.checked;
        box.hidden = !show;
        if (!show) clearInside(box);
      });
    });
  });

  function clearInside(box) {
    box.querySelectorAll("input, textarea").forEach(function (el) {
      if (el.type === "radio" || el.type === "checkbox") el.checked = false;
      else el.value = "";
    });
    box.querySelectorAll(".field").forEach(clearError);
  }

  /* ---------- Validação ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldOf(el) { return el.closest(".field"); }
  function setError(field, msg) {
    field.classList.add("has-error");
    var err = field.querySelector(".field__error");
    if (err) err.textContent = msg;
  }
  function clearError(field) {
    field.classList.remove("has-error");
    var err = field.querySelector(".field__error");
    if (err) err.textContent = "";
  }
  function isVisible(el) { return !el.closest("[hidden]"); }

  function validateStep(i) {
    var step = steps[i];
    var ok = true;
    var firstBad = null;
    var checkedGroups = {};

    step.querySelectorAll("input, textarea").forEach(function (el) {
      if (el.type === "hidden" || el.classList.contains("hp") || !isVisible(el)) return;
      var field = fieldOf(el);
      if (!field) return;

      var required = el.required || el.hasAttribute("data-required-when-visible");
      var msg = "";

      if (el.type === "radio" || el.type === "checkbox") {
        if (el.name === "consentimento_lgpd") {
          if (!el.checked) msg = "É preciso autorizar o uso dos dados para se candidatar.";
        } else {
          if (checkedGroups[el.name]) return;
          checkedGroups[el.name] = true;
          var groupRequired = Array.prototype.some.call(
            form.querySelectorAll('[name="' + el.name + '"]'),
            function (r) { return r.required || r.hasAttribute("data-required-when-visible"); }
          );
          var any = form.querySelector('[name="' + el.name + '"]:checked');
          if (groupRequired && !any) msg = el.type === "checkbox" ? "Selecione ao menos uma opção." : "Selecione uma opção.";
        }
      } else if (el.type === "file") {
        msg = validateFile(el.files[0]);
      } else {
        var v = el.value.trim();
        if (required && !v) msg = "Campo obrigatório.";
        else if (el.name === "nome" && v.split(/\s+/).length < 2) msg = "Informe seu nome completo.";
        else if (el.type === "email" && !EMAIL_RE.test(v)) msg = "Informe um e-mail válido.";
        else if (el.name === "telefone" && onlyDigits(v).length < 10) msg = "Informe um telefone com DDD.";
        else if (el.name === "pretensao_salarial" && parseMoney(v) <= 0) msg = "Informe um valor.";
      }

      if (msg) {
        setError(field, msg);
        ok = false;
        if (!firstBad) firstBad = el;
      } else {
        clearError(field);
      }
    });

    if (firstBad) {
      var target = firstBad.type === "file" ? dropzone : firstBad;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (firstBad.type !== "radio" && firstBad.type !== "checkbox") firstBad.focus({ preventScroll: true });
    }
    return ok;
  }

  // limpa o erro assim que o usuário corrige
  form.addEventListener("input", function (e) {
    var f = e.target.closest && e.target.closest(".field");
    if (f && f.classList.contains("has-error")) clearError(f);
  });
  form.addEventListener("change", function (e) {
    var f = e.target.closest && e.target.closest(".field");
    if (f && f.classList.contains("has-error") && e.target.type !== "file") clearError(f);
  });

  /* ---------- Currículo ---------- */
  function validateFile(file) {
    if (!file) return "Anexe seu currículo.";
    var name = file.name.toLowerCase();
    var okExt = CFG.curriculoExtensoes.some(function (ext) { return name.slice(-ext.length) === ext; });
    if (!okExt) return "Formato não aceito. Envie " + CFG.curriculoExtensoes.join(", ").toUpperCase().replace(/\./g, "") + ".";
    if (file.size > CFG.curriculoTamanhoMaxMB * 1024 * 1024) return "Arquivo maior que " + CFG.curriculoTamanhoMaxMB + " MB.";
    return "";
  }

  function onFileChosen() {
    var file = fileInput.files[0];
    var field = fieldOf(fileInput);
    if (!file) {
      fileName.hidden = true;
      dropzone.classList.remove("has-file");
      return;
    }
    var err = validateFile(file);
    if (err) {
      setError(field, err);
      fileName.hidden = true;
      dropzone.classList.remove("has-file");
      return;
    }
    clearError(field);
    fileName.textContent = "📎 " + file.name + " (" + formatSize(file.size) + ")";
    fileName.hidden = false;
    dropzone.classList.add("has-file");
  }
  fileInput.addEventListener("change", onFileChosen);

  ["dragenter", "dragover"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add("is-drag"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove("is-drag"); });
  });
  dropzone.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      onFileChosen();
    }
  });

  function formatSize(b) {
    return b < 1024 * 1024 ? Math.round(b / 1024) + " KB" : (b / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
  }

  /* ---------- Máscaras ---------- */
  function onlyDigits(s) { return (s || "").replace(/\D/g, ""); }

  var tel = document.getElementById("telefone");
  tel.addEventListener("input", function () {
    var d = onlyDigits(tel.value).slice(0, 11);
    var out = d;
    if (d.length > 10) out = "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    else if (d.length > 6) out = "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    else if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
    else if (d.length) out = "(" + d;
    tel.value = out;
  });

  var money = document.getElementById("pretensao_salarial");
  money.addEventListener("input", function () {
    var d = onlyDigits(money.value).replace(/^0+/, "").slice(0, 9);
    if (!d) { money.value = ""; return; }
    var cents = parseInt(d, 10);
    money.value = (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });
  function parseMoney(v) { return parseInt(onlyDigits(v) || "0", 10) / 100; }

  /* ---------- Resumo ---------- */
  var LABELS = [
    ["nome", "Nome"],
    ["email", "E-mail"],
    ["telefone", "Telefone"],
    ["curriculo", "Currículo"],
    ["carro_proprio", "Carro próprio"],
    ["disponibilidade_viagem", "Disponibilidade para viajar"],
    ["experiencia_vendas", "Experiência com vendas"],
    ["tempo_vendas", "Tempo em vendas"],
    ["experiencia_financeiro", "Produtos financeiros"],
    ["produtos_financeiros", "Quais produtos"],
    ["financeiro_onde", "Onde / quanto tempo"],
    ["experiencia_agro", "Experiência no agro"],
    ["agro_detalhe", "Detalhe no agro"],
    ["pretensao_salarial", "Pretensão salarial"],
  ];

  function collect() {
    var fd = new FormData(form);
    var data = {};
    LABELS.forEach(function (pair) {
      var key = pair[0];
      if (key === "curriculo") {
        data[key] = fileInput.files[0] ? fileInput.files[0].name : "";
        return;
      }
      var all = fd.getAll(key).filter(Boolean);
      data[key] = all.join(", ");
    });
    if (data.pretensao_salarial) data.pretensao_salarial = "R$ " + data.pretensao_salarial;
    return data;
  }

  function renderSummary() {
    var data = collect();
    var html = "<h4>Confira seus dados antes de enviar</h4><dl>";
    LABELS.forEach(function (pair) {
      var v = data[pair[0]];
      if (!v || pair[0] === "pretensao_salarial") return;
      html += "<dt>" + pair[1] + "</dt><dd>" + escapeHtml(v) + "</dd>";
    });
    html += "</dl>";
    document.getElementById("summary").innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Envio ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    for (var i = 0; i < steps.length; i++) {
      if (!validateStep(i)) { showStep(i); validateStep(i); return; }
    }
    // honeypot preenchido = bot; finge sucesso
    if (form.querySelector('[name="_website"]').value) { showSuccess(); return; }

    setLoading(true);
    send()
      .then(showSuccess)
      .catch(function (err) {
        console.error(err);
        feedback.textContent = "Não foi possível enviar sua candidatura agora. Tente novamente em instantes" +
          (CFG.emailContato ? " ou envie seu currículo para " + CFG.emailContato + "." : ".");
        feedback.hidden = false;
      })
      .then(function () { setLoading(false); });
  });

  function setLoading(on) {
    btnSubmit.disabled = on;
    btnPrev.disabled = on;
    btnSubmit.classList.toggle("is-loading", on);
    btnSubmit.querySelector(".btn__label").textContent = on ? "Enviando..." : "Enviar candidatura";
  }

  function basePayload() {
    var data = collect();
    data.vaga = "Consultor(a) Comercial";
    data.consentimento_lgpd = "Sim";
    data.enviado_em = new Date().toISOString();
    data.origem = location.href;
    return data;
  }

  function send() {
    var payload = basePayload();
    var file = fileInput.files[0];

    if (!CFG.modoEnvio || !CFG.endpoint) {
      console.info("[Modo demonstração] Candidatura não enviada. Configure config.js. Dados:", payload);
      return new Promise(function (r) { setTimeout(r, 700); });
    }

    if (CFG.modoEnvio === "apps-script") {
      return readAsBase64(file).then(function (b64) {
        payload.curriculo_nome = file.name;
        payload.curriculo_tipo = file.type || "application/octet-stream";
        payload.curriculo_base64 = b64;
        // text/plain evita preflight CORS no Apps Script
        return fetch(CFG.endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
      }).then(checkResponse);
    }

    var fd = new FormData();
    Object.keys(payload).forEach(function (k) { if (k !== "curriculo") fd.append(k, payload[k]); });
    fd.append("curriculo", file, file.name);
    return fetch(CFG.endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(checkResponse);
  }

  function checkResponse(res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.text().then(function (t) {
      try {
        var j = JSON.parse(t);
        if (j && (j.ok === false || j.result === "error")) throw new Error(j.error || "Erro no servidor");
      } catch (err) {
        if (err instanceof SyntaxError) return; // resposta não-JSON com 2xx = sucesso
        throw err;
      }
    });
  }

  function readAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1]); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function showSuccess() {
    var first = (form.nome.value.trim().split(/\s+/)[0]) || "";
    document.getElementById("successName").textContent = first;
    form.hidden = true;
    document.querySelector(".steps").hidden = true;
    document.querySelector(".progress").hidden = true;
    document.getElementById("success").hidden = false;
    scrollToForm();
  }

  showStep(0);
})();
