package cl.enescena.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class PaqueteShowResponse {

    private Long id;
    private String nombre;
    private Integer duracionMinutos;
    private BigDecimal precio;
    private String moneda;
}