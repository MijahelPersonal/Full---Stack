package com.mijahel.backend.repository;

import com.mijahel.backend.entity.ServicioMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ServicioMaterialRepository extends JpaRepository<ServicioMaterial, UUID> {
    List<ServicioMaterial> findByServicioId(UUID servicioId);
}