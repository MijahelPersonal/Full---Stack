package com.mijahel.backend.repository;
import com.mijahel.backend.entity.DetallePedido;import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface DetallePedidoRepository extends JpaRepository<DetallePedido,UUID>{List<DetallePedido> findByPedidoId(UUID pedidoId);}
