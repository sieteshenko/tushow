package cl.enescena.service;

import cl.enescena.dto.CrearReservaRequest;
import cl.enescena.dto.ReservaResponse;
import cl.enescena.model.*;
import cl.enescena.repository.ArtistaRepository;
import cl.enescena.repository.DisponibilidadArtistaRepository;
import cl.enescena.repository.PaqueteShowRepository;
import cl.enescena.repository.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ReservaService {

    private static final BigDecimal COMISION = new BigDecimal("0.06");

    private final ReservaRepository reservaRepository;
    private final ArtistaRepository artistaRepository;
    private final PaqueteShowRepository paqueteShowRepository;
    private final DisponibilidadArtistaRepository disponibilidadRepository;

    public ReservaService(
            ReservaRepository reservaRepository,
            ArtistaRepository artistaRepository,
            PaqueteShowRepository paqueteShowRepository,
            DisponibilidadArtistaRepository disponibilidadRepository) {

        this.reservaRepository = reservaRepository;
        this.artistaRepository = artistaRepository;
        this.paqueteShowRepository = paqueteShowRepository;
        this.disponibilidadRepository = disponibilidadRepository;
    }

    @Transactional
    public ReservaResponse crear(CrearReservaRequest request) {

        Artista artista = artistaRepository.findById(request.getArtistaId())
                .orElseThrow(() ->
                        new RuntimeException("Artista no encontrado")
                );

        PaqueteShow paquete = paqueteShowRepository
                .findById(request.getPaqueteShowId())
                .orElseThrow(() ->
                        new RuntimeException("Paquete no encontrado")
                );

        if (!paquete.getArtista().getId().equals(artista.getId())) {
            throw new RuntimeException(
                    "El paquete no pertenece al artista seleccionado"
            );
        }

        DisponibilidadArtista disponibilidad =
                disponibilidadRepository
                        .findByArtistaIdAndFechaDisponibleAndEstado(
                                artista.getId(),
                                request.getFechaEvento(),
                                EstadoDisponibilidad.DISPONIBLE
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "La fecha seleccionada no está disponible"
                                )
                        );

        BigDecimal subtotal = paquete.getPrecio();

        BigDecimal comisionServicio =
                subtotal.multiply(COMISION);

        BigDecimal descuento = BigDecimal.ZERO;

        BigDecimal total =
                subtotal
                        .add(comisionServicio)
                        .subtract(descuento);

        Reserva reserva = new Reserva();

        reserva.setFolio(generarFolio());

        reserva.setArtista(artista);
        reserva.setPaqueteShow(paquete);
        reserva.setDisponibilidad(disponibilidad);

        reserva.setNombreCliente(request.getNombreCliente());
        reserva.setCorreoCliente(request.getCorreoCliente());
        reserva.setTelefonoCliente(request.getTelefonoCliente());

        reserva.setFechaEvento(request.getFechaEvento());
        reserva.setHoraEvento(request.getHoraEvento());

        reserva.setDireccionEvento(request.getDireccionEvento());
        reserva.setComunaEvento(request.getComunaEvento());
        reserva.setRegionEvento(request.getRegionEvento());

        reserva.setCantidadInvitados(request.getCantidadInvitados());
        reserva.setMensajeCliente(request.getMensajeCliente());

        // Snapshot
        reserva.setNombrePaquete(paquete.getNombre());
        reserva.setDuracionMinutos(paquete.getDuracionMinutos());

        reserva.setSubtotal(subtotal);
        reserva.setComisionServicio(comisionServicio);
        reserva.setDescuento(descuento);
        reserva.setTotal(total);

        reserva.setMoneda(paquete.getMoneda());

        reserva.setEstado(EstadoReserva.PENDIENTE_PAGO);

        Reserva guardada = reservaRepository.save(reserva);

        // Bloqueamos la fecha
        disponibilidad.setEstado(
                EstadoDisponibilidad.RESERVADO
        );

        disponibilidadRepository.save(disponibilidad);

        return toResponse(guardada);
    }

    private String generarFolio() {
        return UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase();
    }

    private ReservaResponse toResponse(Reserva reserva) {

        return new ReservaResponse(
                reserva.getId(),
                reserva.getFolio(),

                reserva.getArtista().getNombreArtistico(),
                reserva.getNombrePaquete(),

                reserva.getFechaEvento(),

                reserva.getNombreCliente(),
                reserva.getCorreoCliente(),

                reserva.getSubtotal(),
                reserva.getComisionServicio(),
                reserva.getDescuento(),
                reserva.getTotal(),

                reserva.getMoneda(),
                reserva.getEstado().name()
        );
    }
}