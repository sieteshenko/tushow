package cl.enescena.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class ReservaResponse {

    private Long id;
    private String folio;

    private String artista;
    private String paquete;

    private LocalDate fechaEvento;
    private LocalTime horaEvento;

    private String nombreCliente;
    private String correoCliente;

    private BigDecimal subtotal;
    private BigDecimal comisionServicio;
    private BigDecimal descuento;
    private BigDecimal total;

    private String moneda;
    private String estado;
}