// Hace que cada fila del listado sea clickeable y lleve al detalle del avistamiento.
// (La paginación y el orden los resuelve el servidor.)
(() => {
    document.querySelectorAll("tr.fila-click").forEach(fila => {
        fila.addEventListener("click", (evento) => {
            // Si el clic fue sobre el enlace, el navegador ya navega solo
            if (evento.target.closest("a")) return;
            window.location.href = fila.dataset.href;
        });
    });

    // Cambiar el orden aplica de inmediato (el botón sigue disponible sin JavaScript)
    const selectOrden = document.getElementById("ordenar-por");
    if (selectOrden) {
        selectOrden.addEventListener("change", () => selectOrden.form.submit());
    }
})();
