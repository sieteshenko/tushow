package cl.enescena.service;

import cl.enescena.model.TipoMedia;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Guarda fotos y videos en disco con nombres aleatorios.
 * El tipo se decide por el contenido del archivo, nunca por su nombre ni por lo que declara el navegador.
 */
@Component
public class MediaStorage {

    public static final long MAX_IMAGEN = 8L * 1024 * 1024;
    public static final long MAX_VIDEO = 50L * 1024 * 1024;

    private static final Pattern NOMBRE_VALIDO =
            Pattern.compile("[0-9a-f]{32}\\.(jpg|png|webp|mp4|mov|webm)");

    // Marcas ISO-BMFF que corresponden a video (excluye HEIC/AVIF, que usan el mismo contenedor).
    private static final Set<String> MARCAS_VIDEO = Set.of(
            "isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42",
            "avc1", "M4V ", "mmp4", "dash", "qt  "
    );

    public record Archivo(String nombre, String contentType, TipoMedia tipo, long tamano) {
    }

    private record Formato(String extension, String contentType, TipoMedia tipo) {
    }

    private final Path directorio;

    public MediaStorage(@Value("${app.media.dir:uploads}") String directorio) throws IOException {
        this.directorio = Path.of(directorio).toAbsolutePath().normalize();
        Files.createDirectories(this.directorio);
        LoggerFactory.getLogger(MediaStorage.class)
                .info("Fotos y videos de artistas en: {}", this.directorio);
    }

    public Archivo guardar(MultipartFile archivo, boolean soloImagen, String etiqueta) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException(etiqueta + " está vacío");
        }

        Formato formato = detectar(archivo);
        if (formato == null || (soloImagen && formato.tipo() != TipoMedia.IMAGEN)) {
            throw new IllegalArgumentException(etiqueta + (soloImagen
                    ? " debe ser una imagen JPG, PNG o WebP"
                    : " debe ser una imagen JPG, PNG o WebP, o un video MP4, MOV o WebM"));
        }

        long limite = formato.tipo() == TipoMedia.IMAGEN ? MAX_IMAGEN : MAX_VIDEO;
        if (archivo.getSize() > limite) {
            throw new IllegalArgumentException(etiqueta + " supera el máximo de "
                    + (limite / 1024 / 1024) + " MB");
        }

        String nombre = UUID.randomUUID().toString().replace("-", "") + "." + formato.extension();
        Path destino = directorio.resolve(nombre);
        try (InputStream entrada = archivo.getInputStream()) {
            Files.copy(entrada, destino);
        } catch (IOException e) {
            borrar(nombre);
            throw new UncheckedIOException("No se pudo guardar " + etiqueta.toLowerCase(), e);
        }

        return new Archivo(nombre, formato.contentType(), formato.tipo(), archivo.getSize());
    }

    /** Ruta del archivo si el nombre tiene el formato generado por este servicio y existe. */
    public Optional<Path> ubicar(String nombre) {
        if (nombre == null || !NOMBRE_VALIDO.matcher(nombre).matches()) {
            return Optional.empty();
        }
        Path ruta = directorio.resolve(nombre);
        return Files.isRegularFile(ruta) ? Optional.of(ruta) : Optional.empty();
    }

    public String contentType(String nombre) {
        String extension = nombre.substring(nombre.lastIndexOf('.') + 1);
        return switch (extension) {
            case "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            case "mp4" -> "video/mp4";
            case "mov" -> "video/quicktime";
            case "webm" -> "video/webm";
            default -> "application/octet-stream";
        };
    }

    public void borrar(String nombre) {
        if (nombre == null || !NOMBRE_VALIDO.matcher(nombre).matches()) {
            return;
        }
        try {
            Files.deleteIfExists(directorio.resolve(nombre));
        } catch (IOException ignored) {
            // Queda un archivo huérfano; no impide responder al usuario.
        }
    }

    private Formato detectar(MultipartFile archivo) {
        byte[] b;
        try (InputStream entrada = archivo.getInputStream()) {
            b = entrada.readNBytes(16);
        } catch (IOException e) {
            return null;
        }
        if (b.length < 12) {
            return null;
        }

        if (u(b[0]) == 0xFF && u(b[1]) == 0xD8 && u(b[2]) == 0xFF) {
            return new Formato("jpg", "image/jpeg", TipoMedia.IMAGEN);
        }
        if (Arrays.equals(Arrays.copyOf(b, 8),
                new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) {
            return new Formato("png", "image/png", TipoMedia.IMAGEN);
        }
        if (texto(b, 0).equals("RIFF") && texto(b, 8).equals("WEBP")) {
            return new Formato("webp", "image/webp", TipoMedia.IMAGEN);
        }
        if (u(b[0]) == 0x1A && u(b[1]) == 0x45 && u(b[2]) == 0xDF && u(b[3]) == 0xA3) {
            return new Formato("webm", "video/webm", TipoMedia.VIDEO);
        }
        if (texto(b, 4).equals("ftyp")) {
            String marca = texto(b, 8);
            if (marca.equals("qt  ")) {
                return new Formato("mov", "video/quicktime", TipoMedia.VIDEO);
            }
            if (MARCAS_VIDEO.contains(marca)) {
                return new Formato("mp4", "video/mp4", TipoMedia.VIDEO);
            }
        }
        return null;
    }

    private static int u(byte valor) {
        return valor & 0xFF;
    }

    private static String texto(byte[] bytes, int desde) {
        return new String(bytes, desde, 4, StandardCharsets.ISO_8859_1);
    }
}
