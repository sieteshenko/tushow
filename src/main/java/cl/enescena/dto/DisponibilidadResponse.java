package cl.enescena.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record DisponibilidadResponse(
        LocalDate fecha,
        LocalTime horaDesde,
        LocalTime horaHasta
) {
}