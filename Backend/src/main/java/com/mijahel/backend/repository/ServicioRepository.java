package com.mijahel.backend.repository;
import com.mijahel.backend.entity.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ServicioRepository extends JpaRepository<Servicio, UUID> {
}
