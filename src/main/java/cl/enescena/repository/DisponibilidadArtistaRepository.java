package cl.enescena.repository;

import cl.enescena.model.DisponibilidadArtista;
import cl.enescena.model.EstadoDisponibilidad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DisponibilidadArtistaRepository
        extends JpaRepository<DisponibilidadArtista, Long> {

    Optional<DisponibilidadArtista>
    findByArtistaIdAndFechaDisponibleAndEstado(
            Long artistaId,
            LocalDate fechaDisponible,
            EstadoDisponibilidad estado
    );
}