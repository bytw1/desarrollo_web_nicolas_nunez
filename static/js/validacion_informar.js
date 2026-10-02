// Validación del formulario "Informar Avistamiento" (lado cliente).
// Si todo es válido, el formulario se envía a Flask, que vuelve a validar.
(() => {
  const MAX_ARCHIVOS = 5;
  const MAX_BYTES_TOTAL = 50 * 1024 * 1024; // igual que MAX_CONTENT_LENGTH en config.py

  // Validación para textos simples (lugar)
  const validateText = (text, minLength = 3, maxLength = 200) => {
    if (!text) return false;
    const largo = text.trim().length;
    return largo >= minLength && largo <= maxLength;
  };

  // Validación de los desplegables (voluntario y ave)
  const validateSelect = (val) => val !== "" && val !== null;

  // Fecha: no puede ser futura ni anterior a 1 año atrás
  const validateFechaHora = (dateTimeStr) => {
    if (!dateTimeStr) return false;

    const fechaIngresada = new Date(dateTimeStr);
    if (isNaN(fechaIngresada.getTime())) return false;

    const ahora = new Date();
    if (fechaIngresada > ahora) return false;

    const haceUnAnio = new Date();
    haceUnAnio.setFullYear(ahora.getFullYear() - 1);
    if (fechaIngresada < haceUnAnio) return false;

    return true;
  };

  // Al menos 1 y máximo 5 archivos, todos imagen o video
  const validateFiles = (files) => {
    if (!files || files.length === 0) return false;
    if (files.length > MAX_ARCHIVOS) return false;

    let total = 0;
    for (const file of files) {
      const familia = file.type.split("/")[0];
      if (familia !== "image" && familia !== "video") return false;
      total += file.size;
    }
    return total <= MAX_BYTES_TOTAL;
  };

  const validateForm = () => {
    const form = document.forms["informarForm"];
    const voluntario = form["voluntario_id"].value;
    const ave = form["ave_id"].value;
    const lugar = form["lugar"].value;
    const fechaHora = form["fecha_hora"].value;
    const descripcion = form["descripcion"].value;
    const archivos = form["archivos"].files;

    const invalidInputs = [];
    let isValid = true;
    const setInvalid = (msg) => {
      invalidInputs.push(msg);
      isValid = false;
    };

    if (!validateSelect(voluntario)) setInvalid("Voluntario");
    if (!validateSelect(ave)) setInvalid("Ave");
    if (!validateText(lugar, 3, 200)) setInvalid("Lugar del avistamiento (entre 3 y 200 caracteres)");
    if (!validateFechaHora(fechaHora)) setInvalid("Fecha y hora (no puede ser futura ni anterior a 1 año atrás)");
    if (descripcion.length > 500) setInvalid("Descripción (máximo 500 caracteres)");
    if (!validateFiles(archivos)) setInvalid("Fotos/videos (entre 1 y 5 archivos de imagen o video, máximo 50 MB en total)");

    const validationBox = document.getElementById("val-box");
    const validationMessageElem = document.getElementById("val-msg");
    const validationListElem = document.getElementById("val-list");

    if (!isValid) {
      validationListElem.textContent = "";
      for (const err of invalidInputs) {
        const li = document.createElement("li");
        li.innerText = err;
        validationListElem.append(li);
      }
      validationMessageElem.innerText = "Por favor corrija los siguientes campos:";
      validationBox.hidden = false;
      validationBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      // Todo correcto en el cliente: se envían los datos a Flask
      form.submit();
    }
  };

  document.getElementById("submit-btn").addEventListener("click", validateForm);
})();
