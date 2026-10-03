param(
    [string]$Archivo = (Join-Path $PSScriptRoot '../../backups/cloud-deployment/admin-mijahel.dpapi')
)
$ErrorActionPreference = 'Stop'
# Ejecutar manualmente con el mismo usuario Windows que realizó el despliegue.
# DPAPI protege el archivo local; nunca enviar su contenido al repositorio.
$secure = (Get-Content -LiteralPath $Archivo -Raw).Trim() | ConvertTo-SecureString
Set-Clipboard -Value ([Net.NetworkCredential]::new('', $secure).Password)
Remove-Variable secure
Write-Host 'Contraseña cloud de mijahel copiada. Pégala en Gestión y limpia el portapapeles después con Set-Clipboard -Value "".'
