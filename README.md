# desarrollo_web_nicolas_nunez

**Curso:** CC5002 - Desarrollo de Aplicaciones Web
**Estudiante:** Nicolás Núñez

Aplicación web para la gestión de voluntarios y el reporte de avistamientos de aves en Chile.

---

# Tarea 3 (estadísticas y comentarios)

Se agregó, sobre la Tarea 2: la página de **estadísticas con 3 gráficos** y los **comentarios de cada avistamiento**. Ambas funcionalidades usan `fetch` (llamadas asíncronas) contra URLs de Flask que leen/escriben en la base de datos.

## Estadísticas (`/indicadores`)
Cada gráfico pide sus datos con `fetch` a una URL de Flask (`static/js/indicadores.js`), que los obtiene con una consulta SQL agrupada (`GROUP BY`) en `database/db.py`
Al final de la página hay un enlace para volver a la portada. Si un gráfico no tiene datos, se muestra un mensaje en vez de un gráfico vacío.

**Decisiones:**
* **"Tipo de ave" = el ave de la tabla `ave`.** En el modelo del curso la tabla `ave` solo tiene `nombre` (no existe una clasificación como rapaz o acuática; esa clasificación era de la Tarea 1 y se eliminó en la Tarea 2). Por eso la torta agrupa por ave (especie) y solo aparecen las aves que tienen avistamientos.
* **Gráfico por día:** el único dato de fecha de un avistamiento es `fecha_hora` (cuándo se vio el ave), por lo que se cuenta por esa fecha. El servidor completa con `0` los días intermedios sin avistamientos para que la línea represente bien el tiempo.

## Comentarios (en `/avistamiento/<id>`)
`static/js/comentarios.js` usa `fetch` contra una sola URL: `/api/avistamiento/<id>/comentarios`.
* **GET:** devuelve los comentarios del avistamiento desde la base de datos (JSON), del más reciente al más antiguo. Se muestran con fecha, nombre y texto.
* **POST:** valida en el servidor e inserta en la tabla `comentario` (con `fecha` = momento de la inserción). Si hay errores responde `400` con la lista de mensajes; el formulario queda visible con lo que el usuario escribió, para corregirlo. Si todo sale bien responde `201` y la lista se actualiza sin recargar la página.
* **Formulario:** nombre (texto, 3 a 50 caracteres) y comentario (`<textarea rows="3" cols="40">`, al menos 5 caracteres), con el botón "Agregar comentario". El JavaScript valida antes de enviar y **el servidor valida otra vez** (`utils/validations.py`).
* **Decisión:** el texto del comentario tiene un **máximo de 300 caracteres**, porque la columna `comentario.texto` es `VARCHAR(300)`; el enunciado solo fija el mínimo.
* **Seguridad:** el contenido de los comentarios se inserta en la página con `textContent` (nunca `innerHTML`), así que el HTML o `<script>` escrito por un usuario se muestra como texto y no se ejecuta; las consultas usan SQLAlchemy (parametrizadas); el `id` de la URL debe ser entero y si el avistamiento no existe se responde `404`.

