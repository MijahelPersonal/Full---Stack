package com.mijahel.backend.repository;
import com.mijahel.backend.entity.Venta;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface VentaRepository extends JpaRepository<Venta,UUID>{
 Optional<Venta> findByClave(UUID clave);
 boolean existsByClienteId(UUID clienteId);
 List<Venta> findAllByOrderByFechaDesc();
}
