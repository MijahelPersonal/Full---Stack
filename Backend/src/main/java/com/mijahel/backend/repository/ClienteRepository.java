package com.mijahel.backend.repository;
import com.mijahel.backend.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ClienteRepository extends JpaRepository<Cliente, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Cliente c where c.id=:id")
    java.util.Optional<Cliente> bloquear(@org.springframework.data.repository.query.Param("id") UUID id);
    java.util.List<Cliente> findByActivoTrue();
}
