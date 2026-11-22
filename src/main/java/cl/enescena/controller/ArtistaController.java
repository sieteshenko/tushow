package cl.enescena.controller;

import cl.enescena.dto.ArtistaResponse;
import cl.enescena.dto.CrearArtistaRequest;
import cl.enescena.dto.CrearArtistaResponse;
import cl.enescena.service.ArtistaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CrearArtistaResponse> crear(
            @RequestBody CrearArtistaRequest request
    ) {

        CrearArtistaResponse response =
                artistaService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /** Igual que el anterior, con foto de perfil y galería. "datos" es el mismo JSON. */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CrearArtistaResponse> crearConMedios(
            @RequestPart("datos") CrearArtistaRequest request,
            @RequestPart(value = "foto", required = false) MultipartFile foto,
            @RequestPart(value = "galeria", required = false) List<MultipartFile> galeria
    ) {

        CrearArtistaResponse response =
                artistaService.crear(request, foto, galeria);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}