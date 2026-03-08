import { BASE_VARIABLES, FONT_VARIABLES } from "./prompt";

export function getHTMLWrapper(
  htmlContent: string,
  name = "Untitled",
  rootStyles: string,
  pageId: string
) {

  const sanitizedHtml = htmlContent
    // Remove h-screen, min-h-screen, h-full from root div specifically
    .replace(
      /<div([^>]*)class="([^"]*)\b(h-screen|min-h-screen|h-full)\b([^"]*)"([^>]*)>/i,
      '<div$1class="$2$4"$5>'
    )
    // Remove min-h-screen from all sections (they should grow naturally)
    .replace(
      /<section([^>]*)class="([^"]*)\bmin-h-screen\b([^"]*)"([^>]*)>/gi,
      '<section$1class="$2$3"$4>'
    );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${name}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>

  <style type="text/tailwindcss">
    :root {${rootStyles}${FONT_VARIABLES}${BASE_VARIABLES}}
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {width:100%;min-height:100%;}
    body {font-family:var(--font-sans);background:var(--background);color:var(--foreground);-webkit-font-smoothing:antialiased;}
    #root {width:100%;min-height:100vh;}
    * {scrollbar-width:none;-ms-overflow-style:none;}
    *::-webkit-scrollbar {display:none;}

  </style>
</head>
<body>
  <div id="root">
    <div id="content" class="relative">
      ${sanitizedHtml}
    </div>
  </div>

  <script>
    (()=>{
      const pageId='${pageId}';
      const send=()=>{
        const r=document.getElementById('root')?.firstElementChild;
        const h=r?.className.match(/h-(screen|full)|min-h-screen/)?Math.max(900,innerHeight):Math.max(r?.scrollHeight||0,document.body.scrollHeight,900);
        parent.postMessage({type:'FRAME_HEIGHT',pageId:pageId,height:h},'*');
      };
      setTimeout(send,100);
      setTimeout(send,500);
    })();
  </script>
</body>
</html>`;
}
