"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, LogOut, User } from "lucide-react"
import { Logo } from "@/components/layout/Logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser, AuthChangeEvent, Session } from "@supabase/supabase-js"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    // Get initial session
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email.substring(0, 2).toUpperCase()
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/calculators/valuation"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Calculators
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>

            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">My Account</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/signup">Sign up</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link
              href="/calculators/valuation"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Calculators
            </Link>
            <Link
              href="/pricing"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/account"
                      className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button size="sm" asChild className="w-full">
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Sign up
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
