// Comentarios de un avistamiento: listado y formulario, usando llamadas asíncronas (fetch).
// - GET  <url>  devuelve los comentarios del avistamiento (desde la base de datos).
// - POST <url>  valida en el servidor e inserta el comentario en la tabla comentario.
(() => {
  const seccion = document.getElementById("comentarios");
  const url = seccion.dataset.url;
  const form = document.forms["comentarioForm"];
  const lista = document.getElementById("lista-comentarios");
  const sinComentarios = document.getElementById("sin-comentarios");
  const validationBox = document.getElementById("val-box");
  const validationMessageElem = document.getElementById("val-msg");
  const validationListElem = document.getElementById("val-list");

  // Validación del lado del cliente con las mismas reglas que el servidor 
  const validateName = (name) => {
    const largo = name.trim().length;
    return largo >= 3 && largo <= 50;
  };

  const validateText = (text) => {
    const largo = text.trim().length;
    return largo >= 5 && largo <= 300;
  };

  // Caja de mensajes 
  const mostrarErrores = (errores) => {
    validationListElem.textContent = "";
    for (const error of errores) {
      const li = document.createElement("li");
      li.textContent = error;
      validationListElem.append(li);
    }
    validationMessageElem.textContent = "Por favor corrija los siguientes campos:";
    validationBox.style.backgroundColor = "#ffdddd";
    validationBox.style.borderLeftColor = "#f44336";
    validationBox.hidden = false;
  };

  const mostrarExito = (mensaje) => {
    validationListElem.textContent = "";
    validationMessageElem.textContent = mensaje;
    validationBox.style.backgroundColor = "#ddffdd";
    validationBox.style.borderLeftColor = "#4CAF50";
    validationBox.hidden = false;
  };

  // Todo el texto del usuario se inserta con textContent (nunca innerHTML), para evitar XSS.
  const crearItem = (comentario) => {
    const li = document.createElement("li");
    li.className = "comentario";

    const cabecera = document.createElement("p");
    cabecera.className = "comentario-cabecera";
    const nombre = document.createElement("strong");
    nombre.textContent = comentario.nombre;
    const fecha = document.createElement("span");
    fecha.textContent = " · " + comentario.fecha;
    cabecera.append(nombre, fecha);

    const texto = document.createElement("p");
    texto.className = "texto-multilinea";
    texto.textContent = comentario.texto;

    li.append(cabecera, texto);
    return li;
  };

  const mostrarComentarios = (comentarios) => {
    lista.textContent = "";
    for (const comentario of comentarios) lista.append(crearItem(comentario));
    sinComentarios.hidden = comentarios.length > 0;
  };

  const cargarComentarios = async () => {
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) throw new Error("Error " + respuesta.status);
      const datos = await respuesta.json();
      mostrarComentarios(datos.comentarios);
    } catch (error) {
      sinComentarios.textContent = "No se pudieron cargar los comentarios.";
      sinComentarios.hidden = false;
    }
  };

  // Envío de formulario
  const agregarComentario = async () => {
    const nombre = form.elements["nombre"].value;
    const texto = form.elements["texto"].value;

    const errores = [];
    if (!validateName(nombre)) errores.push("Nombre: debe tener entre 3 y 50 caracteres.");
    if (!validateText(texto)) errores.push("Comentario: debe tener entre 5 y 300 caracteres.");

    if (errores.length > 0) {
      mostrarErrores(errores);
      return;
    }

    // Todo correcto en el cliente: se envía a Flask, que vuelve a validar
    const boton = document.getElementById("submit-btn");
    boton.disabled = true;
    try {
      const respuesta = await fetch(url, { method: "POST", body: new FormData(form) });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        form.reset();
        mostrarExito("¡Comentario agregado con éxito!");
        await cargarComentarios();
      } else {
        // el formulario queda visible, con lo que el usuario escribió, para que pueda corregirlo
        mostrarErrores(datos.errores || ["No se pudo guardar el comentario."]);
      }
    } catch (error) {
      mostrarErrores(["No se pudo conectar con el servidor. Intente nuevamente."]);
    } finally {
      boton.disabled = false;
    }
  };

  document.getElementById("submit-btn").addEventListener("click", agregarComentario);
  // Apretar Enter dentro del campo de nombre no debe recargar la página
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    agregarComentario();
  });

  cargarComentarios();
})();
