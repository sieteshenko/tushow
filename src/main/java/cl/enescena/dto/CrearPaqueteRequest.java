package cl.enescena.dto;

import java.math.BigDecimal;

public record CrearPaqueteRequest(
        String nombre,
        Integer duracionMinutos,
        BigDecimal precio,
        String biografia
) {
}