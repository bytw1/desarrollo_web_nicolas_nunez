# desarrollo_web_nicolas_nunez

**Curso:** CC5002 - Desarrollo de Aplicaciones Web
**Estudiante:** Nicolás Núñez

Aplicación web para la gestión de voluntarios y el reporte de avistamientos de aves en Chile.

# Tarea 4 (Spring Boot + JPA + Thymeleaf + MySQL)

Buscador de avistamientos con búsqueda en vivo y evaluación de cada avistamiento con una nota de 1 a 7.

## Cómo ejecutar

Requisitos: **Java 17 o superior** y **MySQL** instalado y corriendo en `localhost:3306`.

1. **Crear la base de datos.** Ejecutar los archivos de la carpeta `sql/` en este orden, con un usuario administrador de MySQL (los dos del medio necesitan `USE tarea2;` al comienzo):
   * `tarea2.sql` (crea el esquema, las tablas y el usuario `cc5002` / `programacionweb`)
   * `region-comuna.sql`
   * `aves.sql`
   * `tabla-nota.sql` (crea la tabla nueva `nota`)

2. **Tener avistamientos cargados.** El buscador solo muestra los que existan en la base (se pueden crear con la aplicación de la Tarea 2).

3. **Ejecutar la aplicación** desde la raíz del proyecto:
```
   .\mvnw spring-boot:run
```
   (en Linux o Mac: `./mvnw spring-boot:run`) y abrir http://localhost:8080

   Los datos de conexión a la base están en `src/main/resources/application.properties`.

## Estructura
```
├── sql/
│   ├── tarea2.sql
│   ├── region-comuna.sql
│   ├── aves.sql
│   └── tabla-nota.sql
├── src/main/
│   ├── java/.../tarea4/
│   │   ├── model/         (Ave, Comuna, Voluntario, Avistamiento, Nota)
│   │   ├── repository/    (AvistamientoRepository, NotaRepository)
│   │   ├── service/       (AvistamientoService)
│   │   └── web/           (PaginaController, AvistamientoApiController)
│   └── resources/
│       ├── templates/buscador.html
│       ├── static/css/styles.css
│       ├── static/js/buscador.js
│       └── application.properties
├── pom.xml
└── README.md
```

## Decisiones de diseño

### Buscador
* Una sola vista (`buscador.html`) con un único input de texto. La búsqueda se dispara al escribir.
* Busca con `LIKE %texto%` en el nombre del ave, del voluntario o de la comuna. Como `avistamiento` no tiene comuna, se usa **la comuna del voluntario**.
* Ignora mayúsculas y tildes (collation `utf8_general_ci` del esquema). Los comodines `%` y `_` que escriba el usuario se escapan, y se muestran como máximo 50 resultados.
* Cada resultado muestra voluntario, día (`dd-MM-yyyy`), ave, comuna y nota. Si no hay coincidencias se muestra un mensaje.
* El texto que calza se resalta con `<mark>`, también ignorando mayúsculas y tildes. Se construye con el DOM (`textContent`), sin `innerHTML`.

### Notas
* Las notas se guardan en la tabla `nota` (una fila por nota, asociada al avistamiento). Un avistamiento puede recibir varias.
* La columna "Nota" muestra el promedio con un decimal, o `-` si el avistamiento no tiene notas.
* Al hacer clic en "Evaluar" aparece un selector de 1 a 7 en la misma fila. Al elegir un valor se envía con `fetch` (POST), el servidor guarda la nota y devuelve el nuevo promedio, y el JavaScript actualiza solo esa celda, sin recargar la página.

### Validaciones (cliente y servidor)
* El cliente valida que la nota sea un entero entre 1 y 7, y **el servidor siempre vuelve a validar**.
* El servidor recibe la nota como texto, para poder rechazar valores como `5.5`, `abc` o vacío. Responde `400` si no es un entero entre 1 y 7, y `404` si el avistamiento no existe.

### Acceso a la base de datos
* Spring Data JPA con solo las entidades necesarias, y solo las columnas que usa el buscador. `ddl-auto=none`, porque las tablas ya existen.
* La búsqueda es una sola consulta JPQL con `JOIN FETCH` (ave, voluntario y comuna), y los promedios se calculan con otra consulta agrupada, para no hacer una consulta por fila.
* El texto del usuario se pasa siempre como parámetro de la consulta, nunca se concatena en el SQL.

### Seguridad
* El texto de la búsqueda y los nombres mostrados se escriben con `textContent`, por lo que el HTML nunca se interpreta.
* Los `id` de las rutas son enteros, y la nota se valida en el servidor.

### Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Página del buscador |
| GET | `/api/avistamientos?q=texto` | Resultados de la búsqueda (JSON) |
| POST | `/api/avistamientos/{id}/notas` | Agrega una nota (`nota=1..7`) y devuelve `{promedio, cantidad}` |