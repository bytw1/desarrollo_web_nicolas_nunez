package cl.uchile.cc5002.tarea4.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PaginaController {

    @GetMapping("/")
    public String buscador() {
        return "buscador";
    }
}
