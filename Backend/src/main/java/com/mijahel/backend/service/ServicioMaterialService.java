package com.mijahel.backend.service;
import com.mijahel.backend.entity.*;
import com.mijahel.backend.entity.ServicioMaterial;
import com.mijahel.backend.repository.MaterialRepository;
import com.mijahel.backend.repository.ServicioMaterialRepository;
import com.mijahel.backend.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.UUID;
@Service
public class ServicioMaterialService {

    private final ServicioRepository servicioRepository;
    private final MaterialRepository materialRepository;
    private final ServicioMaterialRepository servicioMaterialRepository;

    public ServicioMaterialService(ServicioRepository servicioRepository,
                                   MaterialRepository materialRepository,
                                   ServicioMaterialRepository servicioMaterialRepository){
        this.servicioRepository = servicioRepository;
        this.materialRepository = materialRepository;
        this.servicioMaterialRepository = servicioMaterialRepository;
    }
    // Un técnico/supervisor SOLICITA materiales para un servicio (aún no descuenta stock)
    @Transactional
    public ServicioMaterial solicitarMaterial(UUID servicioId, UUID materialId, int cantidadSolicitada){
        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RuntimeException("servicio no entrado"));
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("material no encontrado"));
        if (material.getStockActual() < cantidadSolicitada){
            throw new IllegalStateException(
                    "stock insuficiente. Disponible: " + material.getStockActual() + ", solicitado: " +cantidadSolicitada
            );
        }
        ServicioMaterial sm = new ServicioMaterial();
        sm.setServicio(servicio);
        sm.setMaterial(material);
        sm.setCantidadSolicitada(cantidadSolicitada);

        return servicioMaterialRepository.save(sm);
    }
    // El técnico CONFIRMA el uso real del material → aquí sí se descuenta el stock

    @Transactional
    public ServicioMaterial registrarConsumo(UUID servicioMaterialId, int cantidadUtilizada){
        ServicioMaterial sm = servicioMaterialRepository.findById(servicioMaterialId)
                .orElseThrow(()-> new RuntimeException("registro de material no encontrado"));

        Material material = sm.getMaterial();

        if (material.getStockActual() < cantidadUtilizada){
            throw new IllegalStateException(
                    "stock insuficiente para confirmar consumo. Disponible: " + material.getStockActual()
            );
        }
        material.setStockActual(material.getStockActual() - cantidadUtilizada);
        materialRepository.save(material);
        sm.setCantidadUtilizada(cantidadUtilizada);
        servicioMaterialRepository.save(sm);
        return sm;
    }
}
