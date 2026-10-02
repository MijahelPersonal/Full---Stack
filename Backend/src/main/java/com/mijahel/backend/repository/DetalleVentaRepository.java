package com.mijahel.backend.repository;
import com.mijahel.backend.entity.DetalleVenta;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface DetalleVentaRepository extends JpaRepository<DetalleVenta,UUID>{
 List<DetalleVenta> findByVentaId(UUID ventaId);
}
