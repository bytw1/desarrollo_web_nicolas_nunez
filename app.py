from flask import Flask, request, render_template, redirect, url_for, flash, abort
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.utils import secure_filename
from utils.validations import (validate_volunteer, validate_sighting, guess_file_type,
                               parse_datetime, clean_line, clean_text, to_int, MAX_FILES)
from database import db
import hashlib
import math
import os
import uuid

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
PAGE_SIZE = 5

app = Flask(__name__)
app.secret_key = "secret_key"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1000 * 1000  # 50 MB por envío
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.template_filter("fechahora")
def fechahora(value):
    return value.strftime("%Y-%m-%d %H:%M") if value else ""


# Portada

@app.route("/", methods=["GET"])
def index():
    last_sightings = db.get_last_sightings(2)
    return render_template("index.html", ultimos=last_sightings)


# Registro de voluntarios

def render_registro(values, errors=None, status=200):
    # {region_id: [{id, nombre}, ...]} para la cascada región -> comuna del navegador
    communes_by_region = {}
    for commune in db.get_communes():
        communes_by_region.setdefault(commune.region_id, []).append(
            {"id": commune.id, "nombre": commune.nombre})

    return render_template("registro.html", regiones=db.get_regions(),
                           comunas_por_region=communes_by_region,
                           valores=values, errores=errors or []), status


@app.route("/registro", methods=["GET", "POST"])
def registro():
    if request.method == "GET":
        return render_registro({})

    # POST
    values = {k: request.form.get(k, "") for k in ("nombre", "email", "celular", "region", "comuna")}
    name = clean_line(request.form.get("nombre"))
    email = clean_line(request.form.get("email"))
    phone = clean_line(request.form.get("celular"))
    region_id = to_int(request.form.get("region"))
    commune_id = to_int(request.form.get("comuna"))

    errors = validate_volunteer(name, email, phone, region_id, commune_id)

    if not errors:
        # validaciones que necesitan la base de datos: la comuna existe y es de esa región
        commune = db.get_commune_by_id(commune_id)
        if commune is None:
            errors.append("Comuna: seleccione una comuna válida.")
        elif commune.region_id != region_id:
            errors.append("Comuna: la comuna no pertenece a la región seleccionada.")

    if errors:
        return render_registro(values, errors, 400)

    try:
        volunteer_id = db.create_volunteer(name, email, phone or None, commune_id)
    except SQLAlchemyError:
        return render_registro(values, ["Error interno al guardar el voluntario. Intente nuevamente."], 500)

    return redirect(url_for("registro_exitoso", voluntario_id=volunteer_id))


@app.route("/registro/exito/<int:voluntario_id>", methods=["GET"])
def registro_exitoso(voluntario_id):
    volunteer = db.get_volunteer_by_id(voluntario_id)
    if volunteer is None:
        abort(404)
    return render_template("registro_ok.html", voluntario=volunteer)


#  Informar avistamiento 

def render_informar(values, errors=None, status=200):
    return render_template("informar.html", voluntarios=db.get_volunteers(), aves=db.get_birds(),
                           valores=values, errores=errors or [], max_archivos=MAX_FILES), status


def save_upload(file):
    """Guarda el archivo con nombre hash + uuid y la extensión REAL (detectada por contenido).

    Devuelve (ruta relativa a static, nombre original, ruta absoluta en disco).
    """
    original_name = secure_filename(file.filename)
    _filename_hash = hashlib.sha256(original_name.encode("utf-8")).hexdigest()
    _extension = guess_file_type(file).extension
    saved_name = f"{_filename_hash}_{str(uuid.uuid4())}.{_extension}"

    absolute_path = os.path.join(app.config["UPLOAD_FOLDER"], saved_name)
    file.save(absolute_path)
    return f"uploads/{saved_name}", (original_name or saved_name)[:300], absolute_path


@app.route("/informar", methods=["GET", "POST"])
def informar():
    if request.method == "GET":
        # Si venimos desde el registro, el voluntario llega preseleccionado
        volunteer_id = to_int(request.args.get("voluntario_id"))
        return render_informar({"voluntario_id": str(volunteer_id) if volunteer_id else ""})

    # POST
    values = {k: request.form.get(k, "")
              for k in ("voluntario_id", "ave_id", "lugar", "fecha_hora", "descripcion")}
    volunteer_id = to_int(request.form.get("voluntario_id"))
    bird_id = to_int(request.form.get("ave_id"))
    place = clean_line(request.form.get("lugar"))
    date_time = (request.form.get("fecha_hora") or "").strip()
    description = clean_text(request.form.get("descripcion"))
    files = [f for f in request.files.getlist("archivos") if f and f.filename]

    errors = validate_sighting(volunteer_id, bird_id, place, date_time, description, files)

    if not errors:
        # validaciones que necesitan la base de datos: el voluntario y el ave existen
        if db.get_volunteer_by_id(volunteer_id) is None:
            errors.append("Voluntario: seleccione un voluntario válido.")
        if db.get_bird_by_id(bird_id) is None:
            errors.append("Ave: seleccione un ave válida.")

    if errors:
        return render_informar(values, errors, 400)

    saved_paths = []  # rutas en disco, para borrarlas si falla la inserción
    try:
        # 1. guardar los archivos en el sistema de archivos
        records = []
        for file in files:
            path, original_name, absolute_path = save_upload(file)
            saved_paths.append(absolute_path)
            records.append((path, original_name))

        # 2. guardar avistamiento + registros en la base de datos (una sola transacción)
        db.create_sighting(volunteer_id, bird_id, parse_datetime(date_time),
                           place, description or None, records)
    except (SQLAlchemyError, OSError):
        for absolute_path in saved_paths:
            if os.path.exists(absolute_path):
                os.remove(absolute_path)
        return render_informar(values, ["Error interno al guardar el avistamiento. Intente nuevamente."], 500)

    flash("¡Avistamiento registrado con éxito!", "exito")
    return redirect(url_for("index"))


# Listado 

@app.route("/listado", methods=["GET"])
def listado():
    order = request.args.get("orden", "fecha-desc")
    if order not in db.SORT_OPTIONS:
        order = "fecha-desc"

    total_pages = max(math.ceil(db.count_sightings() / PAGE_SIZE), 1)
    page = request.args.get("page", 1, type=int)
    page = min(max(page, 1), total_pages)  # página fuera de rango -> se corrige

    sightings = db.get_sightings_page(page, PAGE_SIZE, order)
    return render_template("listado.html", avistamientos=sightings, orden=order,
                           ordenes={k: v[0] for k, v in db.SORT_OPTIONS.items()},
                           pagina=page, total_paginas=total_pages)


@app.route("/avistamiento/<int:avistamiento_id>", methods=["GET"])
def detalle(avistamiento_id):
    sighting = db.get_sighting_by_id(avistamiento_id)
    if sighting is None:
        abort(404)
    return render_template("detalle.html", a=sighting)


#  Indicadores   

@app.route("/indicadores", methods=["GET"])
def indicadores():
    # Pendiente para la siguiente tarea
    return render_template("indicadores.html")


#  Errores 

@app.errorhandler(404)
def not_found(_):
    return render_template("error.html", titulo="Página no encontrada",
                           mensaje="El recurso que busca no existe."), 404


@app.errorhandler(413)
def too_large(_):
    flash("Los archivos superan el tamaño máximo permitido (50 MB en total).", "error")
    return redirect(url_for("informar"))


if __name__ == "__main__":
    app.run(debug=True)
