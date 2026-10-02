

const ELEMENTOS_POR_PAGINA = 3;
let paginaActual = 1;
let datosFiltrados = [...avistamientos];

const aplicarFiltrosYOrden = () => {
    const filtroTipo = document.getElementById("filtro-tipo").value;
    const criterioOrden = document.getElementById("ordenar-por").value;

    // 1. Filtrar
    if (filtroTipo === "todos") {
        datosFiltrados = [...avistamientos];
    } else {
        datosFiltrados = avistamientos.filter(a => a.tipo === filtroTipo);
    }

    // 2. Ordenar
    datosFiltrados.sort((a, b) => {
        if (criterioOrden === "fecha-desc") return new Date(b.fecha) - new Date(a.fecha);
        if (criterioOrden === "fecha-asc") return new Date(a.fecha) - new Date(b.fecha);
        if (criterioOrden === "lugar-asc") return a.lugar.localeCompare(b.lugar);
        if (criterioOrden === "nombre-asc") return a.nombre.localeCompare(b.nombre);
        return 0;
    });

    paginaActual = 1; // Volver a la primera página tras filtrar
    renderizar();
};

const renderizar = () => {
    const tbody = document.getElementById("tabla-avistamientos");
    tbody.innerHTML = "";

    const totalPaginas = Math.ceil(datosFiltrados.length / ELEMENTOS_POR_PAGINA) || 1;
    const inicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
    const fin = inicio + ELEMENTOS_POR_PAGINA;
    const paginaDatos = datosFiltrados.slice(inicio, fin);

    if (paginaDatos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="texto-centrado">No se encontraron registros.</td></tr>`;
    } else {
        paginaDatos.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${item.tipo}</td>
                <td><strong>${item.nombre}</strong></td>
                <td>${item.lugar}</td>
                <td>${item.fecha}</td>
                <td class="col-foto">${item.foto}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Actualizar controles de paginación
    document.getElementById("info-pagina").innerText = `Página ${paginaActual} de ${totalPaginas}`;
    document.getElementById("btn-prev").disabled = paginaActual === 1;
    document.getElementById("btn-next").disabled = paginaActual >= totalPaginas;
};

// Event Listeners
document.getElementById("filtro-tipo").addEventListener("change", aplicarFiltrosYOrden);
document.getElementById("ordenar-por").addEventListener("change", aplicarFiltrosYOrden);

document.getElementById("btn-prev").addEventListener("click", () => {
    if (paginaActual > 1) {
        paginaActual--;
        renderizar();
    }
});

document.getElementById("btn-next").addEventListener("click", () => {
    const totalPaginas = Math.ceil(datosFiltrados.length / ELEMENTOS_POR_PAGINA);
    if (paginaActual < totalPaginas) {
        paginaActual++;
        renderizar();
    }
});

// Carga inicial
aplicarFiltrosYOrden();