// Cascada Región -> Comuna usando los datos que entrega Flask (desde la base de datos)
(() => {
    const regionSelect = document.getElementById("region");
    const comunaSelect = document.getElementById("comuna");
    const comunasPorRegion = JSON.parse(document.getElementById("datos-comunas").textContent);

    const poblarComunas = (regionId, seleccionada) => {
        // Resetea la comuna y agrega la opción por defecto
        comunaSelect.innerHTML = '<option value="">Seleccione una comuna...</option>';

        (comunasPorRegion[regionId] || []).forEach(comuna => {
            const option = document.createElement("option");
            option.value = comuna.id;
            option.text = comuna.nombre;
            if (String(comuna.id) === String(seleccionada)) option.selected = true;
            comunaSelect.appendChild(option);
        });
    };

    regionSelect.addEventListener("change", () => poblarComunas(regionSelect.value, ""));

    // Si el servidor devolvió el formulario con errores, se conservan región y comuna elegidas
    poblarComunas(regionSelect.value, comunaSelect.dataset.seleccionada || "");
})();
