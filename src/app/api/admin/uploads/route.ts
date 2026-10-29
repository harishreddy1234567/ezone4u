import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  validateImageFile,
  generateSecureFilename,
  saveProductImage,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/storage";

export async function POST(request: Request) {
  // 1. Enforce admin authentication
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    // Support either multiple files under "files" or single under "file"
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      const singleFile = formData.get("file") as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image files provided for upload." },
        { status: 400 }
      );
    }

    const uploadedFiles: Array<{
      url: string;
      originalName: string;
      size: number;
      mimeType: string;
    }> = [];

    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(
          `"${file.name}": File size (${(file.size / (1024 * 1024)).toFixed(
            2
          )} MB) exceeds the 5 MB limit.`
        );
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const validation = validateImageFile(buffer, file.name, file.type);
      if (!validation.valid || !validation.normalizedExtension) {
        errors.push(`"${file.name}": ${validation.error || "Invalid image."}`);
        continue;
      }

      // Generate unique secure filename
      const uniqueFilename = generateSecureFilename(
        validation.normalizedExtension
      );

      // Save to persistent storage and public directory
      const publicUrl = await saveProductImage(buffer, uniqueFilename);

      uploadedFiles.push({
        url: publicUrl,
        originalName: file.name,
        size: file.size,
        mimeType: validation.mimeType || file.type,
      });
    }

    if (uploadedFiles.length === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: errors.join(" "),
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} image${
        uploadedFiles.length === 1 ? "" : "s"
      }.`,
      files: uploadedFiles,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while processing uploaded files.",
      },
      { status: 500 }
    );
  }
}
