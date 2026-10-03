"""Exportación privada y traslado explícito del catálogo por API. Nunca se ejecuta al iniciar."""
import argparse, hashlib, json, os, sys, uuid
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'Web/tools/demo'))
from cargar_catalogo import API, guardar, categoria_existente
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None

class TransferAPI(API):
    def bytes(self,path,data=None,content_type=None):
        headers={'Accept':'application/json'}
        if self.token:headers['Authorization']='Bearer '+self.token
        if content_type:headers['Content-Type']=content_type
        try:
            with build_opener(NoRedirect()).open(Request(self.url+path,data=data,headers=headers),timeout=40) as response:
                return response.read(),response.headers
        except HTTPError as error:
            raise RuntimeError(f'API {path}: HTTP {error.code}; no se siguen redirecciones') from None

def login(url):
    parsed=urlparse(url)
    if parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path.rstrip('/')!='/api':raise ValueError('Usar URL de API sin credenciales terminada en /api')
    if parsed.scheme!='https' and not(parsed.scheme=='http' and parsed.hostname in {'localhost','127.0.0.1'}):raise ValueError('Se requiere HTTPS fuera de desarrollo local')
    api=TransferAPI(url)
    api.token=api.post('/auth/login',{'username':os.environ['TRANSFER_USERNAME'],'password':os.environ['TRANSFER_PASSWORD']})['token']
    return api

def multipart(api,p,image):
    if image is None:return json.loads(api.bytes('/productos',json.dumps(p).encode(),'application/json')[0])
    boundary='transfer-'+uuid.uuid4().hex
    mime={'.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'}[image.suffix]
    body=(f'--{boundary}\r\nContent-Disposition: form-data; name="producto"\r\nContent-Type: application/json\r\n\r\n'.encode()+json.dumps(p).encode()+f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="imagen"; filename="{image.name}"\r\nContent-Type: {mime}\r\n\r\n'.encode()+image.read_bytes()+f'\r\n--{boundary}--\r\n'.encode())
    return json.loads(api.bytes('/productos',body,'multipart/form-data; boundary='+boundary)[0])

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('accion',choices=['exportar','importar'])
    parser.add_argument('--api',required=True)
    parser.add_argument('--bundle',type=Path,required=True)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--backup',type=Path)
    args=parser.parse_args();api=login(args.api);bundle=args.bundle.resolve()
    if args.accion=='exportar':
        if bundle.exists():raise ValueError('La carpeta de exportación debe ser nueva para evitar sobrescrituras')
        products=api.get('/productos');entries=[]
        for p in products:
            image=None;sha=None
            if p.get('imagenUrl'):
                filename=p['imagenUrl'].split('/')[-1]
                import re
                if not re.fullmatch(r'[0-9a-f-]{36}\.(jpg|png|webp)',filename):raise ValueError('Referencia de imagen no válida')
                data=api.bytes('/productos/imagenes/'+filename)[0]
                image='imagenes/'+filename;(bundle/image).parent.mkdir(parents=True,exist_ok=True);(bundle/image).write_bytes(data);sha=hashlib.sha256(data).hexdigest()
            fields={k:p[k] for k in ['sku','nombre','categoria','marca','precioCompra','precioVenta','stockMinimo','activo']}
            fields.update(stockInicial=0,web={k:p.get(k) for k in ['descripcion','especificaciones','destacado','precioAnterior']})
            entries.append({'producto':fields,'stock':p['stock'],'imagen':image,'sha256':sha})
        # Detectar modificaciones concurrentes; exportar en ventana de mantenimiento.
        if products!=api.get('/productos'):raise ValueError('El catálogo cambió durante la exportación; repetir en una carpeta nueva')
        guardar(bundle/'catalogo.json',{'version':1,'productos':entries});print(f'Exportados {len(entries)} productos; sin usuarios, clientes, credenciales ni ventas.');return
    manifest=json.loads((bundle/'catalogo.json').read_text(encoding='utf-8'));entries=manifest['productos']
    if manifest['version']!=1 or len({e['producto']['sku'] for e in entries})!=len(entries):raise ValueError('Manifiesto inválido')
    for e in entries:
        if type(e['stock']) is not int or e['stock']<0:raise ValueError('Stock de exportación inválido')
        if e['imagen']:
            image=(bundle/e['imagen']).resolve()
            if not image.is_relative_to(bundle) or image.suffix not in {'.jpg','.png','.webp'} or hashlib.sha256(image.read_bytes()).hexdigest()!=e['sha256']:raise ValueError('Imagen alterada o fuera del bundle')
    existing={p['sku']:p for p in api.get('/productos')};categories={p['categoria'] for p in existing.values()}
    print(f'Productos en bundle: {len(entries)}; SKU existentes: {sum(e["producto"]["sku"] in existing for e in entries)}')
    if not args.apply:print('Simulación: no se escribieron datos.');return
    if not args.backup or not args.backup.is_file() or args.backup.open('rb').read(5)!=b'PGDMP':raise ValueError('Requiere backup custom previo del destino')
    ledger_path=bundle/('estado-'+hashlib.sha256(args.api.encode()).hexdigest()[:12]+'.json')
    signature=hashlib.sha256((bundle/'catalogo.json').read_bytes()).hexdigest()
    ledger=json.loads(ledger_path.read_text(encoding='utf-8')) if ledger_path.exists() else {'hash':signature,'nuevos':[e['producto']['sku'] for e in entries if e['producto']['sku'] not in existing],'completos':[]}
    if ledger['hash']!=signature:raise ValueError('El manifiesto cambió después de comenzar')
    guardar(ledger_path,ledger)
    created=0
    for e in entries:
        sku=e['producto']['sku']
        if sku not in ledger['nuevos'] or sku in ledger['completos']:continue
        product=existing.get(sku)
        if product is None:
            fields=e['producto'].copy();fields['categoria']=categoria_existente(fields['categoria'],categories)
            product=multipart(api,fields,(bundle/e['imagen']) if e['imagen'] else None);created+=1;existing[sku]=product;categories.add(product['categoria'])
        if product['nombre']!=e['producto']['nombre']:raise ValueError('Conflicto de SKU; revisar manualmente')
        motivo='Stock inicial migración catálogo: '+sku
        movements=[m for m in api.get('/inventario/movimientos') if m['productoId']==product['id']]
        if e['stock']>0 and not any(m['motivo']==motivo for m in movements):
            if product['stock']!=0:raise ValueError('Stock modificado antes de completar; revisar manualmente')
            api.post('/inventario/movimientos',{'productoId':product['id'],'tipo':'ENTRADA','cantidad':e['stock'],'motivo':motivo})
        ledger['completos'].append(sku);guardar(ledger_path,ledger)
    print(f'Importación completada. Nuevos en esta ejecución: {created}. Los SKU existentes se conservaron.')

if __name__=='__main__':main()
