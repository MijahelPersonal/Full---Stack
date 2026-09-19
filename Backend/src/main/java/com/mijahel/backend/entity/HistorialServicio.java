package com.mijahel.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "historial_servicio")
public class HistorialServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "servicio_id", nullable = false)
    private Servicio servicio;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior")
    private EstadoServicio estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo")
    private EstadoServicio estadoNuevo;

    private String observacion;

    private LocalDateTime fecha = LocalDateTime.now();

    // getters y setters
    public UUID getId() { return id; }
    public Servicio getServicio() { return servicio; }
    public void setServicio(Servicio servicio) { this.servicio = servicio; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public EstadoServicio getEstadoAnterior() { return estadoAnterior; }
    public void setEstadoAnterior(EstadoServicio e) { this.estadoAnterior = e; }
    public EstadoServicio getEstadoNuevo() { return estadoNuevo; }
    public void setEstadoNuevo(EstadoServicio e) { this.estadoNuevo = e; }
    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
    public LocalDateTime getFecha() { return fecha; }
}
