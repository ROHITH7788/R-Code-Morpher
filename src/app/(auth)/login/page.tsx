"use client"
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remember, setRemember] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('remember_me') === '1'
  })
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('remember_email')
        if (saved) setEmail(saved)
      }
    } catch {}
  }, [])
  return (
    <div className="max-w-sm mx-auto border rounded-lg p-6 space-y-3 shadow-xl bg-white/70 dark:bg-gray-900/60 backdrop-blur">
      <h1 className="text-2xl font-semibold text-accent-700 dark:text-accent-300">Welcome to R Code Morpher</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Email" value={email} onChange={(e) => {
        const v = e.target.value
        setEmail(v)
        try {
          if (remember) localStorage.setItem('remember_email', v)
        } catch {}
      }} />
      <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={(e) => {
        const v = e.target.checked
        setRemember(v)
        try {
          if (v) {
            localStorage.setItem('remember_me', '1')
            localStorage.setItem('remember_email', email)
          } else {
            localStorage.removeItem('remember_me')
            localStorage.removeItem('remember_email')
          }
        } catch {}
      }} /> Remember me</label>
      <button className="w-full px-3 py-2 rounded bg-gradient-to-r from-accent-600 to-accent-500 text-white disabled:opacity-50" disabled={loading || !email || !password} onClick={async () => {
        setLoading(true)
        setError('')
        const r = await signIn('credentials', { email, password, redirect: false })
        if (r && r.ok) {
          window.location.href = '/'
        } else {
          setError(r?.error || 'Sign in failed')
        }
        setLoading(false)
      }}>{loading ? 'Signing in…' : 'Sign in'}</button>
      <div className="flex justify-between text-sm">
        <Link href="/signup" className="text-blue-600">Create account</Link>
        <Link href="/reset" className="text-blue-600">Forgot password?</Link>
      </div>
    </div>
  )
}
