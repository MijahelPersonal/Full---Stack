# Cómo publicar una nueva versión de SistemaGestión

## Qué se actualiza

Angular y Electron se distribuyen juntos en el instalador Windows. Spring Boot se actualiza con un deployment de Railway y STRUCH con un deployment de Vercel; son procesos independientes.

La versión única de escritorio es `version` en `Frontend/package.json`, sincronizada con `package-lock.json` mediante npm. La interfaz consulta `app.getVersion()` por IPC. No se escribe la versión en las pantallas.

## Situación de la publicación actual

La publicación `v0.1.0-demo`, titulada **STRUCH v0.1.0 Demo**, se utiliza como base 0.1.0 del updater. Se conserva el tag y se publica en el canal estable, con el nuevo Setup, `latest.yml` y su blockmap. El nombre «Demo» identifica el alcance del proyecto; no es una prerelease del canal de actualizaciones.

El instalador anterior no incorporaba electron-updater y su metadata era 0.0.0. Si ya lo tenías instalado, ejecuta manualmente una vez el nuevo Setup 0.1.0 de Assets. Añadir metadatos a GitHub no actualiza por sí solo ese binario antiguo. Se conserva el mismo appId `com.mijahel.gestion` y ejecutable `SistemaGestion`; no es necesario desinstalarlo primero.

La base instalada 0.1.0 consulta el canal estable y muestra «Tienes la última versión» mientras no publiques una superior. Los errores de conexión no bloquean Gestión ni abren alertas automáticamente. Conserva una copia local del instalador anterior antes de reemplazar assets de una publicación existente. No muevas el tag histórico: los assets actualizados corresponden al commit de cierre de `feature/tienda-web`, indicado en las notas de la Release.

## Publicar tu siguiente versión, por ejemplo 0.2.0

Desde PowerShell, entra en `Frontend`:

```powershell
cd Frontend
npm test -- --watch=false
npm run test:electron
npm run build
npm version 0.2.0 --no-git-tag-version
```

Revisa y guarda tus cambios de código con Git cuando estén aprobados. `npm version` anterior actualiza ambos JSON sin crear commit ni tag.

Para generar el instalador con el API de producción:

```powershell
$env:GESTION_API_URL = 'https://TU-DOMINIO-PUBLICO/api'
npm run desktop:package
Remove-Item Env:GESTION_API_URL
```

Utiliza el dominio definitivo documentado en `DEPLOYMENT-RESULTADO.md`. Es configuración pública del API, nunca una contraseña. El script prepara la configuración, compila Angular desktop y ejecuta electron-builder con `--publish never` para impedir publicaciones involuntarias.

Verifica que existan los tres archivos de la misma compilación:

- `release/SistemaGestion-Setup.exe`
- `release/SistemaGestion-Setup.exe.blockmap`
- `release/latest.yml`

No edites `latest.yml`: contiene versión, tamaño y SHA-512 del instalador. No mezcles assets de builds distintos. `app-update.yml` queda dentro de los recursos de la aplicación; no se sube por separado.

Crea una Release **estable**, no prerelease, con tag `v0.2.0` apuntando al commit correcto. Desde la raíz del repositorio, con GitHub CLI autenticado:

```powershell
gh release create v0.2.0 --repo MijahelPersonal/Full---Stack --target feature/tienda-web --title 'SistemaGestión v0.2.0' --notes 'Mejoras de diseño y correcciones.' --draft
gh release upload v0.2.0 Frontend/release/SistemaGestion-Setup.exe Frontend/release/SistemaGestion-Setup.exe.blockmap Frontend/release/latest.yml --repo MijahelPersonal/Full---Stack
gh release edit v0.2.0 --repo MijahelPersonal/Full---Stack --draft=false
```

Antes de publicar, confirma que la rama remota contiene tu commit; puedes usar su hash exacto en `--target` en lugar de la rama. Los binarios van exclusivamente a Assets, nunca al historial Git. La configuración GitHub está en `electron-builder.yml`; la aplicación no requiere token GitHub.

## Primera prueba real

1. Instala manualmente el nuevo Setup base 0.1.0, sin desinstalar la aplicación anterior.
2. Haz tu cambio en Angular y publica 0.2.0 con los tres assets anteriores.
3. Abre la base 0.1.0: a los pocos segundos consulta GitHub. También puedes usar **Acerca de → Buscar actualizaciones**.
4. Verifica «Nueva actualización disponible», versión instalada y nueva versión.
5. Pulsa **Descargar actualización**; espera porcentaje y estado listo.
6. Guarda tu trabajo y pulsa **Reiniciar y actualizar**.
7. Comprueba versión 0.2.0 en Acerca de y tu cambio visual.

«Más tarde» oculta el aviso; la actualización sigue accesible desde Acerca de. Cerrar Gestión normalmente no instala lo descargado. No se permiten downgrades ni prereleases. En desarrollo y smoke el updater está desactivado y no contacta GitHub.

El instalador de esta demo no tiene firma digital. electron-updater verifica el checksum de descarga, pero eso no reemplaza una firma de código. Para distribución comercial, configura un certificado de firma siguiendo la documentación de electron-builder; no desactives protecciones de Windows.

## Identidad y colores

- Icono: `build/icon.ico`, con tamaños 16–256 px; reutiliza la G azul existente. `build/icon.png` es la fuente visual. Configuración de ejecutable, instalador, desinstalador y accesos directos en `electron-builder.yml`.
- `appId` debe permanecer estable en futuras versiones para conservar identidad de instalación.
- Colores: tokens `--color-primary`, `--color-sidebar`, `--color-background`, `--color-text`, `--color-accent` al final de `src/styles.scss`. Los tokens existentes `--accent`, `--bg` y `--text` los referencian. No se ha rediseñado el dashboard ni migrado todos sus estilos.
- Login: `src/app/features/login/`. Navegación: `src/app/core/layout/`. Nombre comercial mostrado en login y Acerca de; metadata Windows en el builder.

Documentación oficial: https://www.electron.build/v26/docs/features/auto-update/
