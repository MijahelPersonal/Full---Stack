# Seeder explícito del catálogo DEMO

Herramienta de desarrollo/portafolio independiente de Astro y del arranque de Spring Boot. `catalogo.json` es un manifiesto de importación, no un catálogo alternativo del frontend. Las imágenes genéricas y las especificaciones DEMO no identifican modelos reales de fabricantes.

Requisitos: Python 3.11+, backend habitual local en 8080, credenciales de Administrador y un respaldo PostgreSQL custom previo de gestor_db. No necesita instalar paquetes Python ni dependencias nuevas del proyecto.

1. Hacer backup de gestor_db con pg_dump -Fc y verificarlo con pg_restore --list. Conservar también uploads/productos.
2. Configurar DEMO_USERNAME y DEMO_PASSWORD solo en el entorno del proceso.
3. Revisar antes de escribir:

```powershell
python Web/tools/demo/cargar_catalogo.py --backup backups/2026-10-03-catalogo-demo/gestor_db.dump
```

4. Cargar explícitamente:

```powershell
python Web/tools/demo/cargar_catalogo.py --apply --verify-initial --backup backups/2026-10-03-catalogo-demo/gestor_db.dump
```

Retirar las variables de credenciales al terminar. No incluirlas en commits, archivos o informes.

La herramienta usa los endpoints existentes: producto multipart con imagen (stockInicial=0), entrada de inventario con motivo Stock inicial catálogo demo, catálogo público y consultas internas de validación. No usa INSERT SQL, no modifica categorías del frontend, no borra productos y no actualiza SKU ya existentes. Dos productos de stock cero no generan movimientos de cantidad cero.

El diario local `.state/diario.json` guarda IDs/fases para reanudar respuestas perdidas y comprobar el movimiento antes de repetir una entrada. No guarda contraseñas ni JWT. Tras completarse, reejecutar no repone stock consumido ni vuelve a cargar imágenes. Usar `--verify-initial` solo inmediatamente después de importar: ventas posteriores legítimas pueden cambiar el stock.

No ejecutar dos importaciones a la vez. Si una interrupción forzada deja carga.lock, confirmar que su proceso terminó antes de retirar ese archivo. Conservar el diario si la carga quedó incompleta. El índice único de SKU del backend es la última protección contra duplicados.

`preparar_catalogo.py` regenera el manifiesto mantenido para esta biblioteca; no toca PostgreSQL. No regenerar/reordenar los SKU de un catálogo ya importado. El resultado documentado está en Web/CATALOGO-DEMO.md. Backups, estado local, logs, target y uploads están ignorados por Git.
