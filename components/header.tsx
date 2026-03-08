"use client"

import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Logo } from "./logo"
import { Button } from "./ui/button"
import { DarkModeToggle } from "./dark-mode-toggle"
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth, UserButton } from "@insforge/nextjs"
import { Spinner } from "./ui/spinner"

const Header = () => {
  const pathname = usePathname()
  const { isLoaded } = useAuth();

  const isProjectPage = pathname.startsWith('/project/')

  return (
    <header className="w-full">
      <div className={cn(`w-full flex py-3.5 px-8
         items-center justify-between
         `,
        isProjectPage && "absolute top-0 z-50 px-2 py-1 right-0 w-auto"
      )}>

        <div>
          {!isProjectPage && <Logo />}
        </div>

        <div className="flex items-center justify-end gap-3">
          <DarkModeToggle />

          {!isLoaded ? <Spinner className="w-8 h-8" /> : (
            <>
              <SignedOut>
                <SignInButton>
                  <Button variant="outline">Login</Button>
                </SignInButton>
                <SignUpButton>
                  <Button>Sign up</Button>
                </SignUpButton>
              </SignedOut>

              <SignedIn>
                <UserButton
                  mode="simple"
                  afterSignOutUrl="/"
                  showProfile
                />
              </SignedIn>

            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
