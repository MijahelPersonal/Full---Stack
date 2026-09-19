package com.mijahel.backend.repository;
import com.mijahel.backend.entity.HistorialServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface HistorialServicioRepository extends JpaRepository<HistorialServicio, UUID> {
}
