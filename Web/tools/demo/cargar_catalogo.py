"""Carga explícita de datos DEMO por la API existente, nunca al arrancar Spring."""
import argparse
import hashlib
import json
import os
import sys
import unicodedata
import uuid
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[3]
LIBRARY=ROOT/'Web/product-images-library'
STATE=Path(__file__).with_name('.state')
MOTIVO='Stock inicial catálogo demo'

def normalizar(text):
    return ' '.join(''.join(c for c in unicodedata.normalize('NFD',text) if not unicodedata.combining(c)).lower().split())

def categoria_existente(nombre, existentes):
    aliases={'memoria ram':{'memoria ram','memorias ram'},'pc armadas':{'pc armadas','pcs armadas'},'fuentes de poder':{'fuentes de poder','fuentes'}}
    key=normalizar(nombre)
    compatibles=aliases.get(key,{key})
    encontrados=[c for c in existentes if normalizar(c) in compatibles]
    if len(encontrados)>1:
        raise ValueError(f'Categorías equivalentes existentes: {encontrados}; revisar antes de cargar')
    return encontrados[0] if encontrados else nombre

def guardar(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix('.tmp')
    tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    tmp.replace(path)

def digest(data):
    if isinstance(data,list):data=sorted(data,key=lambda p:str(p.get('id','')))
    return hashlib.sha256(json.dumps(data,sort_keys=True,ensure_ascii=False).encode()).hexdigest()

class API:
    def __init__(self,url):self.url=url.rstrip('/');self.token=None
    def bytes(self,path,data=None,content_type=None):
        headers={'Accept':'application/json'}
        if self.token:headers['Authorization']='Bearer '+self.token
        if content_type:headers['Content-Type']=content_type
        try:
            with urlopen(Request(self.url+path,data=data,headers=headers),timeout=40) as r:
                return r.read(),r.headers
        except HTTPError as e:
            payload=e.read().decode('utf-8',errors='replace')
            try:mensaje=json.loads(payload).get('error',f'HTTP {e.code}')
            except ValueError:mensaje=f'HTTP {e.code}'
            raise RuntimeError(f'{path}: {mensaje}') from None
    def get(self,path):return json.loads(self.bytes(path)[0])
    def post(self,path,data):return json.loads(self.bytes(path,json.dumps(data).encode(),'application/json')[0])
    def crear(self,producto,archivo):
        boundary='demo-'+uuid.uuid4().hex
        datos={k:v for k,v in producto.items() if k!='imagen'}
        datos['stockInicial']=0  # La entrada se registra por el endpoint real de Inventario.
        partes=(f'--{boundary}\r\nContent-Disposition: form-data; name="producto"\r\nContent-Type: application/json\r\n\r\n'.encode()+json.dumps(datos,ensure_ascii=False).encode()+
            f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="imagen"; filename="{archivo.name}"\r\nContent-Type: image/webp\r\n\r\n'.encode()+archivo.read_bytes()+f'\r\n--{boundary}--\r\n'.encode())
        return json.loads(self.bytes('/productos',partes,'multipart/form-data; boundary='+boundary)[0])

def imagenes_validas(manifiesto):
    resultado={}
    for p in manifiesto:
        archivo=(LIBRARY/p['imagen']).resolve()
        if not archivo.is_relative_to(LIBRARY.resolve()):raise ValueError('Imagen fuera de la biblioteca')
        data=archivo.read_bytes()
        if not (0<len(data)<=2*1024*1024 and data[:4]==b'RIFF' and data[8:12]==b'WEBP' and int.from_bytes(data[4:8],'little')==len(data)-8):raise ValueError(f'WEBP inválido: {archivo.name}')
        resultado[p['imagen']]=hashlib.sha256(data).hexdigest()
    return resultado

def referencia(manifiesto, productos, resumen):
    lineas=['# Catálogo DEMO real de STRUCH','',
        'Datos de demostración registrados en gestor_db mediante Spring Boot. Los nombres, especificaciones y precios son referencias ficticias para el portafolio; las imágenes son ilustraciones genéricas, no fotografías oficiales de fabricantes.','',
        f"Productos creados por esta carga: **{resumen['creados']}**. Productos manuales conservados: **{resumen['existentesConservados']}**. Total actual: **{resumen['total']}**.",
        f"Stock normal: {resumen['stockNormal']}; bajo (positivo ≤ mínimo): {resumen['stockBajo']}; sin stock: {resumen['sinStock']}. La clasificación corresponde al momento de validar la carga.",
        f"Precios venta DEMO: S/ {resumen['precioMin']:.2f} – S/ {resumen['precioMax']:.2f}. Imágenes de producto usadas: {resumen['imagenes']}. Movimientos iniciales: {resumen['movimientosIniciales']}.",'',
        f"Backup previo (ignorado por Git): `{resumen['backup']}`.",'',
        '## Categorías utilizadas','',', '.join(resumen['categorias'])+'.','',
        'Memoria RAM reutiliza el nombre existente Memoria Ram. El HDD se clasifica como Almacenamiento aunque su ilustración se encuentra en la carpeta accesorios. CONTACT-SHEET.webp es un índice visual y no se importa. No se necesitaron imágenes del respaldo demo-product-images.','',
        '## Productos','',
        '| SKU | Producto | Categoría | Precio compra | Precio venta | Stock | Mínimo | Imagen biblioteca | Imagen en backend |',
        '|---|---|---|---:|---:|---:|---:|---|---|']
    for p in manifiesto:
        real=productos[p['sku']]
        lineas.append(f"| {p['sku']} | {real['nombre']} | {real['categoria']} | S/ {real['precioCompra']:.2f} | S/ {real['precioVenta']:.2f} | {real['stock']} | {real['stockMinimo']} | [{p['imagen']}](product-images-library/{p['imagen']}) | {real['imagenUrl']} |")
    lineas+=['','## Herramienta de carga','',
        'El manifiesto y el seeder están en tools/demo, fuera de frontend. No forman parte del catálogo renderizado en Astro y no se ejecutan al iniciar Spring Boot. El seeder crea productos con imagen mediante multipart y registra cada entrada inicial por /api/inventario/movimientos. PostgreSQL almacena solo la referencia de imagen.','',
        'Los SKU existentes se conservan sin actualizarlos. El diario local permite completar una carga interrumpida sin repetir movimientos iniciales. Una segunda ejecución completa creó cero productos y cero movimientos adicionales. No usar --verify-initial una vez que existan ventas o ajustes legítimos sobre este catálogo, ya que esa comprobación compara con el stock inicial.','',
        'Las contraseñas y tokens no se incluyen en el manifiesto, el informe ni el código. Backups, el diario, target y logs quedan ignorados por Git. Los usuarios, clientes, pedidos, ventas, movimientos anteriores y productos manuales se comprobaron sin cambios después de importar.']
    (ROOT/'Web/CATALOGO-DEMO.md').write_text('\n'.join(lineas)+'\n',encoding='utf-8')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--verify-initial',action='store_true')
    parser.add_argument('--base-url',default='http://localhost:8080/api')
    parser.add_argument('--backup',type=Path,required=True)
    args=parser.parse_args()
    url=urlparse(args.base_url)
    if url.scheme!='http' or url.hostname not in ('localhost','127.0.0.1') or url.port!=8080 or url.path!='/api':raise ValueError('La herramienta demo está limitada al backend local habitual en 8080/api')
    backup=args.backup.resolve()
    if not backup.is_file() or backup.stat().st_size<1000 or backup.open('rb').read(5)!=b'PGDMP':raise ValueError('Se requiere un backup PostgreSQL custom válido antes de cargar')
    manifiesto=json.loads(Path(__file__).with_name('catalogo.json').read_text(encoding='utf-8'))
    if len(manifiesto)!=56 or len({p['sku'] for p in manifiesto})!=len(manifiesto):raise ValueError('Manifiesto incompleto o SKU duplicados')
    hashes=imagenes_validas(manifiesto)
    api=API(args.base_url)
    username=os.environ.get('DEMO_USERNAME');password=os.environ.get('DEMO_PASSWORD')
    if not username or not password:raise ValueError('Configurar DEMO_USERNAME y DEMO_PASSWORD del Administrador local')
    api.token=api.post('/auth/login',{'username':username,'password':password})['token']
    actuales=api.get('/productos');por_sku={p['sku']:p for p in actuales}
    categorias=sorted({p['categoria'] for p in actuales})
    for p in manifiesto:
        p['categoria']=categoria_existente(p['categoria'],categorias)
        if p['categoria'] not in categorias:categorias.append(p['categoria'])
    STATE.mkdir(parents=True,exist_ok=True)
    diario_path=STATE/'diario.json'
    diario=json.loads(diario_path.read_text(encoding='utf-8')) if diario_path.exists() else {'productos':{},'backup':str(backup),'antes':{'productos':actuales,'imagenes':hashes,'tablas':{p:digest(api.get(p)) for p in ['/usuarios','/clientes?incluirInactivos=true','/ventas','/pedidos-web']},'movimientos':api.get('/inventario/movimientos')}}
    if not args.apply:
        print(json.dumps({'previstos':len(manifiesto),'yaExisten':sum(p['sku'] in por_sku for p in manifiesto),'porCrear':sum(p['sku'] not in por_sku for p in manifiesto),'categorias':sorted({p['categoria'] for p in manifiesto})},ensure_ascii=False,indent=2));return
    lock=STATE/'carga.lock'
    if lock.exists():raise ValueError('Otra carga está activa o fue interrumpida; revisar carga.lock antes de reintentar')
    lock.write_text(str(os.getpid()),encoding='utf-8')
    creados=omitidos=entradas=0
    try:
        guardar(diario_path,diario)
        for p in manifiesto:
            sku=p['sku'];registro=diario['productos'].get(sku)
            if sku in por_sku and registro is None:
                omitidos+=1;print('Conservado sin modificar: '+sku);continue
            if registro is None:
                registro={'fase':'creando','imagenHash':hashes[p['imagen']]};diario['productos'][sku]=registro;guardar(diario_path,diario)
            producto=por_sku.get(sku)
            if producto is None:
                producto=api.crear(p,LIBRARY/p['imagen']);por_sku[sku]=producto;creados+=1
                registro.update({'id':producto['id'],'fase':'imagen-cargada'});guardar(diario_path,diario)
            elif registro.get('id') and producto['id']!=registro['id']:
                raise ValueError('SKU sustituido por otra entidad; no se modificará: '+sku)
            elif not registro.get('id'):
                # Recuperación de respuesta perdida: comprobar identidad e imagen antes de continuar.
                datos,_=api.bytes(producto['imagenUrl'].removeprefix('/api'))
                if producto['nombre']!=p['nombre'] or hashlib.sha256(datos).hexdigest()!=hashes[p['imagen']]:raise ValueError('Colisión de SKU, se conserva el producto existente: '+sku)
                registro['id']=producto['id'];guardar(diario_path,diario)
            else:omitidos+=1
            motivo=MOTIVO+' · '+sku
            inicial=[m for m in api.get('/inventario/movimientos') if m['productoId']==producto['id'] and m['motivo']==motivo]
            if p['stockInicial']>0 and not inicial and registro['fase']!='completo':
                if producto['stock']!=0:raise ValueError('Stock modificado antes de completar la entrada: '+sku)
                api.post('/inventario/movimientos',{'productoId':producto['id'],'tipo':'ENTRADA','cantidad':p['stockInicial'],'motivo':motivo});entradas+=1
            registro['fase']='completo';guardar(diario_path,diario)
            print('Verificado: '+sku)
        productos={p['sku']:p for p in api.get('/productos')}
        movimientos=api.get('/inventario/movimientos')
        for previo in diario['antes']['productos']:
            if productos.get(previo['sku'])!=previo:raise ValueError('Producto preexistente modificado: '+previo['sku'])
        for ruta,hash_previo in diario['antes']['tablas'].items():
            if digest(api.get(ruta))!=hash_previo:raise ValueError('Datos preexistentes cambiaron en '+ruta)
        por_id={m['id']:m for m in movimientos}
        for m in diario['antes']['movimientos']:
            if por_id.get(m['id'])!=m:raise ValueError('Movimiento anterior modificado')
        seleccion=[];cuenta_mov=0
        for p in manifiesto:
            real=productos[p['sku']]
            for campo in ['nombre','categoria','marca','precioCompra','precioVenta','stockMinimo','activo']:
                if real[campo]!=p[campo]:raise ValueError(f'Dato diferente en {p["sku"]}: {campo}')
            datos,headers=api.bytes(real['imagenUrl'].removeprefix('/api'))
            if hashlib.sha256(datos).hexdigest()!=hashes[p['imagen']] or not headers['Content-Type'].startswith('image/webp'):raise ValueError('Imagen diferente en '+p['sku'])
            ms=[m for m in movimientos if m['productoId']==real['id'] and m['motivo']==MOTIVO+' · '+p['sku']]
            if p['stockInicial']>0:
                if len(ms)!=1 or ms[0]['cantidad']!=p['stockInicial'] or ms[0]['tipo']!='ENTRADA' or ms[0]['stockAnterior']!=0 or ms[0]['stockPosterior']!=p['stockInicial']:raise ValueError('Movimiento inicial incorrecto en '+p['sku'])
                cuenta_mov+=1
            elif ms:raise ValueError('No se debe registrar un movimiento de cantidad cero')
            if args.verify_initial and real['stock']!=p['stockInicial']:raise ValueError('Stock inicial diferente en '+p['sku'])
            publico=api.get('/public/productos/'+real['slug'])
            if publico['id']!=real['id'] or publico['precio']!=real['precioVenta'] or publico['stock']!=real['stock'] or publico['imagenUrl']!=real['imagenUrl'] or 'precioCompra' in publico:raise ValueError('API pública incorrecta en '+p['sku'])
            seleccion.append(real)
        if imagenes_validas(manifiesto)!=hashes:raise ValueError('Una imagen original se modificó')
        reporte={'creadosEnEjecucion':creados,'omitidosEnEjecucion':omitidos,'entradasEnEjecucion':entradas,'creados':len(diario['productos']),'existentesConservados':len(diario['antes']['productos']),'total':len(productos),'categorias':sorted({p['categoria'] for p in seleccion}),'precioMin':min(p['precioVenta'] for p in seleccion),'precioMax':max(p['precioVenta'] for p in seleccion),'stockNormal':sum(p['stock']>p['stockMinimo'] for p in seleccion),'stockBajo':sum(0<p['stock']<=p['stockMinimo'] for p in seleccion),'sinStock':sum(p['stock']==0 for p in seleccion),'imagenes':len(hashes),'movimientosIniciales':cuenta_mov,'backup':diario['backup']}
        guardar(STATE/'resultado.json',reporte);referencia(manifiesto,productos,reporte)
        print(json.dumps(reporte,ensure_ascii=False,indent=2))
    finally:lock.unlink(missing_ok=True)

if __name__=='__main__':
    try:main()
    except Exception as e:print('Carga detenida: '+str(e),file=sys.stderr);sys.exit(1)
