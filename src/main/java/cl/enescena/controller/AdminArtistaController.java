package cl.enescena.controller;

import cl.enescena.dto.AdminArtistaResponse;
import cl.enescena.dto.ArtistaResponse;
import cl.enescena.dto.RechazarArtistaRequest;
import cl.enescena.service.ArtistaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/artistas")
public class AdminArtistaController {

    private final ArtistaService artistaService;

    public AdminArtistaController(ArtistaService artistaService) {
        this.artistaService = artistaService;
    }

    @GetMapping("/pendientes")
    public List<AdminArtistaResponse> pendientes() {
        return artistaService.obtenerPendientes();
    }

    @PatchMapping("/{id}/aprobar")
    public ResponseEntity<Void> aprobar(@PathVariable Long id) {
        artistaService.aprobar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/rechazar")
    public ResponseEntity<Void> rechazar(
            @PathVariable Long id,
            @RequestBody RechazarArtistaRequest request
    ) {

        artistaService.rechazar(id, request.motivo());

        return ResponseEntity.noContent().build();
    }
}