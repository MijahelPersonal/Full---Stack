import type { APIRoute } from "astro";
import { estadoCatalogo, listarProductos } from "../../lib/tienda";
import { slugCategoria, categoriasRelacionadas } from "../../lib/shared";
import { ApiError } from "../../lib/catalogo";
export const GET: APIRoute = async ({ url }) => {
  try {
    const q = url.searchParams.get("search") || "";
    if (q.length > 120)
      return Response.json({ error: "Búsqueda inválida" }, { status: 400 });
    const estado = await estadoCatalogo();
    const params = new URLSearchParams({ search: q, tamano: "6" });
    const categoria = url.searchParams.get("categoria");
    if (categoria) params.set("categoria", categoria);
    const pagina = await listarProductos(estado, params);
    return Response.json(
      {
        items: pagina.items,
        categorias: categoriasRelacionadas(
          estado.categorias,
          pagina.items,
          q,
        ).map((nombre) => ({ nombre, slug: slugCategoria(nombre) })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: "No pudimos consultar el catálogo" },
      {
        status: e instanceof ApiError && e.status === 400 ? 400 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
};
