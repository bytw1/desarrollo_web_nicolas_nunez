import os
from datetime import datetime

from sqlalchemy import (create_engine, Column, Integer, String, Text, DateTime,
                        ForeignKey, func)
from sqlalchemy.orm import (sessionmaker, declarative_base, relationship,
                            joinedload, selectinload)
from sqlalchemy.exc import SQLAlchemyError

DB_NAME = "tarea2"
DB_USERNAME = "cc5002"
DB_PASSWORD = "programacionweb"
DB_HOST = "localhost"
DB_PORT = 3306

# DATABASE_URL (opcional) permite apuntar a otra base sin tocar el código (útil para pruebas)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4",
)

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
VIDEO_EXTENSIONS = {"mp4", "webm"}

# --- Models ---

class Region(Base):
    __tablename__ = 'region'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)

    comunas = relationship("Comuna", back_populates="region")


class Comuna(Base):
    __tablename__ = 'comuna'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    region_id = Column(Integer, ForeignKey('region.id'), nullable=False)

    region = relationship("Region", back_populates="comunas")


class Voluntario(Base):
    __tablename__ = 'voluntario'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    email = Column(String(80), nullable=False)
    telefono = Column(String(15), nullable=True)  # opcional -> NULL
    fecha_registro = Column(DateTime, nullable=False)
    comuna_id = Column(Integer, ForeignKey('comuna.id'), nullable=False)

    comuna = relationship("Comuna")
    avistamientos = relationship("Avistamiento", back_populates="voluntario")


class Ave(Base):
    __tablename__ = 'ave'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(80), nullable=False)


class Avistamiento(Base):
    __tablename__ = 'avistamiento'

    id = Column(Integer, primary_key=True, autoincrement=True)
    voluntario_id = Column(Integer, ForeignKey('voluntario.id'), nullable=False)
    ave_id = Column(Integer, ForeignKey('ave.id'), nullable=False)
    fecha_hora = Column(DateTime, nullable=False)
    lugar = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)

    voluntario = relationship("Voluntario", back_populates="avistamientos")
    ave = relationship("Ave")
    registros = relationship("Registro", back_populates="avistamiento",
                             order_by="Registro.id", cascade="all, delete")

    @property
    def imagen_portada(self):
        """Primera imagen del avistamiento (para las miniaturas) o None."""
        return next((r for r in self.registros if r.es_imagen), None)


class Registro(Base):
    __tablename__ = 'registro'

    id = Column(Integer, primary_key=True, autoincrement=True)
    ruta_archivo = Column(String(300), nullable=False)    # relativa a /static
    nombre_archivo = Column(String(300), nullable=False)  # nombre original
    avistamiento_id = Column(Integer, ForeignKey('avistamiento.id'), nullable=False)

    avistamiento = relationship("Avistamiento", back_populates="registros")

    @property
    def extension(self):
        return os.path.splitext(self.ruta_archivo)[1].lstrip(".").lower()

    @property
    def es_imagen(self):
        return self.extension in IMAGE_EXTENSIONS

    @property
    def es_video(self):
        return self.extension in VIDEO_EXTENSIONS


# Opciones de orden del listado: clave -> (texto para el <select>, columnas del ORDER BY)
SORT_OPTIONS = {
    "fecha-desc": ("Fecha (más reciente primero)", [Avistamiento.fecha_hora.desc(), Avistamiento.id.desc()]),
    "fecha-asc": ("Fecha (más antigua primero)", [Avistamiento.fecha_hora.asc(), Avistamiento.id.asc()]),
    "lugar-asc": ("Lugar (A-Z)", [Avistamiento.lugar.asc(), Avistamiento.id.desc()]),
    "ave-asc": ("Nombre del ave (A-Z)", [Ave.nombre.asc(), Avistamiento.id.desc()]),
}

