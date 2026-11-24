package cl.uchile.cc5002.tarea4.repository;

import cl.uchile.cc5002.tarea4.model.Avistamiento;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvistamientoRepository extends JpaRepository<Avistamiento, Integer> {

    /**
     * Busca por nombre de ave, de voluntario o de comuna (la del voluntario).
     * El patron ya viene con los comodines y escapado con '!' como caracter de escape.
     * La comparacion ignora mayusculas y tildes por el collation utf8_general_ci del esquema.
     */
    @Query("""
            SELECT a FROM Avistamiento a
            JOIN FETCH a.ave av
            JOIN FETCH a.voluntario vol
            JOIN FETCH vol.comuna com
            WHERE av.nombre LIKE :patron ESCAPE '!'
               OR vol.nombre LIKE :patron ESCAPE '!'
               OR com.nombre LIKE :patron ESCAPE '!'
            ORDER BY a.fechaHora DESC, a.id DESC
            """)
    List<Avistamiento> buscar(@Param("patron") String patron, Pageable pageable);
}
