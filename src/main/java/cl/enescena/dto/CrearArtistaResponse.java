package cl.enescena.dto;

public record CrearArtistaResponse(
        Long id,
        String nombreArtistico,
        String slug,
        String estado
) {
}