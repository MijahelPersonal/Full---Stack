package com.mijahel.backend.controller;

import com.mijahel.backend.entity.Material;
import com.mijahel.backend.repository.MaterialRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materiales")
public class MaterialController {
    private final MaterialRepository materialRepository;

    public MaterialController(MaterialRepository materialRepository){
        this.materialRepository = materialRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR', 'TECNICO')")
    public List<Material> listar(){
        return materialRepository.findAll();
    }
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public Material crear(@RequestBody Material material){
        return materialRepository.save(material);
    }
    @GetMapping("/stock_bajo")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    public List<Material> stockBajo(){
        return materialRepository.findAll().stream()
                .filter(m ->m.getStockActual() <= m.getStockMinimo())
                .toList();
    }
}
