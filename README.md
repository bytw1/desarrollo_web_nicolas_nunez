# desarrollo_web_nicolas_nunez


# Tarea 1
**Curso:** CC5002 - Desarrollo de Aplicaciones Web  
**Estudiante:** Nicolás Núñez

## Descripción del Proyecto
Prototipo frontend navegable para la gestión de voluntarios y reporte de avistamientos de aves en Chile. La interfaz está construida con HTML, CSS3 y JavaScript.

## Estructura de Páginas
* `registro.html`: Formulario para la inscripción de nuevos voluntarios con selección en cascada de Región y Comuna.
* `informar.html`: Formulario para el reporte de avistamientos con soporte de archivos multimedia (fotos/videos).
* `listado.html`: Vista de consulta con filtros por tipo de ave, ordenamiento dinámico y paginación client-side.
* `indicadores.html`: Métricas visuales del sistema integradas mediante la librería Chart.js.

## Decisiones de Diseño e Implementación

### 0. Estilo
* Utilizado el styles.css visto en auxiliares.

### 1. HTML Semántico y Accesibilidad
* Se utilizaron etiquetas semánticas (`<header>`, `<nav>`, `<main>`, `<section>`, `<fieldset>`, `<legend>`) evitando el uso excesivo de `<div>`.
* Las páginas cuentan con su estructura de encabezados correcta (`<h1>`, `<h2>`) y codificación de caracteres `UTF-8`.
* Se pasaron todas las páginas de html por los validadores oficiales de W3C (HTML5 y CSS3), asegurando un código estándar.

### 2. Validaciones con JavaScript
* En lugar de delegar las reglas al navegador mediante el atributo `required`, se utilizó la propiedad `novalidate` en los formularios y se programaron las siguientes reglas en scripts JS dedicados:
  * **Contacto:** Validación de formato para correo electrónico y número de celular mediante Expresiones Regulares (RegEx) y vistas en auxiliares.
  * **Fechas:** Control de límite temporal en el avistamiento (bloqueo de fechas futuras y fechas demasiado antiguas en el pasado, un año en este caso).
  * **Archivos:** Verificación del tipo de archivo (solo imágenes y videos) y límite de adjuntos (5 archivos máximo)  
* Es necesario mencionar que utilicé un archivo js correspondiente a cada archivo html (o más) ya que considerando mi experiencia no sabía como juntarlos de manera adecuada.

### 3. Manejo de Datos
* Dado que el proyecto no cuenta con datos de backend, tras la validación exitosa de los formularios se muestra una confirmación visual en pantalla (`#val-box`) permitiendo ingresar nuevos registros mediante un reset del formulario.
* En las vistas de `listado.html` e `indicadores.html` se utilizaron colecciones de datos simulados (*mock data*) para validar la experiencia de filtrado, paginación y visualización de gráficos.

## Instrucciones de Ejecución
1. Clonar el repositorio y cambiar a la rama `Tarea 1`.
2. Abrir cualquier archivo `.html` (por ejemplo, `registro.html`) directamente en un navegador web actualizado (Chrome, Firefox, Edge).
