import { NextRequest, NextResponse } from "next/server";
import { convertModelMessages, generateProjectTitle } from "@/app/action/action";
import { getAuthServer } from "@/lib/insforge-server";
import { createUIMessageStream, createUIMessageStreamResponse, generateId, UIMessage } from "ai";
import { SLEEK_CHAT_PROMPT, SLEEK_INTENT_PROMPT, WEB_ANALYSIS_PROMPT, WEB_GENERATION_PROMPT } from "@/lib/prompt";

class AbortError extends Error {
  constructor() {
    super('Request aborted');
    this.name = 'AbortError';
  }
}


export async function GET() {
  try {
    const { user, insforge } = await getAuthServer();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: projects, error } = await insforge.database.from("projects")
      .select("id, title, slugId, createdAt")
      .order("createdAt", { ascending: false })
      .limit(10);

    if (error) NextResponse.json({ error: "Failed to fetch projects" }, {
      status: 400
    });

    return NextResponse.json(projects)
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}

const emit = (
  writer: any,
  type: string,
  data: object = {},
  options?: {
    id?: string;
    transient?: boolean
  }
) => {
  writer.write({
    id: options?.id,
    type: `data-${type}`,
    data,
    transient: options?.transient
  })
}

async function runGenerationWorker({
  insforge,
  writer,
  projectId,
  analysis,
  existingPages,
  latestUserMessage,
  checkAbort,
}: any) {
  const { pages } = analysis;
  console.log(pages?.length, pages, "pages")

  if (!analysis || !pages || pages?.length === 0) {
    throw new Error("No pages generated");
  }

  // emit to the chat
  emit(writer, "generation", {
    status: "generating",
    pages: pages.map((page: any) => ({
      id: page.id,
      name: page.name,
      done: false
    }))
  }, { id: "gen-card" })

  // emit pages
  emit(writer, "pages-skeleton", {
    pages: pages.map((page: any) => ({
      id: page.id,
      name: page.name,
      rootStyles: page.rootStyles,
      htmlContent: "",
      isLoading: true
    }))
  }, { transient: true });

  const generationPages: { name: string; htmlContent: string }[] = [] = [
    ...(existingPages?.map((page: any) => (
      { name: page.name, htmlContent: page.htmlContent }
    ))) || []
  ]

  for (const page of pages) {
    checkAbort()

    emit(writer, "generation", {
      status: "generating",
      currentPageId: page.id,
      pages: pages.map((page: any) => ({
        id: page.id,
        name: page.name,
        done: generationPages.some((gp: any) => gp.name === page.name)
      }))
    }, { id: "gen-card" })


    const previousPagesContext = generationPages.length > 0
      ? generationPages.slice(-2).map((p) => `<!--${p.name}-->\n${p.htmlContent}`).join('\n\n')
      : "No previous pages";

    const result = await insforge.ai.chat.completions.create({
      model: 'google/gemini-3.1-pro-preview',
      messages: [
        {
          role: "system",
          content: WEB_GENERATION_PROMPT,
        },
        {
          role: 'user',
          content: `
 GENERATE HTML FOR THE FOLLOWING PAGE:
- Page Name: ${page.name}
- Page Purpose: ${page.purpose}
- Visual Description: ${page.visualDescription}
- Theme Variables for this page (already injected in :root — reference via var(), do NOT redeclare):
${page.rootStyles}
- Context from previous pages : ${previousPagesContext}

    CRITICAL REQUIREMENTS:
    1. STYLE PRIORITY: Follow the "Visual Description" above as the ultimate source of truth.
    2. OUTPUT FORMAT: Generate ONLY raw HTML markup. Start exactly with <div. Do not include \`\`\`html or any markdown wrappers.
    CRITICAL:
        1. Generate ONLY raw HTML markup production-ready responsive web page using Tailwind CSS for layout spacing, typography, shadows, etc.
        2. **All content must be inside a single root <div> that controls the layout.**
            - No overflow classes on the root.
            - All scrollable content must be in inner containers with hidden scrollbars: [&::-webkit-scrollbar]:hidden scrollbar-none
        3. ***Important*** For absolute overlays (maps, modals, etc.):**
            - Use \`relative w-full h-screen\` on the top div of the overlay.
        4. ***Important*** For regular content:**
            - Use \`w-full h-full min-h-screen\` on the top div.
        5. ***Important*** Do not use h-screen on inner content unless absolutely required.**
            - Height must grow with content; content must be fully visible inside an iframe.
        6. **For z-index layering:**
            - Ensure absolute elements do not block other content unnecessarily.
        7. **Output raw HTML only, starting with <div>.**
            - Do not include markdown, comments, <html>, <body>, or <head>.
        8. **Hardcode a style only if a theme variable is not needed for that element.**
        9. **Ensure iframe-friendly rendering:**
            - All elements must contribute to the final scrollHeight so your parent iframe can correctly resize.
        Generate the complete, production-ready HTML for "${page.name}" now:`.trim(),
        }
      ],
      webSearch: { enabled: false },
      maxTokens: 30000
    })

    let htmlContent = result.choices[0].message.content ?? ""
    const match = htmlContent.match(/<div[\s\S]*<\/div>/);
    htmlContent = match ? match[0] : htmlContent;
    htmlContent = htmlContent.replace(/```/g, "")

    const { data: savedPage, error } = await insforge.database.from("pages").insert([
      {
        projectId,
        name: page.name,
        rootStyles: page.rootStyles,
        htmlContent
      }
    ]).select().single();

    if (error) console.log(error, "Page failed to save")

    generationPages.push({
      name: page.name,
      htmlContent: htmlContent
    })

    emit(writer, "generation", {
      status: "generating",
      currentPageId: page.id,
      pages: pages.map((page: any) => ({
        id: page.id,
        name: page.name,
        done: generationPages.some((gp: any) => gp.name === page.name)
      }))
    }, { id: "gen-card" })

    emit(writer, "page-created", {
      tempId: page.id,
      page: {
        id: savedPage.id,
        name: savedPage.name,
        rootStyles: savedPage.rootStyles,
        htmlContent: savedPage.htmlContent,
        isLoading: false
      }
    }, { transient: true });
  }

  emit(writer, "generation", {
    status: "complete",
    pages: pages.map((p: any) => ({
      id: p.id,
      name: p.name,
      done: true
    }))
  }, { id: "gen-card" })

  const summaryResult = await insforge.ai.chat.completions.create({
    model: 'google/gemini-2.5-flash-lite',
    messages: [
      {
        role: "system",
        content: `You are Sleek, an AI web design agent. You just finished building pages.
Write 1-2 sentences in first person. Natural, confident. No questions. No "let me know".`
      },
      {
        role: 'user',
        content: `Designed: ${pages.map((p: any) => p.name).join(', ')} for: "${latestUserMessage}". Summarize briefly.`
      }

    ],
    stream: true,
    webSearch: { enabled: false }
  })

  const summaryId = generateId();
  let fullSummaryText = "";

  writer.write({ type: "text-start", id: summaryId })
  for await (const chunk of summaryResult) {
    const delta = chunk.choices[0].delta?.content || "";
    fullSummaryText += delta
    if (delta) {
      writer.write({ type: "text-delta", id: summaryId, delta: delta })
    }
  }
  writer.write({ type: "text-end", id: summaryId });

  checkAbort()
  await insforge.database.from("messages").insert([
    {
      projectId,
      role: "assistant",
      parts: [
        {
          type: "data-generation",
          id: "gen-card",
          data: {
            status: "complete",
            pages: pages.map((p: any) => ({
              id: p.id,
              name: p.name,
              done: true
            }))
          }
        },
        { type: "text", text: fullSummaryText }
      ]
    }
  ])

}

async function runRegenerateWorker({
  insforge,
  writer,
  projectId,
  selectedPage,
  latestUserMessage,
  analysis,
  checkAbort,
}: any) {
  if (!selectedPage) {
    writer.write({
      type: "error",
      errorText: "No Page was selected "
    })
    return
  }

  if (!analysis || analysis?.pages?.length === 0) {
    throw new Error("No pages generated");
  }

  emit(writer, "page-loading", {
    pageId: selectedPage.id,
    isLoading: true
  }, { transient: true })

  emit(writer, "generation", {
    status: "regenerating",
    regeneratePage: {
      id: selectedPage.id,
      name: selectedPage.name,
      done: false
    }
  }, { id: "gen-card" })

  const result = await insforge.ai.chat.completions.create({
    model: "google/gemini-3-flash-preview",
    messages: [
      {
        role: "system",
        content: WEB_GENERATION_PROMPT,
      },
      {
        role: "user",
        content: `
                You are surgically editing an existing page.
                RULE: Return the COMPLETE page HTML with ONLY the requested change applied. Every other section, component, and element must remain exactly as it is in the Current HTML.

                EDITING: "${selectedPage.name}"
                USER REQUEST: "${latestUserMessage}"
                CHANGE ONLY: ${analysis.pages[0].visualDescription}
                Current HTML: ${selectedPage.htmlContent}
                Return the full page HTML with only the requested change. Start with <div.`.trim()
      }
    ],
    webSearch: { enabled: false },
    maxTokens: 28000
  });

  let htmlContent = result.choices[0].message.content ?? '';
  const match = htmlContent.match(/<div[\s\S]*<\/div>/);
  htmlContent = match ? match[0] : htmlContent;
  htmlContent = htmlContent.replace(/```/g, '');

  const { data: updatedPage, error } = await insforge.database.from("pages")
    .update({
      htmlContent,
      rootStyles: analysis.rootStyles
    })
    .eq("id", selectedPage.id).select().single()

  if (error) {
    console.log(error, "Failed to update selected Page")
  }

  emit(writer, "page-created", {
    page: {
      id: updatedPage.id,
      name: updatedPage.name,
      rootStyles: updatedPage.rootStyles,
      htmlContent: updatedPage.htmlContent,
      isLoading: false,
    }
  }, { transient: true })

  emit(writer, "generation", {
    status: "complete",
    regeneratePage: {
      id: updatedPage.id,
      name: updatedPage.name,
      done: true
    }
  }, { id: "gen-card" })


  const summaryResult = await insforge.ai.chat.completions.create({
    model: 'google/gemini-2.5-flash-lite',
    messages: [
      {
        role: "system",
        content: `You are Sleek, an AI web design agent. You just finished building pages.
Write 1-2 sentences in first person. Natural, confident. No questions. No "let me know".`
      },
      {
        role: 'user',
        content: `Updated: ${updatedPage.name} for: "${latestUserMessage}". Summarize briefly.`
      }

    ],
    stream: true,
    webSearch: { enabled: false }
  })

  const summaryId = generateId();
  let fullSummaryText = "";

  writer.write({ type: "text-start", id: summaryId })
  for await (const chunk of summaryResult) {
    const delta = chunk.choices[0].delta?.content || "";
    fullSummaryText += delta
    if (delta) {
      writer.write({ type: "text-delta", id: summaryId, delta: delta })
    }
  }
  writer.write({ type: "text-end", id: summaryId });

  checkAbort()
  await insforge.database.from("messages").insert([
    {
      projectId,
      role: "assistant",
      parts: [
        {
          type: "data-generation",
          id: "gen-card",
          data: {
            status: "complete",
            regeneratePage: {
              id: updatedPage.id,
              name: updatedPage.name,
              done: true
            }
          }
        },
        { type: "text", text: fullSummaryText }
      ]
    }
  ])


}


export async function POST(request: NextRequest) {
  const { signal } = request;
  try {
    const { messages, slugId, selectedPageId } = await request.json() as {
      messages: UIMessage[];
      slugId: string;
      selectedPageId: string;
    }

    const { user, insforge } = await getAuthServer()
    if (!user?.id) return NextResponse.json({
      error: "Unauthorized"
    }, { status: 401 })

    let { data: project, error: projectError } = await insforge.database
      .from("projects")
      .select("id, title")
      .eq("slugId", slugId)
      .single();

    if (!project) {
      console.log("creating new project");
      const lastMessage = messages[messages.length - 1];
      const messageText = lastMessage?.parts.find((part) =>
        part.type === "text"
      )?.text as string
      const title = await generateProjectTitle(messageText);
      const { data: newProject, error } = await insforge
        .database
        .from("projects")
        .insert([
          {
            slugId,
            title,
            userId: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error;
      if (!newProject) throw new Error("Failed to create project");

      project = newProject
    }

    const projectId = project!.id;

    const { data: existingPages } = await insforge.database.from("pages")
      .select("id, name, rootStyles, htmlContent")
      .eq("projectId", projectId)
      .order("createdAt", { ascending: true })
      .limit(2)

    const hasExistingPages = existingPages && existingPages.length

    const lastMessage = messages[messages.length - 1];
    await insforge.database.from("messages").insert([
      {
        projectId,
        role: "user",
        parts: lastMessage.parts
      }
    ])

    const modelMessages = await convertModelMessages(messages.slice(10))

    const latestUserMessage = (lastMessage.parts?.find((p: any) => p.type === 'text') as any)?.text;
    const imageParts = lastMessage.parts.filter((part) => part.type === "file" && part.mediaType.startsWith("image/"))
      .map((p: any) => ({
        type: "image_url" as const,
        image_url: {
          url: p.url
        }
      }))

    const { data: selectedPage } = selectedPageId ? await insforge.database.from("pages")
      .select("id, name, rootStyles, htmlContent")
      .eq("id", selectedPageId)
      .single()
      : { data: null }

    const checkAbort = () => {
      if (signal.aborted) throw new AbortError()

    }

    const uiStream = createUIMessageStream({
      generateId: generateId,
      async execute({ writer }) {
        let genCardEmitted = false;
        try {

          if (project?.title) {
            emit(writer, "project-title", {
              title: project.title
            }, { id: "proj-title", transient: true, })
            // writer.write({
            //   type: "data-project-title",
            //   data: {
            //     title: project.title
            //   },
            //   transient: true,
            // })

            checkAbort();
            const result = await insforge.ai.chat.completions.create({
              model: 'anthropic/claude-sonnet-4.5',
              messages: [
                {
                  role: "system",
                  content: SLEEK_INTENT_PROMPT,
                },
                {
                  role: "user",
                  content: `${latestUserMessage}\nCLASSIFY THE INTENT NOW. ONE WORD ONLY`
                }
              ]
            })

            const classify_output = (result.choices[0].message.content).trim().toLowerCase();

            const firstWord = classify_output.split(' ')[0];
            const validIntents = ["chat", "generate", "regenerate"];
            const intent = validIntents.includes(firstWord) ?
              firstWord as any : 'chat'

            const classification = { intent }

            // CLASSIFICATION MATCHES CHAT
            if (classification.intent === "chat") {
              const chatResult = await insforge.ai.chat.completions.create({
                model: "google/gemini-2.5-pro",
                messages: [
                  {
                    role: "system",
                    content: SLEEK_CHAT_PROMPT
                  },
                  ...modelMessages
                ],
                stream: true,
                webSearch: { enabled: false }
              })

              const chatId = generateId();
              let chatText = "";

              writer.write({ type: "text-start", id: chatId })

              for await (const chunk of chatResult) {
                checkAbort();
                const delta = chunk.choices[0]?.delta?.content || "";
                chatText += delta;
                if (delta) {
                  writer.write({
                    type: "text-delta",
                    id: chatId,
                    delta
                  })
                }
              }

              writer.write({ type: "text-end", id: chatId })
              checkAbort();

              await insforge.database.from("messages").insert([{
                projectId,
                role: "assistant",
                parts: [
                  { type: "text", text: chatText }
                ]
              }])

              return;
            }

            const isRegen = classification.intent === "regenerate" && !!selectedPage

            console.log(classification, "classification", isRegen)

            emit(writer, "generation", {
              status: "analyzing",
              page: []
            },
              {
                id: "gen-card"
              }
            )

            genCardEmitted = true

            const analysisResult = await insforge.ai.chat.completions.create({
              model: 'anthropic/claude-sonnet-4.5',
              messages: [
                {
                  role: "system",
                  content: WEB_ANALYSIS_PROMPT
                },
                {
                  role: "user",
                  content: [
                    ...imageParts,
                    {
                      type: "text",
                      text: `${imageParts.length > 0
                        ? `Reference image attached — extract EVERY detail: colors, layout, components, spacing. Match it precisely.\n\n`
                        : ''}
    ${selectedPage && isRegen
                          ? `EDITING THIS PAGE:\n- Name: ${selectedPage.name}\n- Current Styles:\n${selectedPage.rootStyles}\n- Current HTML:\n${selectedPage.htmlContent}\nBe surgical apply only requested changes.\n\n`
                          : selectedPage && !isRegen
                            ? `STYLE REFERENCE (match this visual DNA for new pages):\n- Name: ${selectedPage.name}\n- Styles:\n${selectedPage.rootStyles}\n\n`
                            : ''}
        ${hasExistingPages && !isRegen
                          ? `EXISTING PAGES (do NOT recreate):\n${existingPages!.map((p: any) => `- ${p.name}\n${p.rootStyles}`).join('\n')}\n\n`
                          : ''}
        USER REQUEST: "${latestUserMessage}"OUTPUT RAW JSON ONLY.`.trim()
                    }

                  ]
                }
              ],
              maxTokens: 28000,
            });

            checkAbort();

            let analysis: any;
            const analysisText = analysisResult.choices[0].message.content || '{}'

            try {
              const jsonStart = analysisText.indexOf('{');
              const jsonEnd = analysisText.lastIndexOf('}');
              if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON object found");
              const cleanJson = analysisText.substring(jsonStart, jsonEnd + 1);
              analysis = JSON.parse(cleanJson)
            } catch (error) {
              console.log("Analysis error", error);
              throw new Error("Failed to parse json output");
            }

            if (isRegen && selectedPageId) {
              checkAbort();
              await runRegenerateWorker({
                insforge,
                writer,
                projectId,
                selectedPage,
                latestUserMessage,
                analysis,
                checkAbort,
              })
              return
            }

            checkAbort();
            await runGenerationWorker({
              insforge,
              writer,
              projectId,
              analysis,
              existingPages,
              latestUserMessage,
              checkAbort,
            });
          }
        } catch (error) {
          console.log(error)
          if (error instanceof AbortError) {
            if (genCardEmitted) {
              emit(writer, "generation", { status: "canceled" }, {
                id: "gen-card"
              })
              writer.write({ type: "abort", })
            }
            return
          }

          emit(writer, 'generation', { status: 'error' }, { id: 'gen-card' });

          writer.write({ type: "error", errorText: "Something went wrong" })
        }
      }
    })

    return createUIMessageStreamResponse({
      stream: uiStream
    })

  } catch (error) {
    console.log(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
