package com.mijahel.backend.repository;
import com.mijahel.backend.entity.Producto;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface ProductoRepository extends JpaRepository<Producto,UUID>{
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select p from Producto p where p.id=:id")
 Optional<Producto> bloquear(@Param("id") UUID id);
 List<Producto> findAllByOrderByNombreAsc();
}
