import { NextResponse } from "next/server";
import { readProductImage } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename) {
      return new NextResponse("Filename is required", { status: 400 });
    }

    const result = await readProductImage(filename);
    if (!result) {
      return new NextResponse("Image not found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
