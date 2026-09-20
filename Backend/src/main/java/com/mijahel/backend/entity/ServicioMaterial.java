package com.mijahel.backend.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "servicio_material")
public class ServicioMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "servicio_id", nullable = false)
    private Servicio servicio;

    @ManyToOne
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @JoinColumn(name = "cantidad_solicitada", nullable = false)
    private int cantidadSolicitada;

    @JoinColumn(name = "cantidad_utilizada", nullable = false)
    private int cantidadUtilizada = 0;

    public UUID getId() {
        return id;
    }

    public Servicio getServicio() {
        return servicio;
    }

    public void setServicio(Servicio servicio) {
        this.servicio = servicio;
    }

    public Material getMaterial() {
        return material;
    }

    public void setMaterial(Material material) {
        this.material = material;
    }

    public int getCantidadSolicitada() {
        return cantidadSolicitada;
    }

    public void setCantidadSolicitada(int cantidadSolicitada) {
        this.cantidadSolicitada = cantidadSolicitada;
    }

    public int getCantidadUtilizada() {
        return cantidadUtilizada;
    }

    public void setCantidadUtilizada(int cantidadUtilizada) {
        this.cantidadUtilizada = cantidadUtilizada;
    }
}
