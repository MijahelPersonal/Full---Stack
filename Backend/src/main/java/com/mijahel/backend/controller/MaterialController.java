package com.mijahel.backend.controller;

import com.mijahel.backend.entity.Material;
import com.mijahel.backend.repository.MaterialRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public Material actualizar(@PathVariable UUID id, @RequestBody Material datos) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));
        material.setNombre(datos.getNombre());
        material.setCategoria(datos.getCategoria());
        material.setUnidadMedida(datos.getUnidadMedida());
        material.setStockActual(datos.getStockActual());
        material.setStockMinimo(datos.getStockMinimo());
        return materialRepository.save(material);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public void eliminar(@PathVariable UUID id) {
        materialRepository.deleteById(id);
    }

    @GetMapping("/stock_bajo")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    public List<Material> stockBajo(){
        return materialRepository.findAll().stream()
                .filter(m -> m.getStockActual() <= m.getStockMinimo())
                .toList();
    }
}
