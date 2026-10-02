// Validación del formulario de registro de voluntarios del lado cliente.
// Si todo es válido, el formulario se envía a Flask, que vuelve a validar.
(() => {
  const validateName = (name) => {
    if (!name) return false;
    // Exigimos al menos 4 caracteres
    const largo = name.trim().length;
    return largo >= 4 && largo <= 255;
  };

  const validateEmail = (email) => {
    if (!email) return false;
    if (email.length > 80) return false;
    // validamos el formato con RegEx (misma regla que el servidor)
    const re = /^[\w.+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phoneNumber) => {
    // Como es opcional, si está vacío es válido
    if (!phoneNumber) return true;
    // Si el usuario escribe algo: solo dígitos, entre 8 y 15
    return /^[0-9]{8,15}$/.test(phoneNumber);
  };

  const validateSelect = (select) => {
    if (!select) return false;
    return true;
  };

  const validateForm = () => {
    // obtener elementos del DOM usando el nombre del formulario
    const myForm = document.forms["myForm"];
    const name = myForm["nombre"].value;
    const email = myForm["email"].value;
    const phoneNumber = myForm["celular"].value;
    const region = myForm["region"].value;
    const comuna = myForm["comuna"].value;

    // variables auxiliares de validación y función
    const invalidInputs = [];
    let isValid = true;
    const setInvalidInput = (inputName) => {
      invalidInputs.push(inputName);
      isValid = false;
    };

    // lógica de validación
    if (!validateName(name)) setInvalidInput("Nombre (entre 4 y 255 caracteres)");
    if (!validateEmail(email)) setInvalidInput("Email (formato inválido)");
    if (!validatePhoneNumber(phoneNumber)) setInvalidInput("Celular (solo números, entre 8 y 15 dígitos)");
    if (!validateSelect(region)) setInvalidInput("Región");
    if (!validateSelect(comuna)) setInvalidInput("Comuna");

    const validationBox = document.getElementById("val-box");
    const validationMessageElem = document.getElementById("val-msg");
    const validationListElem = document.getElementById("val-list");

    if (!isValid) {
      validationListElem.textContent = "";
      for (const input of invalidInputs) {
        const listElement = document.createElement("li");
        listElement.innerText = input;
        validationListElem.append(listElement);
      }
      validationMessageElem.innerText = "Los siguientes campos son inválidos:";
      validationBox.hidden = false;
      validationBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      // Todo correcto en el cliente: se envían los datos a Flask
      myForm.submit();
    }
  };

  document.getElementById("submit-btn").addEventListener("click", validateForm);
})();
