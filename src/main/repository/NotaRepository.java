package cl.uchile.cc5002.tarea4.repository;

import cl.uchile.cc5002.tarea4.model.Nota;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotaRepository extends JpaRepository<Nota, Integer> {

    /** Devuelve filas [avistamientoId, promedio, cantidad] solo para avistamientos con notas. */
    @Query("""
            SELECT n.avistamientoId, AVG(n.nota), COUNT(n)
            FROM Nota n
            WHERE n.avistamientoId IN :ids
            GROUP BY n.avistamientoId
            """)
    List<Object[]> promedios(@Param("ids") Collection<Integer> ids);
}
