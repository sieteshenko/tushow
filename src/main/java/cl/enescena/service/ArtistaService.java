package cl.enescena.service;

import cl.enescena.dto.ArtistaResponse;
import cl.enescena.dto.PaqueteShowResponse;
import cl.enescena.model.Artista;
import cl.enescena.model.DisponibilidadArtista;
import cl.enescena.model.EstadoDisponibilidad;
import cl.enescena.repository.ArtistaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ArtistaService {

    private final ArtistaRepository artistaRepository;

    public ArtistaService(ArtistaRepository artistaRepository) {
        this.artistaRepository = artistaRepository;
    }

    @Transactional(readOnly = true)
    public List<ArtistaResponse> obtenerTodos() {
        return artistaRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ArtistaResponse obtenerPorSlug(String slug) {

        Artista artista = artistaRepository.findBySlug(slug)
                .orElseThrow(() ->
                        new RuntimeException("Artista no encontrado: " + slug)
                );

        return toResponse(artista);
    }

    private ArtistaResponse toResponse(Artista artista) {

        List<String> categorias = artista.getCategorias()
                .stream()
                .map(categoria -> categoria.getNombre())
                .toList();

        List<PaqueteShowResponse> paquetes = artista.getPaquetes()
                .stream()
                .filter(paquete -> Boolean.TRUE.equals(paquete.getActivo()))
                .map(paquete ->
                        new PaqueteShowResponse(
                                paquete.getId(),
                                paquete.getNombre(),
                                paquete.getDuracionMinutos(),
                                paquete.getPrecio(),
                                paquete.getMoneda()
                        )
                )
                .toList();

        List<LocalDate> fechasDisponibles = artista.getDisponibilidades()
                .stream()
                .filter(disponibilidad ->
                        disponibilidad.getEstado() == EstadoDisponibilidad.DISPONIBLE
                )
                .map(DisponibilidadArtista::getFechaDisponible)
                .sorted()
                .toList();

        return new ArtistaResponse(
                artista.getId(),
                artista.getNombreArtistico(),
                artista.getSlug(),
                artista.getBiografia(),
                artista.getRegion(),
                artista.getComuna(),
                artista.getIcono(),
                artista.getUrlImagenPerfil(),
                artista.getDestacado(),
                categorias,
                paquetes,
                fechasDisponibles
        );
    }


}