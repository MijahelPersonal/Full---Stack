package com.mijahel.backend.repository;
import com.mijahel.backend.entity.Producto;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface ProductoRepository extends JpaRepository<Producto,UUID>, JpaSpecificationExecutor<Producto>{
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select p from Producto p where p.id=:id")
 Optional<Producto> bloquear(@Param("id") UUID id);
 List<Producto> findAllByOrderByNombreAsc();
 Optional<Producto> findBySlugAndActivoTrue(String slug);
 @Query("select distinct p.categoria from Producto p where p.activo=true order by p.categoria")
 List<String> categoriasPublicas();
 @Query("select distinct p.marca from Producto p where p.activo=true order by p.marca")
 List<String> marcasPublicas();
}
