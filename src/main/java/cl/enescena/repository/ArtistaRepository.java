package cl.enescena.repository;

import cl.enescena.model.Artista;
import cl.enescena.model.EstadoArtista;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArtistaRepository extends JpaRepository<Artista, Long> {

    /**
     * Bloquea la fila del artista (SELECT ... FOR UPDATE) hasta que termine la transacción.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Artista a where a.id = :id")
    Optional<Artista> findByIdForUpdate(@Param("id") Long id);

    Optional<Artista> findBySlugAndEstado(String slug, EstadoArtista estado);

    List<Artista> findByEstado(EstadoArtista estado);

    boolean existsBySlug(String slug);
}