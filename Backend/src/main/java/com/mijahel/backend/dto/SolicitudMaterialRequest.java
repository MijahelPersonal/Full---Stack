package com.mijahel.backend.dto;

import java.util.UUID;

public class SolicitudMaterialRequest {
    private UUID materialId;
    private int cantidadSolicitada;

    public UUID getMaterialId() { return materialId; }
    public void setMaterialId(UUID materialId) { this.materialId = materialId; }
    public int getCantidadSolicitada() { return cantidadSolicitada; }
    public void setCantidadSolicitada(int cantidadSolicitada) { this.cantidadSolicitada = cantidadSolicitada; }
}