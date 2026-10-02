"""Crea la base de datos 'tarea2' y carga regiones, comunas y aves.

Uso (desde la carpeta database/):
    python init_db.py

Pide el usuario administrador de MySQL (normalmente root) y su contraseña,
y ejecuta en orden: tarea2.sql, region-comuna.sql y aves.sql.
ATENCIÓN: tarea2.sql borra y recrea la base 'tarea2'.
"""
import getpass
import os

import pymysql

HERE = os.path.dirname(os.path.abspath(__file__))
ARCHIVOS = ["tarea2.sql", "region-comuna.sql", "aves.sql"]


def leer_sentencias(ruta):
    """Separa un .sql en sentencias (ignora las líneas de comentario '--')."""
    with open(ruta, encoding="utf-8") as f:
        lineas = [l for l in f.read().splitlines() if not l.strip().startswith("--")]
    return [s.strip() for s in "\n".join(lineas).split(";") if s.strip()]


if __name__ == "__main__":
    host = input("Host de MySQL [localhost]: ").strip() or "localhost"
    usuario = input("Usuario administrador [root]: ").strip() or "root"
    clave = getpass.getpass(f"Contraseña de {usuario}: ")

    conexion = pymysql.connect(host=host, port=3306, user=usuario, password=clave, charset="utf8mb4")
    try:
        with conexion.cursor() as cursor:
            for archivo in ARCHIVOS:
                sentencias = leer_sentencias(os.path.join(HERE, archivo))
                for sentencia in sentencias:
                    try:
                        cursor.execute(sentencia)
                    except pymysql.err.OperationalError as error:
                        # 1396: el usuario ya existe (al ejecutar el script por segunda vez). No es grave.
                        if error.args[0] == 1396 and sentencia.upper().startswith("CREATE USER"):
                            print("  (el usuario ya existía, se mantiene)")
                        else:
                            raise
                conexion.commit()
                print(f"✔ {archivo} ({len(sentencias)} sentencias)")
            cursor.execute("SELECT COUNT(*) FROM tarea2.region")
            print("Regiones:", cursor.fetchone()[0])
            cursor.execute("SELECT COUNT(*) FROM tarea2.comuna")
            print("Comunas:", cursor.fetchone()[0])
            cursor.execute("SELECT COUNT(*) FROM tarea2.ave")
            print("Aves:", cursor.fetchone()[0])
    finally:
        conexion.close()
    print("¡Base de datos lista!")
