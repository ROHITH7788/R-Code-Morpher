"use client"
import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [remember, setRemember] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('remember_me') === '1'
  })
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedEmail = localStorage.getItem('remember_email')
        if (savedEmail) setEmail(savedEmail)
      }
    } catch {}
  }, [])
  const strength = (() => {
    const p = password
    const hasLetters = /[A-Za-z]/.test(p)
    const hasNumbers = /\d/.test(p)
    const hasSpecial = /[^A-Za-z0-9]/.test(p)
    if (p.length >= 8 && hasLetters && hasNumbers && hasSpecial) return 'strong'
    if (p.length >= 6 && hasLetters && hasNumbers) return 'medium'
    return 'weak'
  })()
  return (
    <div className="max-w-sm mx-auto border rounded-lg p-6 space-y-3 shadow-xl bg-white/70 dark:bg-gray-900/60 backdrop-blur">
      <h1 className="text-2xl font-semibold text-accent-700 dark:text-accent-300">Create your account</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}
      <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Email" value={email} onChange={(e) => {
        const v = e.target.value
        setEmail(v)
        try {
          if (remember) localStorage.setItem('remember_email', v)
        } catch {}
      }} />
      <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className={`text-xs ${strength === 'strong' ? 'text-green-600' : strength === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>Password strength: {strength}</div>
      {password.length < 6 && <div className="text-xs text-red-600">Must be at least 6 characters</div>}
      <button className="w-full px-3 py-2 rounded bg-gradient-to-r from-green-600 to-green-500 text-white disabled:opacity-50" disabled={loading || !email || password.length < 6} onClick={async () => {
        setLoading(true)
        setError('')
        setSuccess('')
        const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) })
        if (res.ok) {
          setSuccess('Account created. Signing you in...')
          try { if (remember) localStorage.setItem('remember_email', email) } catch {}
          const r = await signIn('credentials', { email, password, redirect: false })
          if (r && r.ok) {
            window.location.href = '/'
          } else {
            setError(r?.error || 'Sign in failed')
          }
        } else {
          try {
            const data = await res.json()
            setError(data.error || 'Signup failed')
          } catch {
            setError('Signup failed')
          }
        }
        setLoading(false)
      }}>Create account</button>
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
    </div>
  )
}
