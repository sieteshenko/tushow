package cl.enescena.controller;

import cl.enescena.dto.ArtistaResponse;
import cl.enescena.service.ArtistaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/artistas")
public class ArtistaController {

    private final ArtistaService artistaService;

    public ArtistaController(ArtistaService artistaService) {
        this.artistaService = artistaService;
    }

    @GetMapping
    public List<ArtistaResponse> obtenerTodos() {
        return artistaService.obtenerTodos();
    }

    @GetMapping("/{slug}")
    public ArtistaResponse obtenerPorSlug(@PathVariable String slug) {
        return artistaService.obtenerPorSlug(slug);
    }
}