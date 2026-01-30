"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const target = event.target as typeof event.target & {
      email: { value: string }
    }
    const email = target.email.value
    const supabase = createClient()

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        })
        if (error) throw error
        setIsSuccess(true)
    } catch (err: any) {
        setError(err.message || "Something went wrong")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 md:left-8 md:top-8"
        )}
      >
        Back to Login
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a reset link
          </p>
        </div>

        {isSuccess ? (
             <div className="text-center space-y-4">
                <p className="text-green-600">Check your email for the reset link.</p>
                <Button asChild className="w-full">
                    <Link href="/login">Return to Login</Link>
                </Button>
             </div>
        ) : (
             <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label className="sr-only" htmlFor="email">
                    Email
                    </Label>
                    <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    required
                    />
                </div>
                {error && (
                    <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                )}
                <Button disabled={isLoading}>
                    {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Reset Link
                </Button>
                </div>
            </form>
        )}
      </div>
    </div>
  )
}
