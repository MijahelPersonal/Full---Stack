import type { APIRoute } from "astro";
import { estadoCatalogo, detalleProducto } from "../../lib/tienda";
import { ApiError, type Producto } from "../../lib/catalogo";
export const GET: APIRoute = async ({ url }) => {
  const slugs = [
    ...new Set(
      (url.searchParams.get("slugs") || "").split(",").filter(Boolean),
    ),
  ];
  if (slugs.length > 30 || slugs.some((s) => !/^[a-z0-9-]{1,128}$/.test(s)))
    return Response.json({ error: "Selección inválida" }, { status: 400 });
  try {
    await estadoCatalogo();
    const items: Producto[] = [];
    let siguiente = 0;
    await Promise.all(
      Array.from({ length: Math.min(4, slugs.length) }, async () => {
        while (siguiente < slugs.length) {
          const slug = slugs[siguiente++];
          try {
            items.push(await detalleProducto(slug));
          } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) throw e;
          }
        }
      }),
    );
    return Response.json(
      { items },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "No pudimos actualizar precio y stock" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
};
