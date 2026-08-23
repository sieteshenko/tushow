package cl.enescena.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class ArtistaResponse {

    private Long id;
    private String nombreArtistico;
    private String slug;
    private String biografia;
    private String region;
    private String comuna;
    private String icono;
    private String urlImagenPerfil;
    private Boolean destacado;

    private List<String> categorias;
    private List<PaqueteShowResponse> paquetes;

    private List<LocalDate> fechasDisponibles;
}