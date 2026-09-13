package cl.enescena.repository;

import cl.enescena.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    Optional<Reserva> findByFolio(String folio);

    List<Reserva> findByArtistaIdAndFechaEvento(
            Long artistaId,
            LocalDate fechaEvento
    );

    List<Reserva> findByCorreoClienteIgnoreCaseOrderByFechaEventoDesc(
            String correoCliente
    );
}