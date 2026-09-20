package com.mijahel.backend.controller;

import com.mijahel.backend.entity.EstadoServicio;
import com.mijahel.backend.repository.MaterialRepository;
import com.mijahel.backend.repository.ServicioRepository;
import com.mijahel.backend.repository.TecnicoRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ServicioRepository servicioRepository;
    private final TecnicoRepository tecnicoRepository;
    private final MaterialRepository materialRepository;

    public DashboardController(ServicioRepository servicioRepository,
                               TecnicoRepository tecnicoRepository,
                               MaterialRepository materialRepository) {
        this.servicioRepository = servicioRepository;
        this.tecnicoRepository = tecnicoRepository;
        this.materialRepository = materialRepository;
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    public Map<String, Object> resumen() {
        Map<String, Object> data = new HashMap<>();

        var servicios = servicioRepository.findAll();

        data.put("pendientes", servicios.stream().filter(s -> s.getEstado() == EstadoServicio.PENDIENTE).count());
        data.put("enRuta", servicios.stream().filter(s -> s.getEstado() == EstadoServicio.EN_RUTA).count());
        data.put("enServicio", servicios.stream().filter(s -> s.getEstado() == EstadoServicio.EN_SERVICIO).count());
        data.put("finalizados", servicios.stream().filter(s -> s.getEstado() == EstadoServicio.FINALIZADO).count());
        data.put("totalServicios", servicios.size());
        data.put("tecnicosActivos", tecnicoRepository.findAll().stream()
                .filter(t -> t.getEstadoDisponibilidad() != null &&
                        t.getEstadoDisponibilidad().name().equals("DISPONIBLE"))
                .count());
        data.put("materialesStockBajo", materialRepository.findAll().stream()
                .filter(m -> m.getStockActual() <= m.getStockMinimo())
                .count());

        return data;
    }
}