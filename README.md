# desarrollo_web_nicolas_nunez

**Curso:** CC5002 - Desarrollo de Aplicaciones Web
**Estudiante:** Nicolás Núñez

Aplicación web para la gestión de voluntarios y el reporte de avistamientos de aves en Chile.

# Tarea 2 (Flask + SQLAlchemy + MySQL)

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
     Pide el usuario y la contraseña de administrador de MySQL (normalmente `root`) y ejecuta `tarea2.sql`, `region-comuna.sql` y `aves.sql` en ese orden. Puede ejecutarse varias veces, pero **recrea la base `tarea2` y borra sus datos**.
   * **Manual:** ejecutar los tres archivos `.sql` de `database/` en ese orden, con un usuario administrador (los dos últimos necesitan `USE tarea2;` al comienzo).

   El script `tarea2.sql` crea el usuario que usa la aplicación (`cc5002` / `programacionweb`, según el enunciado).

3. **Ejecutar la aplicación** desde la raíz del proyecto:
```
   python app.py
```
   y abrir http://127.0.0.1:5000


## Estructura
```
├── database/
│   ├── __init__.py
│   ├── aves.sql
│   ├── db.py
│   ├── drop_db.sql
│   ├── init_db.py
│   ├── region-comuna-sql
│   └── tarea2.sql
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── listado.js
│   │   ├── select.js
│   │   ├── validacion_informar.js
│   │   └── validaciones.js
│   └── uploads/
├── templates/
│   ├── _macros.html
│   ├── base.html
│   ├── detalle.html
│   ├── error.html
│   ├── index.html
│   ├── indicadores.html
│   ├── informar.html
│   ├── listado.html
│   ├── registro_ok.html
│   └── registro.html
├── utils/
│   ├── __pycache__/
│   ├── __init__.py
│   └── validations.py
├── app.py
├── README.md
└── requirements.txt
```

## Decisiones de diseño

### Modelo de datos
* **`voluntario.telefono` es opcional (`NULL`)** porque en el formulario el celular es opcional. Si no se ingresa se guarda `NULL`. Cambio hecho en `database/tarea2.sql`.
  Si la base ya estaba creada: `ALTER TABLE tarea2.voluntario MODIFY telefono VARCHAR(15) NULL;`
* **Se eliminó el "tipo de ave"** de la tarea 1: la tabla `ave` solo tiene el nombre. El formulario usa un desplegable con las aves de la tabla `ave`, y por eso el listado ya no filtra por tipo.
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
* El tipo del archivo se detecta **por su contenido** con la librería `filetype` (y no por el nombre ni por lo que informa el navegador). Se aceptan `png, jpg, gif, webp, mp4, webm`.
* Cada archivo se guarda en `static/uploads/` con el nombre `sha256(nombre original)_uuid.extensión`, usando la extensión real detectada.
* En la tabla `registro`: `ruta_archivo` guarda la ruta relativa a `static/` y `nombre_archivo` el nombre original saneado con `secure_filename`.
* Primero se guardan los archivos y luego se inserta en la BD; si la inserción falla se borran los archivos ya guardados.
* Límite de 50 MB por envío.

### Seguridad
* Consultas por SQLAlchemy. Jinja escapa el HTML de todo lo que se muestra (no se usa `|safe`).
* Parámetros de URL: `page` se convierte a entero de forma segura y se corrige si está fuera de rango, `orden` se valida contra la lista blanca y los `id` son enteros (404 si no existen).

### Páginas
* **Portada:** bienvenida, menú y los 2 últimos avistamientos agregados.
* **Registro:** al guardar ofrece registrar un avistamiento para ese voluntario (llega preseleccionado) o ir al inicio.
* **Listado:** paginación (5 por página), ordenamiento, y clic en una fila para ver el detalle con fotos y videos leídos desde la BD.
* **Indicadores:** queda pendiente.
