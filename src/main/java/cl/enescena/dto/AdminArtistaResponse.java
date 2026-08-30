package cl.enescena.dto;

import java.time.LocalDate;
import java.util.List;

public record AdminArtistaResponse(
        Long id,
        String nombreArtistico,
        String slug,
        String biografia,
        String region,
        String comuna,
        String icono,
        String nombreContacto,
        String correoContacto,
        String telefonoContacto,
        List<String> categorias,
        List<PaqueteShowResponse> paquetes,
        List<LocalDate> fechasDisponibles
) {
}