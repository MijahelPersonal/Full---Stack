package com.mijahel.backend.service;

import com.mijahel.backend.entity.*;
import com.mijahel.backend.repository.ClienteRepository;
import com.mijahel.backend.repository.HistorialServicioRepository;
import com.mijahel.backend.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;
    private final HistorialServicioRepository historialRepository;
    private final ClienteRepository clienteRepository;

    public ServicioService(ServicioRepository servicioRepository,
                           HistorialServicioRepository historialRepository,
                           ClienteRepository clienteRepository) {
        this.servicioRepository = servicioRepository;
        this.historialRepository = historialRepository;
        this.clienteRepository = clienteRepository;
    }

    public Servicio crear(Servicio servicio) {
        Cliente cliente = clienteRepository.findById(servicio.getCliente().getId())
                        .orElseThrow(() -> new RuntimeException("cliente no encontrado"));
        servicio.setCliente(cliente);
        servicio.setEstado(EstadoServicio.PENDIENTE);
        return servicioRepository.save(servicio);
    }

    @Transactional
    public Servicio asignarTecnico(UUID servicioId, Tecnico tecnico, Usuario usuarioQueAsigna) {
        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));

        EstadoServicio estadoAnterior = servicio.getEstado();
        servicio.setTecnico(tecnico);
        servicio.setEstado(EstadoServicio.ASIGNADO);
        servicioRepository.save(servicio);

        registrarHistorial(servicio, usuarioQueAsigna, estadoAnterior,
                EstadoServicio.ASIGNADO, "Técnico asignado: " + tecnico.getUsuario().getNombre());

        return servicio;
    }

    @Transactional
    public Servicio cambiarEstado(UUID servicioId, EstadoServicio nuevoEstado,
                                  Usuario usuarioQueCambia, String observacion) {
        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));

        validarTransicion(servicio.getEstado(), nuevoEstado);

        EstadoServicio estadoAnterior = servicio.getEstado();
        servicio.setEstado(nuevoEstado);
        servicioRepository.save(servicio);

        registrarHistorial(servicio, usuarioQueCambia, estadoAnterior, nuevoEstado, observacion);

        return servicio;
    }

    private void validarTransicion(EstadoServicio actual, EstadoServicio nuevo) {
        boolean valido = switch (actual) {
            case PENDIENTE -> nuevo == EstadoServicio.ASIGNADO;
            case ASIGNADO -> nuevo == EstadoServicio.EN_RUTA;
            case EN_RUTA -> nuevo == EstadoServicio.EN_SERVICIO;
            case EN_SERVICIO -> nuevo == EstadoServicio.FINALIZADO;
            case FINALIZADO -> false;
        };
        if (!valido) {
            throw new IllegalStateException(
                    "Transición inválida: no se puede pasar de " + actual + " a " + nuevo);
        }
    }

    private void registrarHistorial(Servicio servicio, Usuario usuario,
                                    EstadoServicio anterior, EstadoServicio nuevo, String observacion) {
        HistorialServicio historial = new HistorialServicio();
        historial.setServicio(servicio);
        historial.setUsuario(usuario);
        historial.setEstadoAnterior(anterior);
        historial.setEstadoNuevo(nuevo);
        historial.setObservacion(observacion);
        historialRepository.save(historial);
    }
}