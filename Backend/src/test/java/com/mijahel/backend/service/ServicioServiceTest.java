package com.mijahel.backend.service;

import com.mijahel.backend.entity.*;
import com.mijahel.backend.repository.HistorialServicioRepository;
import com.mijahel.backend.repository.ServicioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServicioServiceTest {

    @Mock
    private ServicioRepository servicioRepository;

    @Mock
    private HistorialServicioRepository historialRepository;

    @InjectMocks
    private ServicioService servicioService;

    @Test
    void noDebePermitirSaltarDePendienteAFinalizado() {
        UUID id = UUID.randomUUID();
        Servicio servicio = new Servicio();
        servicio.setEstado(EstadoServicio.PENDIENTE);

        when(servicioRepository.findById(id)).thenReturn(Optional.of(servicio));

        Usuario usuario = new Usuario();

        assertThrows(IllegalStateException.class, () ->
                servicioService.cambiarEstado(id, EstadoServicio.FINALIZADO, usuario, "intento inválido")
        );
    }

    @Test
    void debePermitirTransicionValida() {
        UUID id = UUID.randomUUID();
        Servicio servicio = new Servicio();
        servicio.setEstado(EstadoServicio.ASIGNADO);

        when(servicioRepository.findById(id)).thenReturn(Optional.of(servicio));
        when(servicioRepository.save(any())).thenReturn(servicio);

        Usuario usuario = new Usuario();

        Servicio resultado = servicioService.cambiarEstado(id, EstadoServicio.EN_RUTA, usuario, "en camino");

        assertEquals(EstadoServicio.EN_RUTA, resultado.getEstado());
        verify(historialRepository, times(1)).save(any());
    }
}
