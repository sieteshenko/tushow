package cl.enescena.dto;

import java.time.LocalDate;
import java.util.List;

public record CrearArtistaRequest(
        String nombreArtistico,
        String nombreContacto,
        String correoContacto,
        String telefonoContacto,
        String biografia,
        String region,
        String comuna,
        String categoria,
        String icono,
        Boolean destacado,
        List<CrearPaqueteRequest> paquetes,
        List<LocalDate> fechasDisponibles
) {
}