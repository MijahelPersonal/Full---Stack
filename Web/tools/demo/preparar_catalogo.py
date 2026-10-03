"""Genera el manifiesto del seeder, nunca datos para el frontend."""
import json
from pathlib import Path
from decimal import Decimal

ROOT = Path(__file__).resolve().parents[3]
LIBRARY = ROOT / 'Web/product-images-library'
# Una identidad propia/genérica por ilustración; especificaciones y precios DEMO.
CATALOG = [
 ('pcs-armadas/pc-gamer-negra.webp','PC-GAM','PC Gamer Struch Nova 5','PCs armadas',3299,{'Memoria':'16 GB','Almacenamiento':'SSD 1 TB'}),
 ('pcs-armadas/pc-gamer-blanca.webp','PC-GAM','PC Gamer Struch Nova 7 White','PCs armadas',4699,{'Memoria':'32 GB','Almacenamiento':'SSD 1 TB'}),
 ('pcs-armadas/pc-rgb.webp','PC-GAM','PC Gamer Struch Aurora RGB','PCs armadas',5999,{'Memoria':'32 GB','Almacenamiento':'SSD 2 TB'}),
 ('pcs-armadas/pc-edicion.webp','PC-WKS','PC Workstation Struch Creator','PCs armadas',6499,{'Memoria':'64 GB','Almacenamiento':'SSD 2 TB'}),
 ('pcs-armadas/pc-oficina.webp','PC-OFF','PC Office Struch Essential','PCs armadas',1899,{'Memoria':'16 GB','Almacenamiento':'SSD 500 GB'}),
 ('laptops/laptop-gaming.webp','LAP-GAM','Laptop Struch Pulse Gaming 15','Laptops',4499,{'Pantalla':'15 pulgadas','Memoria':'16 GB','Almacenamiento':'SSD 1 TB'}),
 ('laptops/laptop-trabajo.webp','LAP-OFF','Laptop Struch Work 15','Laptops',2499,{'Pantalla':'15 pulgadas','Memoria':'16 GB','Almacenamiento':'SSD 500 GB'}),
 ('laptops/laptop-ultradelgada.webp','LAP-SLM','Laptop Struch Air 14','Laptops',3299,{'Pantalla':'14 pulgadas','Memoria':'16 GB','Formato':'Ultradelgada'}),
 ('tarjetas-graficas/gpu-compacta.webp','GPU-006','GPU Struch Vision Compact 6 GB','Tarjetas gráficas',899,{'Memoria':'6 GB','Ventiladores':'1'}),
 ('tarjetas-graficas/gpu-dos-ventiladores.webp','GPU-008','GPU Struch Vision 8 GB','Tarjetas gráficas',1399,{'Memoria':'8 GB','Ventiladores':'2'}),
 ('tarjetas-graficas/gpu-tres-ventiladores.webp','GPU-012','GPU Struch Performance 12 GB','Tarjetas gráficas',2399,{'Memoria':'12 GB','Ventiladores':'3'}),
 ('tarjetas-graficas/gpu-blanca.webp','GPU-016','GPU Struch Performance White 16 GB','Tarjetas gráficas',3599,{'Memoria':'16 GB','Ventiladores':'3','Color':'Blanco'}),
 ('procesadores/procesador-plata.webp','CPU-006','Procesador Struch Core 6','Procesadores',649,{'Núcleos':'6','Uso':'Equipos de escritorio'}),
 ('procesadores/procesador-contactos.webp','CPU-008','Procesador Struch Core 8','Procesadores',999,{'Núcleos':'8','Uso':'Gaming y productividad'}),
 ('procesadores/procesador-workstation.webp','CPU-012','Procesador Struch Creator 12','Procesadores',1699,{'Núcleos':'12','Uso':'Estación de trabajo'}),
 ('placas-madre/placa-atx.webp','MB-ATX','Placa madre Struch Foundation ATX','Placas madre',599,{'Formato':'ATX','Uso':'Equipo de escritorio'}),
 ('placas-madre/placa-microatx.webp','MB-MATX','Placa madre Struch Foundation Micro ATX','Placas madre',399,{'Formato':'Micro ATX','Uso':'Equipo compacto'}),
 ('placas-madre/placa-mini-itx.webp','MB-ITX','Placa madre Struch Foundation Mini ITX','Placas madre',749,{'Formato':'Mini ITX','Uso':'Equipo compacto'}),
 ('memoria-ram/ram-negra.webp','RAM-D4','Kit memoria DDR4 16 GB 3200 MHz','Memoria RAM',189,{'Capacidad total':'16 GB','Tipo':'DDR4','Frecuencia':'3200 MHz','Formato':'DIMM','Módulos':'2'}),
 ('memoria-ram/ram-blanca.webp','RAM-D5','Kit memoria DDR5 32 GB 6000 MHz White','Memoria RAM',429,{'Capacidad total':'32 GB','Tipo':'DDR5','Frecuencia':'6000 MHz','Formato':'DIMM','Módulos':'2'}),
 ('memoria-ram/ram-sodimm.webp','RAM-SOD','Kit memoria para laptop DDR4 16 GB','Memoria RAM',209,{'Capacidad total':'16 GB','Tipo':'DDR4','Formato':'SODIMM','Módulos':'2'}),
 ('almacenamiento/ssd-nvme.webp','SSD-NVME','SSD NVMe 1 TB Gen4','Almacenamiento',329,{'Capacidad':'1 TB','Formato':'M.2','Interfaz':'NVMe Gen4'}),
 ('almacenamiento/ssd-disipador.webp','SSD-HS','SSD NVMe 2 TB con disipador','Almacenamiento',599,{'Capacidad':'2 TB','Formato':'M.2','Refrigeración':'Disipador integrado'}),
 ('almacenamiento/ssd-sata.webp','SSD-SATA','SSD SATA 500 GB','Almacenamiento',169,{'Capacidad':'500 GB','Formato':'2.5 pulgadas','Interfaz':'SATA'}),
 ('accesorios/hdd.webp','HDD-2TB','Disco duro 2 TB para escritorio','Almacenamiento',239,{'Capacidad':'2 TB','Formato':'3.5 pulgadas','Interfaz':'SATA'}),
 ('monitores/monitor-gamer.webp','MON-GAM','Monitor Gaming 24 pulgadas 180 Hz','Monitores',699,{'Pantalla':'24 pulgadas','Resolución':'Full HD','Frecuencia':'180 Hz'}),
 ('monitores/monitor-oficina.webp','MON-IPS','Monitor IPS 27 pulgadas QHD','Monitores',899,{'Pantalla':'27 pulgadas','Panel':'IPS','Resolución':'QHD'}),
 ('monitores/monitor-ultrawide.webp','MON-UW','Monitor UltraWide curvo 34 pulgadas','Monitores',1699,{'Pantalla':'34 pulgadas','Formato':'UltraWide curvo'}),
 ('teclados/teclado-mecanico.webp','TEC-MEC','Teclado mecánico compacto Struch Type','Teclados',229,{'Tipo':'Mecánico','Formato':'Compacto','Color':'Negro'}),
 ('teclados/teclado-blanco.webp','TEC-MEC','Teclado mecánico compacto Struch Type White','Teclados',259,{'Tipo':'Mecánico','Formato':'Compacto','Color':'Blanco'}),
 ('teclados/teclado-completo.webp','TEC-FULL','Teclado completo Struch Office','Teclados',89,{'Formato':'Completo','Teclado numérico':'Sí','Color':'Negro'}),
 ('teclados/teclado-inalambrico.webp','TEC-WL','Teclado inalámbrico Struch Slim','Teclados',149,{'Conexión':'Inalámbrica','Perfil':'Delgado','Color':'Blanco'}),
 ('mouse/mouse-gamer.webp','MOU-GAM','Mouse Gaming Struch Precision','Mouse',99,{'Conexión':'Cable','Uso':'Gaming','Color':'Negro'}),
 ('mouse/mouse-blanco.webp','MOU-GAM','Mouse Gaming Struch Precision White','Mouse',179,{'Conexión':'Inalámbrica','Uso':'Gaming','Color':'Blanco'}),
 ('mouse/mouse-ergonomico.webp','MOU-ERG','Mouse vertical Struch Ergo','Mouse',159,{'Conexión':'Inalámbrica','Formato':'Vertical ergonómico'}),
 ('mouse/mouse-inalambrico.webp','MOU-OFF','Mouse inalámbrico Struch Office','Mouse',69,{'Conexión':'Inalámbrica','Uso':'Oficina','Color':'Plata'}),
 ('audifonos/audifonos-gamer.webp','AUD-GAM','Audífonos Gaming Struch Sound','Audífonos',179,{'Formato':'Over-ear','Micrófono':'Integrado','Color':'Negro'}),
 ('audifonos/audifonos-blancos.webp','AUD-GAM','Audífonos Gaming Struch Sound White','Audífonos',219,{'Formato':'Over-ear','Micrófono':'Integrado','Color':'Blanco'}),
 ('audifonos/audifonos-inalambricos.webp','AUD-WL','Audífonos inalámbricos Struch Air Sound','Audífonos',299,{'Formato':'Over-ear','Conexión':'Inalámbrica'}),
 ('refrigeracion/cooler-torre.webp','COOL-AIR','Cooler de torre Struch Breeze','Refrigeración',149,{'Tipo':'Aire','Formato':'Torre','Ventiladores':'1'}),
 ('refrigeracion/refrigeracion-liquida.webp','COOL-AIO','Refrigeración líquida Struch Flow 240','Refrigeración',399,{'Tipo':'Líquida AIO','Radiador':'240 mm','Ventiladores':'2'}),
 ('fuentes/fuente-modular.webp','PSU-750','Fuente modular Struch Power 750 W','Fuentes de poder',349,{'Potencia':'750 W','Formato':'ATX','Cableado':'Modular'}),
 ('fuentes/fuente-compacta.webp','PSU-550','Fuente compacta Struch Power 550 W','Fuentes de poder',279,{'Potencia':'550 W','Formato':'SFX'}),
 ('cases/case-negro.webp','CASE-ATX','Case Struch Frame ATX Black','Cases',249,{'Formato':'ATX','Color':'Negro','Panel lateral':'Vidrio'}),
 ('cases/case-blanco.webp','CASE-ATX','Case Struch Frame ATX White','Cases',289,{'Formato':'ATX','Color':'Blanco','Panel lateral':'Vidrio'}),
 ('cases/case-compacto.webp','CASE-MATX','Case compacto Struch Frame Mesh','Cases',199,{'Formato':'Compacto','Frontal':'Malla','Color':'Gris oscuro'}),
 ('accesorios/adaptador-video.webp','ACC-VID','Adaptador de video USB-C a HDMI','Accesorios',59,{'Conectores':'USB-C y HDMI','Uso':'Salida de video'}),
 ('accesorios/cable-usb.webp','ACC-USB','Cable USB-C Struch Link','Accesorios',35,{'Conexión':'USB-C','Color':'Negro'}),
 ('accesorios/hub-usb.webp','ACC-HUB','Hub USB-C Struch Connect','Accesorios',129,{'Conexión':'USB-C','Uso':'Expansión de puertos'}),
 ('accesorios/mando.webp','ACC-PAD','Mando inalámbrico Struch Play','Accesorios',149,{'Conexión':'Inalámbrica','Uso':'Gaming'}),
 ('accesorios/microfono-usb.webp','ACC-MIC','Micrófono USB Struch Voice','Accesorios',189,{'Conexión':'USB','Soporte':'De escritorio'}),
 ('accesorios/mousepad.webp','ACC-MAT','Mousepad Struch Surface','Accesorios',39,{'Superficie':'Tela','Forma':'Rectangular'}),
 ('accesorios/parlantes.webp','ACC-SPK','Parlantes de escritorio Struch Duo','Accesorios',119,{'Presentación':'Par de parlantes','Uso':'Escritorio'}),
 ('accesorios/router.webp','ACC-NET','Router inalámbrico Struch Home','Accesorios',199,{'Antenas':'4','Uso':'Red doméstica'}),
 ('accesorios/soporte-audifonos.webp','ACC-STND','Soporte para audífonos Struch Stand','Accesorios',49,{'Uso':'Audífonos','Formato':'De escritorio'}),
 ('accesorios/webcam.webp','ACC-CAM','Webcam USB Struch Meet','Accesorios',139,{'Conexión':'USB','Soporte':'Clip integrado'}),
]

