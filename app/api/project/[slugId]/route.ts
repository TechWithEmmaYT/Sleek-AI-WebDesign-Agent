import { getAuthServer } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest,
  { params }: { params: Promise<{ slugId: string }> }
) {
  try {
    const { slugId } = await params;
    const { user, insforge } = await getAuthServer()
    if (!user) return NextResponse.json({
      error: "Unauthorized"
    }, { status: 401 })

    const { data: project, error } = await insforge.database.from("projects")
      .select("id, title")
      .eq("slugId", slugId)
      .single()

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    if (error) throw new Error("Project failed fetch");

    const { data: messages } = await insforge.database.from("messages")
      .select("*")
      .eq("projectId", project.id)
      .order("createdAt", { ascending: true })

    const { data: pages } = await insforge.database.from("pages")
      .select("*")
      .eq("projectId", project.id)
      .order("createdAt", { ascending: true })

    const mappedMessages = (messages || []).map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts,
      createdAt: message.createdAt
    }))

    return NextResponse.json({
      title: project.title,
      messages: mappedMessages,
      pages: pages
    })


  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error: "Internal Server error",
    }, { status: 500 })
  }
}
