package com.mijahel.backend.repository;
import com.mijahel.backend.entity.CuentaCliente;import org.springframework.data.jpa.repository.*;import java.util.*;
public interface CuentaClienteRepository extends JpaRepository<CuentaCliente,UUID>{
 Optional<CuentaCliente> findByEmail(String email);boolean existsByClienteId(UUID id);
 @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE) @Query("select c from CuentaCliente c where c.id=:id") Optional<CuentaCliente> bloquear(@org.springframework.data.repository.query.Param("id") UUID id);
}
