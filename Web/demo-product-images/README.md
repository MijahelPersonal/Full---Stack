# Biblioteca de referencia de imágenes anteriores

Respaldo realizado antes de retirar el catálogo demo. No es un catálogo; Astro no importa ni publica esta carpeta. No se insertó ni eliminó ningún producto en PostgreSQL.

## Ocho imágenes de producto

El sitio usaba **un atlas** compartido de ocho ilustraciones; se conserva el PNG original y se extraen las ocho celdas a WEBP para facilitar la selección manual. Las asociaciones anteriores con marcas/modelos eran ficticias: estas ilustraciones no son fotos oficiales de esos modelos. Destacados, ofertas y novedades reutilizaban las mismas ocho imágenes.

| Archivo aquí | Producto demo relacionado anteriormente | Ubicación original en Web/frontend | Origen |
|---|---|---|---|
| gpu-demo.webp | GeForce RTX 5070 WINDFORCE OC (Gigabyte) | src/assets/struch-demo-atlas.png, celda 1 | Generación integrada imagegen, ilustración genérica |
| cpu-demo.webp | Ryzen 7 9700X (AMD) | src/assets/struch-demo-atlas.png, celda 2 | Generación integrada imagegen, ilustración genérica |
| placa-madre-demo.webp | TUF Gaming B650-PLUS WiFi (ASUS) | src/assets/struch-demo-atlas.png, celda 3 | Generación integrada imagegen, ilustración genérica |
| ram-demo.webp | FURY Beast DDR5 32 GB (Kingston) | src/assets/struch-demo-atlas.png, celda 4 | Generación integrada imagegen, ilustración genérica |
| ssd-demo.webp | NV3 SSD NVMe 1 TB (Kingston) | src/assets/struch-demo-atlas.png, celda 5 | Generación integrada imagegen, ilustración genérica |
| laptop-demo.webp | TUF Gaming A15 Ryzen 7 (ASUS) | src/assets/struch-demo-atlas.png, celda 6 | Generación integrada imagegen, ilustración genérica |
| teclado-demo.webp | G PRO teclado mecánico (Logitech) | src/assets/struch-demo-atlas.png, celda 7 | Generación integrada imagegen, ilustración genérica |
| mouse-demo.webp | G502 HERO mouse (Logitech) | src/assets/struch-demo-atlas.png, celda 8 | Generación integrada imagegen, ilustración genérica |

## Originales también respaldados

| Archivo aquí | Uso anterior | Ubicación original | Origen |
|---|---|---|---|
| struch-demo-atlas.png | Atlas de las ocho imágenes anteriores | Web/frontend/src/assets/struch-demo-atlas.png | imagegen integrado |
| struch-hero.png | GPU, CPU y teclado decorativos; banners general y ofertas | Web/frontend/src/assets/struch-hero.png | imagegen integrado |
| struch-cpu.png | CPU decorativo del hero | Web/frontend/src/assets/struch-cpu.png | imagegen integrado |
| struch-laptop.png | Laptop, teclado y mouse decorativos del hero | Web/frontend/src/assets/struch-laptop.png | imagegen integrado |

Total: 4 archivos fuente originales + 8 recortes WEBP, 12 archivos de imagen. Los tres banners siguen en el hero como decoración; no generan productos comprables. No se encontraron URLs externas de fotografías comerciales en el frontend.

Los prompts originales están en ORIGENES.md. Material generado por IA, sin licencia de fabricante ni garantía de identidad técnica. Biblioteca de referencia; al vender un modelo concreto, usa una fotografía fiel con derechos comprobados.