# Como la sesión se cierra al final de cada función, las relaciones que se usan en los
# templates se cargan de antemano (si no, SQLAlchemy no podría cargarlas después).
def _sighting_loading_options():
    return [
        joinedload(Avistamiento.ave),
        joinedload(Avistamiento.voluntario).joinedload(Voluntario.comuna),
        selectinload(Avistamiento.registros),
    ]

# --- Database Functions ---

def get_regions():
    session = SessionLocal()
    regions = session.query(Region).order_by(Region.id).all()
    session.close()
    return regions


def get_communes():
    session = SessionLocal()
    communes = session.query(Comuna).order_by(Comuna.nombre).all()
    session.close()
    return communes


def get_commune_by_id(id):
    session = SessionLocal()
    commune = session.get(Comuna, id)
    session.close()
    return commune


def get_birds():
    session = SessionLocal()
    birds = session.query(Ave).order_by(Ave.nombre).all()
    session.close()
    return birds


def get_bird_by_id(id):
    session = SessionLocal()
    bird = session.get(Ave, id)
    session.close()
    return bird


def get_volunteers():
    session = SessionLocal()
    volunteers = (session.query(Voluntario)
                  .options(joinedload(Voluntario.comuna))
                  .order_by(Voluntario.nombre)
                  .all())
    session.close()
    return volunteers


def get_volunteer_by_id(id):
    session = SessionLocal()
    volunteer = session.get(Voluntario, id, options=[joinedload(Voluntario.comuna)])
    session.close()
    return volunteer


def create_volunteer(name, email, phone, commune_id):
    """Inserta un voluntario (fecha_registro = momento actual). Devuelve su id."""
    session = SessionLocal()
    try:
        new_volunteer = Voluntario(nombre=name, email=email, telefono=phone,
                                   comuna_id=commune_id, fecha_registro=datetime.now())
        session.add(new_volunteer)
        session.commit()
        new_id = new_volunteer.id
    except SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()
    return new_id


def get_last_sightings(amount):
    session = SessionLocal()
    sightings = (session.query(Avistamiento)
                 .options(*_sighting_loading_options())
                 .order_by(Avistamiento.id.desc())
                 .limit(amount)
                 .all())
    session.close()
    return sightings


def count_sightings():
    session = SessionLocal()
    total = session.query(func.count(Avistamiento.id)).scalar()
    session.close()
    return total


def get_sightings_page(page, page_size, order="fecha-desc"):
    """Avistamientos de una página (page parte en 1) según la clave de SORT_OPTIONS."""
    if order not in SORT_OPTIONS:  # lista blanca: el texto del usuario nunca llega a la consulta
        order = "fecha-desc"
    session = SessionLocal()
    sightings = (session.query(Avistamiento)
                 .join(Ave)
                 .options(*_sighting_loading_options())
                 .order_by(*SORT_OPTIONS[order][1])
                 .offset((page - 1) * page_size)
                 .limit(page_size)
                 .all())
    session.close()
    return sightings


def get_sighting_by_id(id):
    session = SessionLocal()
    sighting = session.get(Avistamiento, id, options=_sighting_loading_options())
    session.close()
    return sighting


def create_sighting(volunteer_id, bird_id, date_time, place, description, files):
    """Inserta el avistamiento y TODOS sus registros en una sola transacción.

    `files` es una lista de tuplas (ruta_archivo, nombre_archivo). Devuelve el id del avistamiento.
    Si algo falla no queda nada a medias: se hace rollback y se vuelve a lanzar el error.
    """
    session = SessionLocal()
    try:
        new_sighting = Avistamiento(voluntario_id=volunteer_id, ave_id=bird_id,
                                    fecha_hora=date_time, lugar=place, descripcion=description)
        for path, original_name in files:
            new_sighting.registros.append(Registro(ruta_archivo=path, nombre_archivo=original_name))
        session.add(new_sighting)
        session.commit()
        new_id = new_sighting.id
    except SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()
    return new_id
