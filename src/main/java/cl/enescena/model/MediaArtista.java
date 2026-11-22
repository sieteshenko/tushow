package cl.enescena.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/** Foto o video de la galería de un artista. El archivo vive en app.media.dir. */
@Entity
@Table(name = "media_artista")
@Getter
@Setter
public class MediaArtista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artista_id", nullable = false)
    private Artista artista;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMedia tipo;

    @Column(nullable = false, unique = true, length = 64)
    private String archivo;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "tamano_bytes", nullable = false)
    private Long tamanoBytes;

    @Column(nullable = false)
    private Integer orden;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;
}
