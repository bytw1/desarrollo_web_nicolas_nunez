package cl.uchile.cc5002.tarea4.service;

import cl.uchile.cc5002.tarea4.model.Avistamiento;
import cl.uchile.cc5002.tarea4.model.Nota;
import cl.uchile.cc5002.tarea4.repository.AvistamientoRepository;
import cl.uchile.cc5002.tarea4.repository.NotaRepository;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AvistamientoService {

    public static final int NOTA_MIN = 1;
    public static final int NOTA_MAX = 7;
    private static final int MAX_RESULTADOS = 50;
    private static final DateTimeFormatter DIA = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    /** Fila del listado de resultados. promedio es null si el avistamiento no tiene notas. */
    public record ResultadoDto(int id, String voluntario, String dia, String ave, String comuna,
                               Double promedio, long cantidad) {
    }

    // Promedio (con un decimal) y cantidad de notas de un avistamiento.
    public record ResumenNota(Double promedio, long cantidad) {
    }

    private final AvistamientoRepository avistamientos;
    private final NotaRepository notas;

    public AvistamientoService(AvistamientoRepository avistamientos, NotaRepository notas) {
        this.avistamientos = avistamientos;
        this.notas = notas;
    }

    @Transactional(readOnly = true)
    public List<ResultadoDto> buscar(String texto) {
        String q = texto == null ? "" : texto.strip();
        if (q.isEmpty()) {
            return List.of();
        }
        if (q.length() > 100) {
            q = q.substring(0, 100);
        }

        List<Avistamiento> encontrados = avistamientos.buscar(patron(q), PageRequest.of(0, MAX_RESULTADOS));
        if (encontrados.isEmpty()) {
            return List.of();
        }

        List<Integer> ids = encontrados.stream().map(Avistamiento::getId).toList();
        Map<Integer, ResumenNota> resumenes = resumenes(ids);

        return encontrados.stream().map(a -> {
            ResumenNota r = resumenes.get(a.getId());
            return new ResultadoDto(
                    a.getId(),
                    a.getVoluntario().getNombre(),
                    a.getFechaHora().format(DIA),
                    a.getAve().getNombre(),
                    a.getVoluntario().getComuna().getNombre(),
                    r == null ? null : r.promedio(),
                    r == null ? 0 : r.cantidad());
        }).toList();
    }

    // Guarda la nota y devuelve el nuevo promedio. Vacio si el avistamiento no existe.
    @Transactional
    public Optional<ResumenNota> evaluar(int avistamientoId, int nota) {
        if (nota < NOTA_MIN || nota > NOTA_MAX) {
            throw new IllegalArgumentException("La nota debe estar entre 1 y 7.");
        }
        if (!avistamientos.existsById(avistamientoId)) {
            return Optional.empty();
        }
        notas.save(new Nota(avistamientoId, nota));
        notas.flush();
        return Optional.of(resumenes(List.of(avistamientoId)).get(avistamientoId));
    }

    private Map<Integer, ResumenNota> resumenes(List<Integer> ids) {
        Map<Integer, ResumenNota> mapa = new HashMap<>();
        for (Object[] fila : notas.promedios(ids)) {
            int id = ((Number) fila[0]).intValue();
            double promedio = ((Number) fila[1]).doubleValue();
            long cantidad = ((Number) fila[2]).longValue();
            mapa.put(id, new ResumenNota(Math.round(promedio * 10.0) / 10.0, cantidad));
        }
        return mapa;
    }

    // reemplaza los comodines de LIKE (con '!') y agrega % a ambos lados.
    private static String patron(String q) {
        String escapado = q.replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return "%" + escapado + "%";
    }
}
