package com.mijahel.backend.repository;
import com.mijahel.backend.entity.Pedido;import org.springframework.data.jpa.repository.*;import java.util.*;
public interface PedidoRepository extends JpaRepository<Pedido,UUID>{
 Optional<Pedido> findByCuentaIdAndClave(UUID cuentaId,UUID clave);Optional<Pedido> findByIdAndCuentaId(UUID id,UUID cuentaId);
 Optional<Pedido> findByCodigoRecojo(String codigo);boolean existsByCodigoRecojo(String codigo);boolean existsByClienteId(UUID clienteId);
 List<Pedido> findAllByOrderByFechaCreacionDesc();List<Pedido> findByCuentaIdOrderByFechaCreacionDesc(UUID cuentaId);
 @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE) @Query("select p from Pedido p where p.id=:id") Optional<Pedido> bloquear(@org.springframework.data.repository.query.Param("id") UUID id);
}
