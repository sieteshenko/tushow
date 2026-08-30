package cl.enescena.service;

import cl.enescena.dto.*;
import cl.enescena.model.*;
import cl.enescena.repository.ArtistaRepository;
import cl.enescena.repository.CategoriaRepository;
import cl.enescena.repository.DisponibilidadArtistaRepository;
import cl.enescena.repository.PaqueteShowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.List;

@Service
public class ArtistaService {

    private final ArtistaRepository artistaRepository;
    private final CategoriaRepository categoriaRepository;
    private final PaqueteShowRepository paqueteShowRepository;
    private final DisponibilidadArtistaRepository disponibilidadRepository;

    public ArtistaService(ArtistaRepository artistaRepository, CategoriaRepository categoriaRepository, PaqueteShowRepository paqueteShowRepository, DisponibilidadArtistaRepository disponibilidadRepository) {
        this.artistaRepository = artistaRepository;
        this.categoriaRepository = categoriaRepository;
        this.paqueteShowRepository = paqueteShowRepository;
        this.disponibilidadRepository = disponibilidadRepository;
    }

    @Transactional(readOnly = true)
    public List<ArtistaResponse> obtenerTodos() {
        return artistaRepository
                .findByEstado(EstadoArtista.PUBLICADO)
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

    @Transactional
    public CrearArtistaResponse crear(CrearArtistaRequest request) {

        if (request.paquetes() == null || request.paquetes().isEmpty()) {
            throw new IllegalArgumentException(
                    "Debes agregar al menos un paquete"
            );
        }

        if (request.fechasDisponibles() == null ||
                request.fechasDisponibles().isEmpty()) {
            throw new IllegalArgumentException(
                    "Debes agregar al menos una fecha disponible"
            );
        }

        Categoria categoria = categoriaRepository
                .findByNombre(request.categoria())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Categoría no encontrada: "
                                        + request.categoria()
                        )
                );

        Artista artista = new Artista();

        artista.setNombreArtistico(request.nombreArtistico());
        artista.setSlug(
                generarSlugUnico(request.nombreArtistico())
        );
        artista.setBiografia(request.biografia());
        artista.setRegion(request.region());
        artista.setComuna(request.comuna());
        artista.setIcono(request.icono());

        artista.setNombreContacto(request.nombreContacto());
        artista.setCorreoContacto(request.correoContacto());
        artista.setTelefonoContacto(request.telefonoContacto());

        artista.setDestacado(false);
        artista.setShowsRealizados(0);

        // No aparece públicamente todavía.
        artista.setEstado(EstadoArtista.PENDIENTE_REVISION);

        artista.setCategorias(List.of(categoria));

        artista = artistaRepository.save(artista);

        int orden = 1;

        for (CrearPaqueteRequest p : request.paquetes()) {

            PaqueteShow paquete = new PaqueteShow();

            paquete.setArtista(artista);
            paquete.setNombre(p.nombre());
            paquete.setDuracionMinutos(p.duracionMinutos());
            paquete.setPrecio(p.precio());
            paquete.setMoneda("CLP");
            paquete.setActivo(true);
            paquete.setOrden(orden++);
            paquete.setDescripcion(request.biografia());

            System.out.println("BIO REQUEST      = [" + request.biografia() + "]");
            System.out.println("DESCRIPCION PKG  = [" + paquete.getDescripcion() + "]");

            paqueteShowRepository.save(paquete);
        }

        for (LocalDate fecha : request.fechasDisponibles()) {

            if (fecha.isBefore(LocalDate.now())) {
                throw new IllegalArgumentException(
                        "La fecha " + fecha + " ya pasó"
                );
            }

            DisponibilidadArtista disponibilidad =
                    new DisponibilidadArtista();

            disponibilidad.setArtista(artista);
            disponibilidad.setFechaDisponible(fecha);
            disponibilidad.setEstado(
                    EstadoDisponibilidad.DISPONIBLE
            );

            disponibilidadRepository.save(disponibilidad);
        }

        return new CrearArtistaResponse(
                artista.getId(),
                artista.getNombreArtistico(),
                artista.getSlug(),
                artista.getEstado().name()
        );
    }

    private String generarSlugUnico(String texto) {

        String baseSlug = generarSlugBase(texto);
        String slug = baseSlug;
        int contador = 2;

        while (artistaRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + contador;
            contador++;
        }

        return slug;
    }

    private String generarSlugBase(String texto) {
        return Normalizer
                .normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
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

    @Transactional(readOnly = true)
    public List<AdminArtistaResponse> obtenerPendientes() {
        return artistaRepository
                .findByEstado(EstadoArtista.PENDIENTE_REVISION)
                .stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional
    public void aprobar(Long id) {

        Artista artista = artistaRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Artista no encontrado: " + id)
                );

        if (artista.getEstado() != EstadoArtista.PENDIENTE_REVISION) {
            throw new IllegalStateException(
                    "Solo se pueden aprobar solicitudes pendientes"
            );
        }

        artista.setEstado(EstadoArtista.PUBLICADO);
        artista.setMotivoRechazo(null);

        artistaRepository.save(artista);
    }

    @Transactional
    public void rechazar(Long id, String motivo) {

        Artista artista = artistaRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Artista no encontrado: " + id)
                );

        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException(
                    "Debe indicar un motivo de rechazo"
            );
        }

        artista.setEstado(EstadoArtista.RECHAZADO);
        artista.setMotivoRechazo(motivo.trim());

        artistaRepository.save(artista);
    }


    private AdminArtistaResponse toAdminResponse(Artista artista) {

        List<String> categorias = artista.getCategorias()
                .stream()
                .map(Categoria::getNombre)
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

        return new AdminArtistaResponse(
                artista.getId(),
                artista.getNombreArtistico(),
                artista.getSlug(),
                artista.getBiografia(),
                artista.getRegion(),
                artista.getComuna(),
                artista.getIcono(),
                artista.getNombreContacto(),
                artista.getCorreoContacto(),
                artista.getTelefonoContacto(),
                categorias,
                paquetes,
                fechasDisponibles
        );
    }

}