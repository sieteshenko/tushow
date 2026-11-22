package cl.enescena.controller;

import cl.enescena.service.MediaStorage;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/** Entrega fotos y videos subidos. Spring atiende los pedidos por rangos que usan los videos. */
@RestController
public class MediaController {

    private final MediaStorage storage;

    public MediaController(MediaStorage storage) {
        this.storage = storage;
    }

    @GetMapping("/media/{archivo}")
    public ResponseEntity<Resource> obtener(@PathVariable String archivo, HttpServletResponse response) {
        // server.servlet.encoding.force agrega ";charset=UTF-8" a todo; no aplica a imágenes ni videos.
        response.setCharacterEncoding((String) null);
        return storage.ubicar(archivo)
                .<ResponseEntity<Resource>>map(ruta -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(storage.contentType(archivo)))
                        // El nombre es aleatorio y el archivo nunca cambia.
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                        .body(new FileSystemResource(ruta)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
