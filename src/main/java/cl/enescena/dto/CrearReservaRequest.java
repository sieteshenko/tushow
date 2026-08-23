package cl.enescena.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CrearReservaRequest {

    private Long artistaId;
    private Long paqueteShowId;

    private LocalDate fechaEvento;
    private LocalTime horaEvento;

    private String nombreCliente;
    private String correoCliente;
    private String telefonoCliente;

    private String direccionEvento;
    private String comunaEvento;
    private String regionEvento;

    private Integer cantidadInvitados;

    private String mensajeCliente;
}