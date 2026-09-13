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
import java.time.LocalTime;
import java.util.List;
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

        Artista artista = artistaRepository
                .findById(request.getArtistaId())
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

        /*
         * VALIDACIÓN DE HORARIO
         */
        LocalTime horaInicio = request.getHoraEvento();

        if (horaInicio == null) {
            throw new RuntimeException(
                    "Debes seleccionar una hora para el evento"
            );
        }

        if (disponibilidad.getHoraDesde() == null ||
                disponibilidad.getHoraHasta() == null) {

            throw new RuntimeException(
                    "El artista no tiene un rango horario configurado para esta fecha"
            );
        }

        LocalTime horaFin =
                horaInicio.plusMinutes(paquete.getDuracionMinutos());

        if (horaInicio.isBefore(disponibilidad.getHoraDesde()) ||
                horaFin.isAfter(disponibilidad.getHoraHasta())) {

            throw new RuntimeException(
                    "El horario seleccionado está fuera de la disponibilidad del artista"
            );
        }

        /*
         * VALIDAR CRUCE CON OTRAS RESERVAS
         */
        var reservasDelDia =
                reservaRepository.findByArtistaIdAndFechaEvento(
                        artista.getId(),
                        request.getFechaEvento()
                );

        for (Reserva existente : reservasDelDia) {

            // Por compatibilidad con reservas antiguas sin hora
            if (existente.getHoraEvento() == null ||
                    existente.getDuracionMinutos() == null) {
                continue;
            }

            LocalTime inicioExistente =
                    existente.getHoraEvento();

            LocalTime finExistente =
                    inicioExistente.plusMinutes(
                            existente.getDuracionMinutos()
                    );

            boolean seCruzan =
                    horaInicio.isBefore(finExistente)
                            && horaFin.isAfter(inicioExistente);

            if (seCruzan) {
                throw new IllegalStateException(
                        "El artista ya tiene una reserva que se cruza con ese horario"
                );
            }
        }

        /*
         * PRECIOS
         */
        BigDecimal subtotal = paquete.getPrecio();

        BigDecimal comisionServicio =
                subtotal.multiply(COMISION);

        BigDecimal descuento = BigDecimal.ZERO;

        BigDecimal total =
                subtotal
                        .add(comisionServicio)
                        .subtract(descuento);

        /*
         * CREACIÓN DE LA RESERVA
         */
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

        /*
         * Snapshot del paquete al momento de reservar.
         */
        reserva.setNombrePaquete(paquete.getNombre());
        reserva.setDuracionMinutos(paquete.getDuracionMinutos());

        reserva.setSubtotal(subtotal);
        reserva.setComisionServicio(comisionServicio);
        reserva.setDescuento(descuento);
        reserva.setTotal(total);

        reserva.setMoneda(paquete.getMoneda());

        reserva.setEstado(EstadoReserva.PENDIENTE_PAGO);

        Reserva guardada =
                reservaRepository.save(reserva);

        /*
         * IMPORTANTE:
         *
         * Ya NO marcamos la disponibilidad completa como RESERVADO.
         *
         * El artista puede tener varias reservas dentro del mismo día,
         * siempre que los horarios no se crucen.
         */

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
                reserva.getHoraEvento(),

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

    @Transactional(readOnly = true)
    public List<ReservaResponse> buscarPorCorreo(String correo) {

        return reservaRepository
                .findByCorreoClienteIgnoreCaseOrderByFechaEventoDesc(correo)
                .stream()
                .map(this::toResponse)
                .toList();
    }
}