## Biblioteca de gráficos
**Chart.js 4.6.1** (https://www.chartjs.org), licencia MIT. El archivo está incluido en el proyecto (`static/js/vendor/chart.umd.min.js`, licencia en `static/js/vendor/chart.js-LICENSE.md`), por lo que la página de estadísticas funciona sin conexión a internet.

---

# Tarea 2 (Flask + SQLAlchemy + MySQL) *(La Tarea 3 se construye sobre esta)*

## Cómo ejecutar

Requisito: tener MySQL instalado y corriendo.

1. **Instalar dependencias** (desde la raíz del proyecto):
   ```
   python -m pip install -r requirements.txt
   ```
   (en algunos equipos el comando es `py` o `python3` en vez de `python`).

2. **Crear la base de datos.** Usar los archivos de la carpeta `database/` de este repositorio (el `tarea2.sql` está modificado: `telefono` admite NULL). Cualquiera de las dos formas:
   * **Automática (recomendada):**
     ```
     cd database
     python init_db.py
     cd ..
     ```
     Pide el usuario y la contraseña de administrador de MySQL (normalmente `root`) y ejecuta `tarea2.sql`, `tabla-comentario.sql`, `region-comuna.sql` y `aves.sql` en ese orden. Puede ejecutarse varias veces, pero **recrea la base `tarea2` y borra sus datos**.
   * **Manual:** ejecutar los cuatro archivos `.sql` de `database/` en ese orden, con un usuario administrador (`region-comuna.sql` y `aves.sql` necesitan `USE tarea2;` al comienzo).

   El script `tarea2.sql` crea el usuario que usa la aplicación (`cc5002` / `programacionweb`, según el enunciado).

   ejecutar únicamente `database/tabla-comentario.sql` (no borra nada).

3. **Ejecutar la aplicación** desde la raíz del proyecto:
   ```
   python app.py
   ```
   y abrir http://127.0.0.1:5000

## Estructura
```
app.py                 rutas de Flask (solo coordina: valida, guarda archivos y llama a db)
database/
  db.py                conexión, modelos SQLAlchemy y una función por cada operación de BD
  init_db.py           crea la base y carga los datos
  tarea2.sql           esquema (modificado: telefono admite NULL) + usuario cc5002
  tabla-comentario.sql tabla comentario (Tarea 3, script entregado en el enunciado)
  region-comuna.sql    regiones y comunas
  aves.sql             listado de aves
  drop_db.sql          elimina la base y el usuario
utils/
  validations.py       validaciones del servidor (funciones pequeñas validate_*)
templates/             base.html (menú común) + una plantilla por página
static/                css, js (incluye js/vendor/chart.umd.min.js) y uploads/ (fotos y videos subidos)
```

## Decisiones de diseño

### Modelo de datos
* **`voluntario.telefono` es opcional (`NULL`)** porque en el formulario el celular es opcional. Si no se ingresa se guarda `NULL`. Cambio hecho en `database/tarea2.sql`.
  Si la base ya estaba creada: `ALTER TABLE tarea2.voluntario MODIFY telefono VARCHAR(15) NULL;`
* **Se eliminó el "tipo de ave"** de la Tarea 1: la tabla `ave` solo tiene el nombre. El formulario usa un desplegable con las aves de la tabla `ave`, y por eso el listado ya no filtra por tipo (se mantiene el ordenamiento).
* `fecha_registro` se guarda con la fecha y hora del servidor al insertar.

### Acceso a la base de datos
* SQLAlchemy con `create_engine` + `sessionmaker`. Cada función de `database/db.py` abre una sesión, hace su operación y la cierra.
* Las relaciones que usan los templates (ave, voluntario, comuna, archivos) se cargan antes de cerrar la sesión (`joinedload` / `selectinload`).
* Las funciones que escriben (`create_volunteer`, `create_sighting`) hacen `rollback` si algo falla. `create_sighting` inserta el avistamiento y todos sus registros en **una sola transacción**.
* El listado se pagina en la consulta (`LIMIT` / `OFFSET`) y el orden se elige de una lista blanca (`SORT_OPTIONS`); el texto del usuario nunca se concatena en SQL.

### Validaciones (cliente y servidor)
* El JavaScript valida primero y solo envía el formulario (`form.submit()`) si todo es correcto. **El servidor siempre vuelve a validar** (`utils/validations.py`), porque el JS se puede saltar.
* Si el servidor encuentra errores, vuelve a mostrar el formulario con los mensajes y los datos ya escritos.
* Reglas: nombre 4-255 caracteres; email con formato válido (máx. 80); celular opcional, solo dígitos (8-15); la comuna debe existir **y pertenecer a la región elegida**; ave y voluntario deben existir; lugar 3-200; fecha no futura y no anterior a **1 año**; descripción máx. 500; entre 1 y 5 archivos.

### Archivos subidos
* El tipo del archivo se detecta **por su contenido** con la librería `filetype` (no por el nombre ni por lo que informa el navegador). Se aceptan `png, jpg, gif, webp, mp4, webm`, estas tienen un límite de 50 MB por envío.
* Cada archivo se guarda en `static/uploads/` con el nombre `sha256(nombre original)_uuid.extensión`, usando la extensión real detectada.
* En la tabla `registro`: `ruta_archivo` guarda la ruta relativa a `static/` y `nombre_archivo` el nombre original saneado con `secure_filename`.
* Primero se guardan los archivos y luego se inserta en la BD; si la inserción falla se borran los archivos ya guardados.


### Seguridad
* Consultas por SQLAlchemy (parametrizadas). Jinja escapa el HTML de todo lo que se muestra (no se usa `|safe`).
* Parámetros de URL: `page` se convierte a entero de forma segura y se corrige si está fuera de rango, `orden` se valida contra la lista blanca y los `id` son enteros (404 si no existen).

### Páginas
* **Portada:** bienvenida, menú y los 2 últimos avistamientos agregados.
* **Registro:** al guardar ofrece registrar un avistamiento para ese voluntario (llega preseleccionado) o ir al inicio.
* **Listado:** paginación (5 por página), ordenamiento, y clic en una fila para ver el detalle con fotos y videos leídos desde la BD.
* **Indicadores:** ver Tarea 3.