def preparar():
    fuentes = json.loads((LIBRARY / 'PROMPTS.json').read_text(encoding='utf-8'))
    assert len(CATALOG) == 56 and {x[0] for x in CATALOG} == {x['file'] for x in fuentes}
    secuencias, productos = {}, []
    for i,(imagen,tipo,nombre,categoria,precio,specs) in enumerate(CATALOG):
        secuencias[tipo] = secuencias.get(tipo,0)+1
        minimo = 2+i%4
        stock = [5,8,10,15,20][i%5]
        if i in [11,27]: stock = 0
        elif i in [4,14,20,39,45,54]: stock = max(1,minimo-1)
        desc = f'{nombre}, una opción práctica para tu equipo y tu espacio de trabajo. '
        desc += 'Catálogo de demostración: especificaciones y precio referenciales; imagen genérica ilustrativa.'
        productos.append({'sku':f'STR-DEMO-{tipo}-{secuencias[tipo]:03d}','nombre':nombre,'categoria':categoria,'marca':'Struch','precioCompra':float((Decimal(precio)*Decimal('0.74')).quantize(Decimal('0.01'))),'precioVenta':precio,'stockInicial':stock,'stockMinimo':minimo,'activo':True,'web':{'descripcion':desc,'especificaciones':specs,'destacado':i in [0,2,5,9,19,25,28,32],'precioAnterior':int(Decimal(precio)*Decimal('1.15')) if i in [1,6,9,18,25,29,33,38,47] else None},'imagen':imagen})
    assert len({p['sku'] for p in productos})==56
    return productos

if __name__=='__main__':
    path=Path(__file__).with_name('catalogo.json')
    path.write_text(json.dumps(preparar(),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Manifiesto DEMO generado: 56 productos; no se modificó la base de datos.')
