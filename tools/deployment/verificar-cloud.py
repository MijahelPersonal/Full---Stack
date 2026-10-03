"""Comprobación cloud explícita; conserva el pedido QA y restituye stock con movimiento auditable.

La contraseña administrativa se recibe solamente por TRANSFER_PASSWORD.
"""
import argparse, concurrent.futures, hashlib, http.cookiejar, json, os, secrets, uuid
from pathlib import Path
from urllib.request import Request, build_opener, HTTPCookieProcessor
from urllib.error import HTTPError

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--api', required=True)
    parser.add_argument('--web', required=True)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--pedido-qa', action='store_true')
    args = parser.parse_args()
    if args.pedido_qa and args.report.exists():
        previous = json.loads(args.report.read_text(encoding='utf-8'))
        if previous.get('pedido_qa'):
            raise RuntimeError('El reporte ya contiene un pedido QA: no crear otro. Revisa el resultado existente.')
    assert args.api.startswith('https://') and args.web.startswith('https://')
    admin = build_opener()
    cookies = http.cookiejar.CookieJar()
    customer = build_opener(HTTPCookieProcessor(cookies))
    token = ''
    def call(base, path, body=None, method=None, web=False, authenticated=False):
        headers = {'Content-Type': 'application/json'}
        if authenticated: headers['Authorization'] = 'Bearer ' + token
        if web: headers['Origin'] = args.web
        request = Request(base + path, None if body is None else json.dumps(body).encode(),
                          headers, method=method or ('GET' if body is None else 'POST'))
        try:
            with (customer if web else admin).open(request, timeout=45) as response:
                raw = response.read()
                return response, json.loads(raw) if 'json' in response.headers.get('Content-Type', '') else raw
        except HTTPError as error:
            raise RuntimeError(f'{path}: HTTP {error.code}') from None
    def internal(path, body=None, method=None):
        return call(args.api, path, body, method, authenticated=True)[1]
    token = call(args.api, '/auth/login', {'username': os.environ['TRANSFER_USERNAME'],
                                         'password': os.environ['TRANSFER_PASSWORD']})[1]['token']
    products = internal('/productos')
    entries = json.loads((args.bundle / 'catalogo.json').read_text(encoding='utf-8'))['productos']
    expected = {entry['producto']['sku']: entry for entry in entries}
    assert len(products) == len(expected) == 58 and len({p['sku'] for p in products}) == 58
    for product in products:
        original = expected[product['sku']]
        assert product['stock'] == original['stock'], product['sku']
        for field in ('nombre', 'categoria', 'marca', 'precioCompra', 'precioVenta', 'stockMinimo', 'activo'):
            assert product[field] == original['producto'][field], (product['sku'], field)
        for field in ('descripcion', 'especificaciones', 'destacado', 'precioAnterior'):
            assert product[field] == original['producto']['web'][field], (product['sku'], field)
    def image(product):
        assert product['imagenUrl']
        name = product['imagenUrl'].split('/')[-1]
        content = call(args.api, '/productos/imagenes/' + name)[1]
        assert hashlib.sha256(content).hexdigest() == expected[product['sku']]['sha256']
        response, optimized = call(args.web, '/media/' + name + '?w=320')
        assert response.headers.get('Content-Type', '').startswith('image/') and len(optimized) > 100
        return product['sku']
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        images = list(pool.map(image, products))
    public = call(args.api, '/public/productos?tamano=24')[1]
    assert public['total'] == 58
    assert not any(key in public['items'][0] for key in ('precioCompra', 'stockMinimo', 'vendedorId'))
    for path in ('/inicio/resumen', '/inventario', '/pedidos-web', '/ventas', '/reportes/resumen', '/clientes'):
        internal(path)
    report = {'productos': 58, 'categorias': len({p['categoria'] for p in products}),
              'imagenes_backend_y_vercel': len(images), 'sku_unicos': True,
              'catalogo_identico_al_bundle': True, 'api_interna': 'OK'}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    def save(): args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    save()
    print('Catálogo, stock, campos comerciales y 58 imágenes backend/Vercel verificados.', flush=True)
    if not args.pedido_qa: return
    password = secrets.token_urlsafe(24)
    email = 'despliegue-' + uuid.uuid4().hex + '@example.invalid'
    response, registration = call(args.web, '/api/cuenta/registro', {
        'nombres': 'QA', 'apellidos': 'DESPLIEGUE CLOUD', 'email': email,
        'password': password, 'telefono': '999999999'}, web=True)
    cookie = response.headers.get('Set-Cookie', '')
    assert 'HttpOnly' in cookie and 'Secure' in cookie and 'SameSite=Lax' in cookie
    assert 'token' not in registration
    assert call(args.web, '/cuenta', web=True)[0].headers.get('Cache-Control') == 'no-store'
    call(args.web, '/api/cuenta/logout', {}, web=True)
    call(args.web, '/api/cuenta/login', {'email': email, 'password': password}, web=True)
    chosen = min((p for p in products if p['activo'] and p['stock'] > 1), key=lambda p: p['precioVenta'])
    request = {'clave': str(uuid.uuid4()), 'lineas': [{'productoId': chosen['id'], 'cantidad': 1, 'precio': 1}], 'total': 1}
    result = call(args.web, '/api/cuenta/pedido', request, web=True)[1]
    assert call(args.web, '/api/cuenta/pedido', request, web=True)[1]['id'] == result['id']
    assert call(args.web, result['destino'], web=True)[0].status == 200
    path = '/pedidos-web/' + result['id']
    order = internal(path)['pedido']
    assert order['estado'] == 'PENDIENTE' and order['total'] == chosen['precioVenta']
    assert order['codigoRecojo'].startswith('STR-')
    assert next(p for p in internal('/productos') if p['id'] == chosen['id'])['stock'] == chosen['stock']
    report['pedido_qa'] = {'id': result['id'], 'codigo': order['codigoRecojo'], 'sku': chosen['sku'], 'total': order['total']}
    save()
    confirmed = False
    delivered = False
    try:
        order = internal(path + '/confirmar', {})
        confirmed = True
        assert order['estado'] == 'CONFIRMADO'
        assert next(p for p in internal('/productos') if p['id'] == chosen['id'])['stock'] == chosen['stock'] - 1
        assert internal(path + '/listo', {})['estado'] == 'LISTO_PARA_RECOGER'
        order = internal(path + '/entregar', {})
        delivered = True
        assert order['estado'] == 'ENTREGADO' and order['ventaId']
        sale = internal('/ventas/' + order['ventaId'])
        assert sale['venta']['origen'] == 'WEB' and sale['venta']['total'] == chosen['precioVenta']
        assert next(p for p in internal('/productos') if p['id'] == chosen['id'])['stock'] == chosen['stock'] - 1
        assert internal('/reportes/resumen')['ventasWeb'] >= 1
        report['pedido_qa'].update({'estado': order['estado'], 'venta_id': order['ventaId'], 'origen': 'WEB'})
        save()
    finally:
        if delivered:
            restored = internal('/inventario/movimientos', {'productoId': chosen['id'], 'tipo': 'ENTRADA',
                'cantidad': 1, 'motivo': 'Restitución de unidad QA despliegue cloud: ' + order['codigoRecojo']})
            assert restored['stock'] == chosen['stock']
            report['stock_restituido_con_movimiento'] = True
        elif confirmed:
            internal(path + '/cancelar', {})
            report['pedido_qa_cancelado_y_reserva_liberada'] = True
        save()
    # Conservar venta y pedido entregado para trazabilidad; inactivar únicamente el cliente QA.
    qa = next(c for c in internal('/clientes') if c.get('correo') == email)
    inactive = internal('/clientes/' + qa['id'], method='DELETE')
    report['cliente_qa'] = {'id': qa['id'], 'resultado': inactive}
    save()
    try:
        call(args.web, '/api/cuenta/login', {'email': email, 'password': password}, web=True)
        raise AssertionError('Cliente QA inactivo conserva acceso')
    except RuntimeError as error:
        assert 'HTTP 401' in str(error) or 'HTTP 403' in str(error)
    report['login_cliente_inactivo_rechazado'] = True
    save()
    print(json.dumps(report, ensure_ascii=False), flush=True)

if __name__ == '__main__': main()
