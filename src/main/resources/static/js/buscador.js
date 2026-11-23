// Buscador de avistamientos: búsqueda en vivo, resaltado y evaluación con fetch.
(() => {
    const NOTA_MIN = 1;
    const NOTA_MAX = 7;
    const ESPERA_MS = 300;

    const form = document.getElementById("form-buscador");
    const input = document.getElementById("busqueda");
    const estado = document.getElementById("estado");
    const aviso = document.getElementById("aviso");
    const resultados = document.getElementById("resultados");

    const formatoNota = new Intl.NumberFormat("es-CL", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

    let temporizador = null;
    let controlador = null;

    // Texto sin tildes ni mayúsculas, con mapa hacia el texto original 

    function normalizar(texto) {
        let norm = "";
        const mapa = [];
        for (let i = 0; i < texto.length; i++) {
            const limpio = texto[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            for (const caracter of limpio) {
                norm += caracter;
                mapa.push(i);
            }
        }
        return { norm, mapa };
    }

    // Escribe el texto en el elemento resaltando con <mark> lo que calza (sin usar innerHTML).
    function escribirResaltado(elemento, texto, consultaNorm) {
        const { norm, mapa } = normalizar(texto);
        let ultimo = 0;
        let desde = 0;
        let pos = consultaNorm ? norm.indexOf(consultaNorm, desde) : -1;

        while (pos !== -1) {
            const inicio = mapa[pos];
            const fin = mapa[pos + consultaNorm.length - 1] + 1;
            if (inicio >= ultimo) {
                elemento.append(document.createTextNode(texto.slice(ultimo, inicio)));
                const marca = document.createElement("mark");
                marca.textContent = texto.slice(inicio, fin);
                elemento.append(marca);
                ultimo = fin;
            }
            desde = pos + consultaNorm.length;
            pos = norm.indexOf(consultaNorm, desde);
        }
        elemento.append(document.createTextNode(texto.slice(ultimo)));
    }

    // mensajes

    function mostrarEstado(texto) {
        estado.textContent = texto;
    }

    function mostrarAviso(texto) {
        aviso.textContent = texto;
    }

    // tabla de resultados

    function textoNota(promedio) {
        return promedio === null || promedio === undefined ? "-" : formatoNota.format(promedio);
    }

    function celda(texto, consultaNorm) {
        const td = document.createElement("td");
        escribirResaltado(td, texto, consultaNorm);
        return td;
    }

    function botonEvaluar(avistamiento, celdaNota, celdaAccion) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "btn";
        boton.textContent = "Evaluar";
        boton.addEventListener("click", () => {
            mostrarSelector(avistamiento, celdaNota, celdaAccion);
        });
        return boton;
    }

    // Al hacer clic en "Evaluar" se pide una nota entre 1 y 7.
    function mostrarSelector(avistamiento, celdaNota, celdaAccion) {
        mostrarAviso("");
        const select = document.createElement("select");
        select.className = "selector-nota";
        select.setAttribute("aria-label", "Nota para el avistamiento de " + avistamiento.ave);

        const inicial = document.createElement("option");
        inicial.value = "";
        inicial.textContent = "Nota...";
        inicial.selected = true;
        inicial.disabled = true;
        select.append(inicial);

        for (let n = NOTA_MIN; n <= NOTA_MAX; n++) {
            const opcion = document.createElement("option");
            opcion.value = String(n);
            opcion.textContent = String(n);
            select.append(opcion);
        }

        const cancelar = document.createElement("button");
        cancelar.type = "button";
        cancelar.className = "btn btn-secundario";
        cancelar.textContent = "Cancelar";
        cancelar.addEventListener("click", () => {
            celdaAccion.replaceChildren(botonEvaluar(avistamiento, celdaNota, celdaAccion));
        });

        select.addEventListener("change", () => {
            enviarNota(avistamiento, Number(select.value), celdaNota, celdaAccion);
        });

        celdaAccion.replaceChildren(select, cancelar);
        select.focus();
    }

    async function enviarNota(avistamiento, valor, celdaNota, celdaAccion) {
        // Validación en el cliente (el servidor vuelve a validar)
        if (!Number.isInteger(valor) || valor < NOTA_MIN || valor > NOTA_MAX) {
            mostrarAviso("La nota debe ser un número entero entre 1 y 7.");
            return;
        }

        celdaAccion.querySelectorAll("select, button").forEach(el => { el.disabled = true; });

        try {
            const respuesta = await fetch("/api/avistamientos/" + avistamiento.id + "/notas", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ nota: String(valor) })
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                mostrarAviso(datos.error || "No se pudo guardar la nota. Intente nuevamente.");
                celdaAccion.replaceChildren(botonEvaluar(avistamiento, celdaNota, celdaAccion));
                return;
            }

            // Actualiza el promedio que ve el usuario sin recargar la página
            celdaNota.textContent = textoNota(datos.promedio);
            avistamiento.promedio = datos.promedio;
            mostrarAviso("");
            mostrarEstado("Nota " + valor + " guardada para el avistamiento de " + avistamiento.ave + ".");
        } catch (error) {
            mostrarAviso("No se pudo conectar con el servidor. Intente nuevamente.");
        }
        celdaAccion.replaceChildren(botonEvaluar(avistamiento, celdaNota, celdaAccion));
    }

    function pintar(lista, consulta) {
        resultados.replaceChildren();

        if (lista.length === 0) {
            mostrarEstado("No se encontraron avistamientos que coincidan con \u00AB" + consulta + "\u00BB.");
            return;
        }
        mostrarEstado(lista.length === 1 ? "1 avistamiento encontrado." : lista.length + " avistamientos encontrados.");

        const consultaNorm = normalizar(consulta).norm;

        const tabla = document.createElement("table");
        const thead = document.createElement("thead");
        const filaHead = document.createElement("tr");
        ["Voluntario", "Día", "Ave", "Comuna", "Nota", "Acción"].forEach(titulo => {
            const th = document.createElement("th");
            th.scope = "col";
            th.textContent = titulo;
            filaHead.append(th);
        });
        thead.append(filaHead);

        const tbody = document.createElement("tbody");
        lista.forEach(avistamiento => {
            const fila = document.createElement("tr");

            fila.append(celda(avistamiento.voluntario, consultaNorm));

            const tdDia = document.createElement("td");
            tdDia.textContent = avistamiento.dia;
            fila.append(tdDia);

            fila.append(celda(avistamiento.ave, consultaNorm));
            fila.append(celda(avistamiento.comuna, consultaNorm));

            const tdNota = document.createElement("td");
            tdNota.className = "texto-centrado";
            tdNota.textContent = textoNota(avistamiento.promedio);
            fila.append(tdNota);

            const tdAccion = document.createElement("td");
            tdAccion.append(botonEvaluar(avistamiento, tdNota, tdAccion));
            fila.append(tdAccion);

            tbody.append(fila);
        });

        tabla.append(thead, tbody);
        const contenedor = document.createElement("div");
        contenedor.className = "tabla-scroll";
        contenedor.append(tabla);
        resultados.append(contenedor);
    }

    // busqueda en vivo

    async function buscar() {
        const consulta = input.value.trim();
        mostrarAviso("");

        if (controlador) {
            controlador.abort();
        }

        if (consulta === "") {
            resultados.replaceChildren();
            mostrarEstado("Escriba para buscar avistamientos.");
            return;
        }

        controlador = new AbortController();
        try {
            const respuesta = await fetch("/api/avistamientos?q=" + encodeURIComponent(consulta), {
                signal: controlador.signal
            });
            if (!respuesta.ok) {
                throw new Error("Error " + respuesta.status);
            }
            pintar(await respuesta.json(), consulta);
        } catch (error) {
            if (error.name === "AbortError") {
                return; // llegó una búsqueda más nueva
            }
            resultados.replaceChildren();
            mostrarEstado("");
            mostrarAviso("No se pudo realizar la búsqueda. Intente nuevamente.");
        }
    }

    input.addEventListener("input", () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(buscar, ESPERA_MS);
    });

    // Enter no debe recargar la página
    form.addEventListener("submit", evento => {
        evento.preventDefault();
        clearTimeout(temporizador);
        buscar();
    });

    mostrarEstado("Escriba para buscar avistamientos.");
})();
