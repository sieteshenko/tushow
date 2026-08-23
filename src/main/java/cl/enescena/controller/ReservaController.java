package cl.enescena.controller;

import cl.enescena.dto.CrearReservaRequest;
import cl.enescena.dto.ReservaResponse;
import cl.enescena.service.ReservaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservaResponse crear(
            @RequestBody CrearReservaRequest request) {

        return reservaService.crear(request);
    }
}