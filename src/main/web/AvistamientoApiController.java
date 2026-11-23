package cl.uchile.cc5002.tarea4.web;

import cl.uchile.cc5002.tarea4.service.AvistamientoService;
import cl.uchile.cc5002.tarea4.service.AvistamientoService.ResultadoDto;
import cl.uchile.cc5002.tarea4.service.AvistamientoService.ResumenNota;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/avistamientos")
public class AvistamientoApiController {

    private final AvistamientoService servicio;

    public AvistamientoApiController(AvistamientoService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<ResultadoDto> buscar(@RequestParam(name = "q", defaultValue = "") String q) {
        return servicio.buscar(q);
    }

    /**
     * Agrega una nota al avistamiento. El parametro llega como texto para poder rechazar
     * valores como "5.5", "abc" o "" (solo se aceptan enteros entre 1 y 7).
     */
    @PostMapping("/{id}/notas")
    public ResponseEntity<Map<String, Object>> evaluar(@PathVariable("id") int id,
                                                       @RequestParam(name = "nota", defaultValue = "") String nota) {
        int valor;
        try {
            valor = Integer.parseInt(nota.strip());
        } catch (NumberFormatException e) {
            return error(HttpStatus.BAD_REQUEST, "La nota debe ser un número entero entre 1 y 7.");
        }
        if (valor < AvistamientoService.NOTA_MIN || valor > AvistamientoService.NOTA_MAX) {
            return error(HttpStatus.BAD_REQUEST, "La nota debe ser un número entero entre 1 y 7.");
        }

        Optional<ResumenNota> resumen = servicio.evaluar(id, valor);
        if (resumen.isEmpty()) {
            return error(HttpStatus.NOT_FOUND, "El avistamiento no existe.");
        }
        return ResponseEntity.ok(Map.of(
                "promedio", resumen.get().promedio(),
                "cantidad", resumen.get().cantidad()));
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus estado, String mensaje) {
        return ResponseEntity.status(estado).body(Map.of("error", mensaje));
    }
}
