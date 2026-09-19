package com.mijahel.backend.repository;

import com.mijahel.backend.entity.Tecnico;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TecnicoRepository extends JpaRepository<Tecnico, UUID> {}