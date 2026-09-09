package cl.enescena.dto;

import java.math.BigDecimal;

public record CrearPaqueteRequest(
        String nombre,
        String descripcion,
        Integer duracionMinutos,
        BigDecimal precio
) {
}