// Validación para textos simples (nombre del ave y lugar)
const validateText = (text, minLength = 3) => {
  if (!text) return false;
  return text.trim().length >= minLength;
};

// Validación del desplegable Tipo de Ave
const validateSelect = (val) => {
  return val !== "" && val !== null;
};

// Validación de fecha: no puede ser en el futuro ni más antigua que 5 años en el pasado
const validateFechaHora = (dateTimeStr) => {
  if (!dateTimeStr) return false;

  const fechaIngresada = new Date(dateTimeStr);
  const ahora = new Date();

  // 1. No puede ser en el futuro
  if (fechaIngresada > ahora) return false;

  // 2. No puede ser tan antigua (máximo 1 años atrá)
  const haceUnAnos = new Date();
  haceUnAnos.setFullYear(ahora.getFullYear() - 1);
  if (fechaIngresada < haceUnAnos) return false;

  return true;
};

// Adaptación de tu función original: exige al menos 1 archivo y que sean fotos o videos
const validateFiles = (files) => {
  if (!files || files.length === 0) return false;

  // Máximo 5 archivos por entrega
  if (files.length > 5) return false;

  let typeValid = true;
  for (const file of files) {
    const fileFamily = file.type.split("/")[0];
    // Debe ser de tipo 'image' o 'video'
    typeValid &&= (fileFamily === "image" || fileFamily === "video");
  }

  return typeValid;
};

const validateForm = () => {
  let form = document.forms["informarForm"];
  let tipoAve = form["tipo-ave"].value;
  let nombreAve = form["nombre-ave"].value;
  let lugar = form["lugar"].value;
  let fechaHora = form["fecha-hora"].value;
  let archivos = form["archivos"].files;

  let invalidInputs = [];
  let isValid = true;

  const setInvalid = (msg) => {
    invalidInputs.push(msg);
    isValid = false;
  };

  // Ejecución de validaciones
  if (!validateSelect(tipoAve)) setInvalid("Tipo de ave");
  if (!validateText(nombreAve, 3)) setInvalid("Nombre del ave (mínimo 3 caracteres)");
  if (!validateText(lugar, 3)) setInvalid("Lugar del avistamiento");
  if (!validateFechaHora(fechaHora)) setInvalid("Fecha y Hora (no puede ser futura ni mayor a 5 años atrás)");
  if (!validateFiles(archivos)) setInvalid("Adjuntar foto/video (al menos 1 archivo válido de imagen o video)");

  // Mostrar resultados en la interfaz
  let validationBox = document.getElementById("val-box");
  let validationMessageElem = document.getElementById("val-msg");
  let validationListElem = document.getElementById("val-list");

  if (!isValid) {
    validationListElem.textContent = "";
    for (let err of invalidInputs) {
      let li = document.createElement("li");
      li.innerText = err;
      validationListElem.append(li);
    }
    validationMessageElem.innerText = "Por favor corrija los siguientes campos:";
    validationBox.style.backgroundColor = "#ffdddd";
    validationBox.style.borderLeftColor = "#f44336";
    validationBox.hidden = false;
  } else {
    form.style.display = "none";
    validationListElem.textContent = "";

    validationMessageElem.innerText = "¡Avistamiento registrado con éxito!";
    validationBox.style.backgroundColor = "#ddffdd";
    validationBox.style.borderLeftColor = "#4CAF50";

    let backButton = document.createElement("button");
    backButton.innerText = "Informar otro avistamiento";
    backButton.addEventListener("click", () => {
      form.reset();
      form.style.display = "block";
      validationBox.hidden = true;
    });

    validationListElem.appendChild(backButton);
    validationBox.hidden = false;
  }
};

document.getElementById("submit-btn").addEventListener("click", validateForm);