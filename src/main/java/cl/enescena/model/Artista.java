package cl.enescena.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "artistas")
@Getter
@Setter
public class Artista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_artistico", nullable = false)
    private String nombreArtistico;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String biografia;

    private String region;

    private String comuna;

    private String icono;

    @Column(name = "url_imagen_perfil")
    private String urlImagenPerfil;

    private Boolean destacado;

    @Column(name = "destacado_hasta")
    private LocalDateTime destacadoHasta;

    @Column(name = "shows_realizados")
    private Integer showsRealizados;

    @Enumerated(EnumType.STRING)
    private EstadoArtista estado;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(
            name = "fecha_actualizacion",
            insertable = false,
            updatable = false
    )
    private LocalDateTime fechaActualizacion;

    @OneToMany(mappedBy = "artista", fetch = FetchType.LAZY)
    private List<PaqueteShow> paquetes;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "artista_categoria",
            joinColumns = @JoinColumn(name = "artista_id"),
            inverseJoinColumns = @JoinColumn(name = "categoria_id")
    )
    private List<Categoria> categorias;

    @OneToMany(mappedBy = "artista", fetch = FetchType.LAZY)
    private List<DisponibilidadArtista> disponibilidades;
}