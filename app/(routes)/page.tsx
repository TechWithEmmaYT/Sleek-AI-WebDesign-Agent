import ChatInterface from "@/components/chat";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <ChatInterface isProjectPage={false} />
    </div>
  );
}
