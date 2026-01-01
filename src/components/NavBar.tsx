"use client"
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useSession, signOut } from 'next-auth/react'

export default function NavBar() {
  const { data } = useSession()
  const user = data?.user as any
  return (
    <header className="flex items-center justify-between p-4 border-b bg-white/60 dark:bg-black/30 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="font-bold text-lg text-accent-700 dark:text-accent-300">R Code Morpher</div>
      </div>
      <nav className="flex gap-4 items-center text-sm">
        <Link href="/" className="hover:underline" prefetch={false}>Convert</Link>
        <Link href="/dashboard" className="hover:underline" prefetch={false}>Dashboard</Link>
        {user?.email ? (
          <button onClick={() => signOut({ callbackUrl: '/' })} className="px-3 py-1 border rounded">Sign out</button>
        ) : (
          <Link href="/login" className="hover:underline" prefetch={false}>Login</Link>
        )}
        <ThemeToggle />
      </nav>
    </header>
  )}
