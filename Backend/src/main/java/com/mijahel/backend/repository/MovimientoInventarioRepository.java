package com.mijahel.backend.repository;
import com.mijahel.backend.entity.MovimientoInventario;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario,UUID>{
 List<MovimientoInventario> findAllByOrderByFechaDesc();
}
