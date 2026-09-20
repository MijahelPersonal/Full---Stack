package com.mijahel.backend.repository;

import com.mijahel.backend.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaterialRepository extends JpaRepository<Material, UUID> {
    List<Material> findByStockActualLessThanEqual(int stockMinimo);
}
