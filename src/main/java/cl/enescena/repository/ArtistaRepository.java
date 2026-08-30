package cl.enescena.repository;

import cl.enescena.model.Artista;
import cl.enescena.model.EstadoArtista;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArtistaRepository extends JpaRepository<Artista, Long> {

    Optional<Artista> findBySlug(String slug);

    List<Artista> findByEstado(EstadoArtista estado);

    boolean existsBySlug(String slug);
}