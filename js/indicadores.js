window.onload = () => {
    // Gráfico de Avistamientos por Tipo (torta)
    const ctxTipos = document.getElementById('chart-tipos').getContext('2d');
    new Chart(ctxTipos, {
        type: 'doughnut',
        data: {
            labels: ['Aves Rapaces', 'Aves Acuáticas', 'Aves de Canto', 'Aves Marinas'],
            datasets: [{
                label: 'Cantidad de Avistamientos',
                data: [120, 190, 85, 63],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
            }]
        },
        options: {
            responsive: true
        }
    });

    // Gráfico de Voluntarios por Región (barras)
    const ctxRegiones = document.getElementById('chart-regiones').getContext('2d');
    new Chart(ctxRegiones, {
        type: 'bar',
        data: {
            labels: ['Valparaíso', 'Metropolitana', 'Biobío', 'O\'Higgins', 'Coquimbo'],
            datasets: [{
                label: 'Voluntarios por Región',
                data: [35, 52, 20, 10, 7],
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};