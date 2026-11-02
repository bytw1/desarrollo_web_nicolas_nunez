// Gráficos de la página de estadísticas.
// Cada gráfico pide sus datos a una URL de Flask con fetch (que los saca de la base de datos)
// y los dibuja en el cliente con Chart.js.
(() => {
    const URL_DIAS = "/api/estadisticas/avistamientos-por-dia";
    const URL_AVES = "/api/estadisticas/avistamientos-por-ave";
    const URL_COMUNAS = "/api/estadisticas/voluntarios-por-comuna";

    // Pide los datos y devuelve el JSON; si el servidor responde con error, lanza una excepción.
    const pedirDatos = async (url) => {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("Error " + respuesta.status);
        return respuesta.json();
    };

    // Muestra un mensaje en lugar del gráfico (sin datos, o error del servidor)
    const mostrarMensaje = (idCanvas, idMensaje, texto) => {
        document.getElementById(idCanvas).parentElement.hidden = true;
        const mensaje = document.getElementById(idMensaje);
        mensaje.textContent = texto;
        mensaje.hidden = false;
    };

    // Dibuja un gráfico: carga los datos, valida que haya, y llama a `crear` con el contexto del canvas
    const cargarGrafico = async (idCanvas, idMensaje, url, crear) => {
        try {
            const datos = await pedirDatos(url);
            if (datos.labels.length === 0) {
                mostrarMensaje(idCanvas, idMensaje, "Aún no hay datos para mostrar este gráfico.");
                return;
            }
            crear(document.getElementById(idCanvas).getContext("2d"), datos);
        } catch (error) {
            mostrarMensaje(idCanvas, idMensaje, "No se pudieron cargar los datos del gráfico.");
        }
    };

    // Paleta para la torta: reparte los colores por el círculo según la cantidad de porciones
    const colores = (cantidad) =>
        Array.from({ length: cantidad }, (_, i) => `hsl(${Math.round((i * 360) / cantidad)}, 65%, 55%)`);

    const opcionesEjes = (tituloX, tituloY) => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: tituloX } },
            y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: tituloY } }
        }
    });

    // avistamientos por día
    cargarGrafico("chart-dias", "msg-dias", URL_DIAS, (ctx, datos) => {
        new Chart(ctx, {
            type: "line",
            data: {
                labels: datos.labels,
                datasets: [{
                    label: "Avistamientos por día",
                    data: datos.values,
                    borderColor: "#28a745",
                    backgroundColor: "#28a745",
                    tension: 0.2
                }]
            },
            options: opcionesEjes("Día", "Cantidad de avistamientos")
        });
    });

    // Grpáfico de torta: avistamientos por ave
    cargarGrafico("chart-aves", "msg-aves", URL_AVES, (ctx, datos) => {
        new Chart(ctx, {
            type: "pie",
            data: {
                labels: datos.labels,
                datasets: [{
                    label: "Avistamientos",
                    data: datos.values,
                    backgroundColor: colores(datos.values.length)
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right" } } }
        });
    });

    // Barras: voluntarios por comuna
    cargarGrafico("chart-comunas", "msg-comunas", URL_COMUNAS, (ctx, datos) => {
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: datos.labels,
                datasets: [{
                    label: "Voluntarios registrados",
                    data: datos.values,
                    backgroundColor: "#28a745"
                }]
            },
            options: opcionesEjes("Comuna", "Voluntarios registrados")
        });
    });
})();
