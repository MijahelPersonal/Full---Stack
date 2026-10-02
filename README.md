# Gestión: web y escritorio

Angular y Electron usan el mismo backend Spring Boot y PostgreSQL externos.
Electron no inicia ni instala Java, Spring Boot o PostgreSQL.

Desde `Frontend`, después de instalar dependencias con `npm install`:

| Comando | Resultado |
| --- | --- |
| `npm start` | Angular web en http://localhost:4200 |
| `npm run build` | Compilación web |
| `npm run electron:dev` | Inicia Angular y abre Electron; al cerrar Electron detiene Angular |
| `npm run build:desktop` | Angular optimizado en dist/desktop/browser |
| `npm run electron:start` | Abre la compilación desktop con app://gestion |
| `npm run electron:smoke:dev` | Comprueba login, preload y aislamiento en Electron desarrollo y cierra |
| `npm run electron:smoke` | Comprueba la compilación desktop y cierra |
| `npm run desktop:package` | Genera un instalador del frontend, sin backend ni base de datos |

El puerto 4200 debe estar libre para `electron:dev`. Spring Boot debe iniciarse
por separado como hasta ahora y estar disponible en http://localhost:8080.
La URL web predeterminada continúa en src/environments/environment.ts.
El build desktop utiliza environment.desktop.ts. Electron entrega su URL mediante
un IPC limitado, antes del arranque Angular. Para cambiarla en PowerShell:

```powershell
$env:GESTION_API_URL = 'http://localhost:8080/api'
npm run electron:dev
```

La URL no debe contener contraseñas. No colocar secretos PostgreSQL en Electron.
CORS mantiene http://localhost:4200 y permite app://gestion para desktop;
reiniciar el backend después del cambio de configuración de seguridad.
Las rutas Angular usan el protocolo local con fallback a index.html.
No se desactiva webSecurity ni se expone Node.js al renderer.
Las fuentes Google existentes siguen necesitando conexión a Internet.

Las comprobaciones smoke no crean usuarios ni modifican datos y no reemplazan
una prueba de login real con un backend disponible.
Para incluir el formulario de login y una consulta autenticada al dashboard en
una comprobación smoke, proporcionar temporalmente `GESTION_TEST_EMAIL` y
`GESTION_TEST_PASSWORD` en el entorno del proceso. Se requiere una cuenta
existente con acceso al dashboard. Las credenciales y el token no se imprimen;
la sesión de prueba se elimina al finalizar. No guardar estas variables en Git.
