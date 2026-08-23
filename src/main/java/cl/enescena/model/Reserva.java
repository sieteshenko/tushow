package cl.enescena.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservas")
@Getter
@Setter
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String folio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artista_id", nullable = false)
    private Artista artista;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paquete_show_id", nullable = false)
    private PaqueteShow paqueteShow;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disponibilidad_id")
    private DisponibilidadArtista disponibilidad;

    @Column(name = "nombre_cliente")
    private String nombreCliente;

    @Column(name = "correo_cliente")
    private String correoCliente;

    @Column(name = "telefono_cliente")
    private String telefonoCliente;

    @Column(name = "fecha_evento")
    private LocalDate fechaEvento;

    @Column(name = "hora_evento")
    private LocalTime horaEvento;

    @Column(name = "direccion_evento")
    private String direccionEvento;

    @Column(name = "comuna_evento")
    private String comunaEvento;

    @Column(name = "region_evento")
    private String regionEvento;

    @Column(name = "cantidad_invitados")
    private Integer cantidadInvitados;

    @Column(name = "mensaje_cliente")
    private String mensajeCliente;

    @Column(name = "nombre_paquete")
    private String nombrePaquete;

    @Column(name = "duracion_minutos")
    private Integer duracionMinutos;

    private BigDecimal subtotal;

    @Column(name = "comision_servicio")
    private BigDecimal comisionServicio;

    private BigDecimal descuento;

    private BigDecimal total;

    private String moneda;

    @Enumerated(EnumType.STRING)
    private EstadoReserva estado;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;
}