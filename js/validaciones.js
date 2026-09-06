const validateName = (name) => {
  if(!name) return false;
  // Exigimos al menos 4 caracteres
  let lengthValid = name.trim().length >= 4;
  return lengthValid;
}

const validateEmail = (email) => {
  if (!email) return false;
  // validamos el formato con RegEx
  let re = /^[\w.]+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
  let formatValid = re.test(email);
  return formatValid;
};

const validatePhoneNumber = (phoneNumber) => {
  // Como es opcional, si está vacío es válido
  if (!phoneNumber) return true; 
  
  // Si el usuario escribe algo, aplicamos reglas
  let lengthValid = phoneNumber.length >= 8;
  let re = /^[0-9]+$/;
  let formatValid = re.test(phoneNumber);
  return lengthValid && formatValid;
};

const validateSelect = (select) => {
  if(!select) return false;
  return true;
}

const validateForm = () => {
  // obtener elementos del DOM usando el nombre del formulario
  let myForm = document.forms["myForm"];
  let name = myForm["nombre"].value;
  let email = myForm["email"].value;
  let phoneNumber = myForm["celular"].value;
  let region = myForm["region"].value;
  let comuna = myForm["comuna"].value;

  // variables auxiliares de validación y función
  let invalidInputs = [];
  let isValid = true;
  const setInvalidInput = (inputName) => {
    invalidInputs.push(inputName);
    isValid &&= false;
  };

  // lógica de validación
  if (!validateName(name)) setInvalidInput("Nombre");
  if (!validateEmail(email)) setInvalidInput("Email");
  if (!validatePhoneNumber(phoneNumber)) setInvalidInput("Celular");
  if (!validateSelect(region)) setInvalidInput("Región");
  if (!validateSelect(comuna)) setInvalidInput("Comuna");

  // finalmente mostrar la validación
  let validationBox = document.getElementById("val-box");
  let validationMessageElem = document.getElementById("val-msg");
  let validationListElem = document.getElementById("val-list");

  if (!isValid) {
    validationListElem.textContent = "";
    // agregar elementos inválidos al elemento val-list
    for (let input of invalidInputs) {
      let listElement = document.createElement("li");
      listElement.innerText = input;
      validationListElem.append(listElement);
    }
    // establecer val-msg y aplicar estilos de error
    validationMessageElem.innerText = "Los siguientes campos son inválidos:";
    validationBox.style.backgroundColor = "#ffdddd";
    validationBox.style.borderLeftColor = "#f44336";
    validationBox.hidden = false;
  } else {
    // Ocultar el formulario
    myForm.style.display = "none";
    validationListElem.textContent = "";

    // establecer mensaje y aplicar tus estilos de éxito
    validationMessageElem.innerText = "¡Voluntario registrado con éxito!";
    validationBox.style.backgroundColor = "#ddffdd";
    validationBox.style.borderLeftColor = "#4CAF50";

    // Reutilizar tu botón de volver
    let backButton = document.createElement("button");
    backButton.innerText = "Volver y Registrar Otro";
    backButton.addEventListener("click", () => {
      myForm.reset(); // Limpia los campos
      myForm.style.display = "block";
      validationBox.hidden = true;
    });

    validationListElem.appendChild(backButton);
    validationBox.hidden = false;
  }
};

let submitBtn = document.getElementById("submit-btn");
submitBtn.addEventListener("click", validateForm);