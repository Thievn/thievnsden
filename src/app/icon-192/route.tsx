import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  const buf = await readFile(join(process.cwd(), "public/mark/icon-192.png"));
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
