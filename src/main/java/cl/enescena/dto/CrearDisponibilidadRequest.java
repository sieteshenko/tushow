package cl.enescena.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record CrearDisponibilidadRequest(
        LocalDate fecha,
        LocalTime horaDesde,
        LocalTime horaHasta
) {
}