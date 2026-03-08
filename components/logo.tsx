"use client";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Logo({
  className,
  iconClassName,
  showName = true
}: {
  className?: string,
  iconClassName?: string,
  showName?: boolean
}) {
  return (
    <Link href="/" className="flex items-center gap-3 group cursor-pointer h-full">
      <div className={cn(`relative flex items-center justify-center rounded-xl
            bg-linear-to-br from-primary to-primary/80
            p-2 shadow-lg shadow-primary/10 transition-all duration-300 `, className)}>
        <Sparkles className={cn("h-5 w-5 text-primary-foreground fill-primary-foreground/20", iconClassName)} />
      </div>

      {showName && (
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tighter text-foreground transition-colors group-hover:text-primary">
            Sleek<span className="text-primary">.</span>
          </span>
        </div>
      )}
    </Link>
  );
}
