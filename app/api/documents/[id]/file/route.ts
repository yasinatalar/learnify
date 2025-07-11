import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: documentId } = await params

    // Get document and verify ownership
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
      select: {
        id: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        fileData: true,
      }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    if (!document.fileData) {
      return NextResponse.json(
        { success: false, error: "Original file not available" },
        { status: 404 }
      )
    }

    // Return the file with proper headers
    return new NextResponse(document.fileData, {
      headers: {
        'Content-Type': document.fileType,
        'Content-Length': document.fileSize.toString(),
        'Content-Disposition': `inline; filename="${document.originalName}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("File serve error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to serve file" },
      { status: 500 }
    )
  }
}