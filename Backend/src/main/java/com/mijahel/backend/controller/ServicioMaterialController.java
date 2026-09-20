package com.mijahel.backend.controller;

import com.mijahel.backend.dto.SolicitudMaterialRequest;
import com.mijahel.backend.entity.ServicioMaterial;
import com.mijahel.backend.service.ServicioMaterialService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("api/servicios/{servicioId}/materiales")
public class ServicioMaterialController {
    private final ServicioMaterialService servicioMaterialService;

    public ServicioMaterialController( ServicioMaterialService servicioMaterialService){
        this.servicioMaterialService = servicioMaterialService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'TECNICO')")
    public ServicioMaterial solicitar(@PathVariable UUID servicioId,
                                      @RequestBody SolicitudMaterialRequest request){
        return servicioMaterialService.solicitarMaterial(
                servicioId, request.getMaterialId(), request.getCantidadSolicitada()
        );
    }@PutMapping("/{servicioMaterialId}/consumir")
    @PreAuthorize("hasRole('TECNICO')")
    public ServicioMaterial confirmarConsumo(@PathVariable UUID servicioMaterialId,
                                             @RequestParam int cantidadUtilizada){
        return servicioMaterialService.registrarConsumo(servicioMaterialId, cantidadUtilizada);
    }

}
