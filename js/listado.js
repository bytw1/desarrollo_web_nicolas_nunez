// Mock Data
const avistamientos = [
    { tipo: "Raptor", nombre: "Cernícalo", lugar: "Santiago (San Cristóbal)", fecha: "2026-03-01 10:30", foto: "🦅" },
    { tipo: "Acuatica", nombre: "Pato Yeco", lugar: "Valparaíso (Muelle Prat)", fecha: "2026-03-02 14:15", foto: "🦆" },
    { tipo: "Canto", nombre: "Chincol", lugar: "Concepción (Plaza Acevedo)", fecha: "2026-03-03 08:00", foto: "🐦" },
    { tipo: "Marina", nombre: "Gaviota de Franklin", lugar: "Antofagasta (La Portada)", fecha: "2026-02-28 17:45", foto: "🕊️" },
    { tipo: "Raptor", nombre: "Águila Mora", lugar: "Cajón del Maipo", fecha: "2026-02-25 11:00", foto: "🦅" },
    { tipo: "Canto", nombre: "Loica", lugar: "Talca", fecha: "2026-03-04 12:20", foto: "🐦" },
    { tipo: "Acuatica", nombre: "Piscuiz", lugar: "Valdivia", fecha: "2026-03-05 09:10", foto: "🦆" }
];

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
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No se encontraron registros.</td></tr>`;
    } else {
        paginaDatos.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${item.tipo}</td>
                <td><strong>${item.nombre}</strong></td>
                <td>${item.lugar}</td>
                <td>${item.fecha}</td>
                <td style="text-align: center; font-size: 20px;">${item.foto}</td>
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