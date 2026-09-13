package cl.enescena.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "disponibilidad_artista")
@Getter
@Setter
public class DisponibilidadArtista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artista_id", nullable = false)
    private Artista artista;

    @Column(name = "fecha_disponible", nullable = false)
    private LocalDate fechaDisponible;

    @Enumerated(EnumType.STRING)
    private EstadoDisponibilidad estado;

    private String observaciones;

    @Column(name = "hora_desde")
    private LocalTime horaDesde;

    @Column(name = "hora_hasta")
    private LocalTime horaHasta;
}