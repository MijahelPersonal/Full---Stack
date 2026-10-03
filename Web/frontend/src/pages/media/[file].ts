import type { APIRoute } from "astro";
import sharp from "sharp";
import { origen } from "../../lib/catalogo";
// Caché nativa acotada; no se conserva una colección creciente de imágenes.
sharp.cache({ memory: 32, files: 0, items: 32 });
sharp.concurrency(2);
export const GET: APIRoute = async ({ params, url }) => {
  const file = params.file || "";
  const width = Number(url.searchParams.get("w") || 640);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(
      file,
    ) ||
    ![320, 640, 960].includes(width)
  )
    return new Response(null, { status: 404 });
  try {
    const r = await fetch(`${origen()}/api/productos/imagenes/${file}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok)
      return new Response(null, { status: r.status === 404 ? 404 : 503 });
    if (Number(r.headers.get("content-length")) > 2097152)
      return new Response(null, { status: 413 });
    const bytes = await r.arrayBuffer();
    if (bytes.byteLength > 2097152) return new Response(null, { status: 413 });
    const output = await sharp(Buffer.from(bytes), {
      limitInputPixels: 16000000,
    })
      .rotate()
      .resize(width, width, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return new Response(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
};
