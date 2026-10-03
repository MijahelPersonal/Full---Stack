import type { Producto } from "./catalogo";
export type { Producto };
export const dinero = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    n,
  );
export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
export function categoriasRelacionadas(
  categorias: string[],
  productos: Producto[],
  busqueda: string,
) {
  const presentes = new Set(productos.map((p) => p.categoria));
  return categorias
    .filter(
      (c) => presentes.has(c) || normalizar(c).includes(normalizar(busqueda)),
    )
    .slice(0, 5);
}
export const slugCategoria = (s: string) =>
  normalizar(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const descuento = (p: Producto) =>
  p.precioAnterior && p.precioAnterior > p.precio
    ? Math.round((1 - p.precio / p.precioAnterior) * 100)
    : 0;
export const contacto = {
  telefono: "927919090",
  whatsapp: "https://wa.me/51927919090",
  correo: "mijahelrojaspersonal@gmail.com",
};
export function visualCategoria(nombre: string) {
  const n = normalizar(nombre);
  for (const [regex, visual] of [
    [/procesador|cpu/, "cpu"],
    [/grafica|video|gpu/, "gpu"],
    [/placa|mother/, "board"],
    [/memoria|ram/, "ram"],
    [/ssd|almacen|disco/, "ssd"],
    [/laptop|portatil/, "laptop"],
    [/teclado/, "keyboard"],
    [/mouse|raton/, "mouse"],
    [/monitor/, "monitor"],
    [/audifono|head/, "headset"],
    [/case|gabinete/, "case"],
  ] as const)
    if (regex.test(n)) return visual;
  return "box";
}
export function grupoCategoria(nombre: string) {
  const v = visualCategoria(nombre);
  return ["cpu", "gpu", "board", "ram", "ssd", "case"].includes(v)
    ? "Componentes"
    : ["laptop", "monitor"].includes(v)
      ? "Equipos"
      : ["keyboard", "mouse", "headset"].includes(v)
        ? "Periféricos"
        : "Accesorios";
}
