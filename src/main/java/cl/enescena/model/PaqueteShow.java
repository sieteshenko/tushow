package cl.enescena.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "paquetes_show")
@Getter
@Setter
public class PaqueteShow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artista_id", nullable = false)
    private Artista artista;

    private String nombre;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "duracion_minutos")
    private Integer duracionMinutos;

    private BigDecimal precio;

    private String moneda;

    private Boolean activo;

    private Integer orden;
}