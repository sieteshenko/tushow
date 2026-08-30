package cl.enescena.controller;

import cl.enescena.dto.ArtistaResponse;
import cl.enescena.dto.CrearArtistaRequest;
import cl.enescena.dto.CrearArtistaResponse;
import cl.enescena.service.ArtistaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @PostMapping
    public ResponseEntity<CrearArtistaResponse> crear(
            @RequestBody CrearArtistaRequest request
    ) {

        CrearArtistaResponse response =
                artistaService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}