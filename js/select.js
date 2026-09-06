// diccionario de regiones
const data = {
    "Región de Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"],
    "Región Metropolitana": ["Santiago", "Puente Alto", "Maipú", "Providencia"],
    "Región del Biobío": ["Concepción", "Talcahuano", "San Pedro de la Paz", "Los Ángeles"]
    // Puedes agregar más regiones y comunas aquí
};

const poblarRegiones = () => {
    let regionSelect = document.getElementById("region");
    for (const region in data) {
      let option = document.createElement("option");
      option.value = region;
      option.text = region;
      regionSelect.appendChild(option);
    }
};

const updateComunas = () => {
    let regionSelect = document.getElementById("region");
    let comunaSelect = document.getElementById("comuna");
    
    let selectedRegion = regionSelect.value;
    
    // Resetea la comuna y agrega la opción por defecto
    comunaSelect.innerHTML = '<option value="">Seleccione una comuna...</option>';
    
    if (data[selectedRegion]) {
      data[selectedRegion].forEach(comuna => {
        let option = document.createElement("option");
        option.value = comuna;
        option.text = comuna;
        comunaSelect.appendChild(option);
      });
    }
};

document.getElementById("region").addEventListener("change", updateComunas);

window.onload = () => {
    poblarRegiones();
};