import ChatInterface from "@/components/chat";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

export default function Home() {
  return (
    <div>
      <Suspense
        fallback={<div className="flex items-center justify-center "><Spinner className="size-18 stroke-2" /></div>}
      >
        <ChatInterface isProjectPage={false} />
      </Suspense>

    </div>
  );
}
