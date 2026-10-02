import re
from datetime import datetime

import filetype

ALLOWED_EXTENSIONS = {"png", "jpg", "gif", "webp", "mp4", "webm"}
ALLOWED_MIMETYPES = {"image/png", "image/jpeg", "image/gif", "image/webp",
                     "video/mp4", "video/webm"}
MAX_FILES = 5

RE_EMAIL = re.compile(r"[\w.+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}", re.ASCII)
RE_PHONE = re.compile(r"[0-9]{8,15}")


# --- Limpieza de texto ---

def clean_line(value):
    """Texto de una línea: quita espacios sobrantes y saltos de línea."""
    return " ".join((value or "").split())


def clean_text(value):
    """Texto multilínea: normaliza saltos de línea y elimina caracteres de control."""
    value = (value or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    return "".join(c for c in value if c == "\n" or ord(c) >= 32)


def to_int(value):
    """Convierte a int sin lanzar excepción; devuelve None si no es un entero."""
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


# --- Validadores de campos (devuelven True / False) ---

def validate_name(value):
    return bool(value) and 4 <= len(value) <= 255


def validate_email(value):
    return bool(value) and len(value) <= 80 and bool(RE_EMAIL.fullmatch(value))


def validate_phone(value):
    # Es opcional: vacío es válido
    if not value:
        return True
    return bool(RE_PHONE.fullmatch(value))


def validate_id(value):
    return value is not None and value > 0


def validate_place(value):
    return bool(value) and 3 <= len(value) <= 200


def validate_description(value):
    # Es opcional: vacío es válido
    return len(value or "") <= 500


def parse_datetime(value):
    """Convierte el valor de un <input type="datetime-local"> en datetime (o None)."""
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except (TypeError, ValueError):
            continue
    return None


def _one_year_ago(now):
    try:
        return now.replace(year=now.year - 1)
    except ValueError:  # 29 de febrero
        return now.replace(year=now.year - 1, day=28)


def validate_datetime(value):
    """Debe ser una fecha válida, no futura y no anterior a 1 año atrás."""
    date = parse_datetime(value)
    if date is None:
        return False
    now = datetime.now()
    return _one_year_ago(now) <= date <= now


# --- Archivos ---

def guess_file_type(file):
    """Detecta el tipo REAL del archivo por su contenido (no por su nombre ni por lo que dice el navegador).

    Se lee solo el comienzo y se vuelve al inicio, para que file.save() guarde el archivo completo.
    """
    header = file.stream.read(8192)
    file.stream.seek(0)
    return filetype.guess(header)


def validate_file(file):
    # ¿se envió un archivo?
    if file is None or file.filename == "":
        return False

    ftype_guess = guess_file_type(file)
    if ftype_guess is None:
        return False
    # extensión y mimetype detectados por contenido
    if ftype_guess.extension not in ALLOWED_EXTENSIONS:
        return False
    if ftype_guess.mime not in ALLOWED_MIMETYPES:
        return False
    return True


def validate_files(files):
    return 1 <= len(files) <= MAX_FILES and all(validate_file(f) for f in files)


# --- Validaciones de formularios completos (devuelven la lista de errores) ---

def validate_volunteer(name, email, phone, region_id, commune_id):
    errors = []
    if not validate_name(name):
        errors.append("Nombre: debe tener entre 4 y 255 caracteres.")
    if not validate_email(email):
        errors.append("Email: ingrese un correo válido (máximo 80 caracteres).")
    if not validate_phone(phone):
        errors.append("Celular: debe tener solo números, entre 8 y 15 dígitos (o dejarlo vacío).")
    if not validate_id(region_id):
        errors.append("Región: seleccione una región válida.")
    if not validate_id(commune_id):
        errors.append("Comuna: seleccione una comuna válida.")
    return errors


def validate_sighting(volunteer_id, bird_id, place, date_time, description, files):
    errors = []
    if not validate_id(volunteer_id):
        errors.append("Voluntario: seleccione un voluntario válido.")
    if not validate_id(bird_id):
        errors.append("Ave: seleccione un ave válida.")
    if not validate_place(place):
        errors.append("Lugar: debe tener entre 3 y 200 caracteres.")
    if not validate_datetime(date_time):
        errors.append("Fecha y hora: debe ser válida, no futura y no anterior a 1 año atrás.")
    if not validate_description(description):
        errors.append("Descripción: máximo 500 caracteres.")
    if not validate_files(files):
        errors.append(f"Archivos: adjunte entre 1 y {MAX_FILES} fotos o videos válidos "
                      "(png, jpg, gif, webp, mp4 o webm).")
    return errors
