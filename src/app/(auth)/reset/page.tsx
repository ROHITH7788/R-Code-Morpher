"use client"
import { useState } from 'react'

export default function Reset() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loadingSend, setLoadingSend] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  return (
    <div className="max-w-sm mx-auto border rounded p-4 space-y-2">
      <h1 className="text-xl font-semibold">Reset password</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {message && <div className="text-sm text-green-600">{message}</div>}
      <div className="space-y-1">
        <input className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className="w-full bg-blue-600 text-white rounded px-3 py-1 disabled:opacity-50" disabled={loadingSend || !email} onClick={async () => {
          try {
            setError('')
            setMessage('')
            setLoadingSend(true)
            const res = await fetch('/api/auth/request-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
            if (res.ok) setMessage('If the email exists, a reset link has been sent.')
            else {
              let data: any = null
              try { data = await res.json() } catch {}
              setError(data?.error || 'Could not send reset email')
            }
          } catch (e: any) {
            setError(e?.message || 'Request aborted')
          } finally {
            setLoadingSend(false)
          }
        }}>
          {loadingSend ? 'Sending…' : 'Send reset email'}
        </button>
      </div>
      <div className="space-y-1">
        <input className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400" placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} />
        <input className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400" placeholder="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" className="w-full bg-green-600 text-white rounded px-3 py-1 disabled:opacity-50" disabled={loadingReset || !token || !password} onClick={async () => {
          try {
            setError('')
            setMessage('')
            setLoadingReset(true)
            const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
            if (res.ok) setMessage('Password updated. You can now sign in.')
            else {
              let data: any = null
              try { data = await res.json() } catch {}
              setError(data?.error || 'Reset failed')
            }
          } catch (e: any) {
            setError(e?.message || 'Request aborted')
          } finally {
            setLoadingReset(false)
          }
        }}>
          {loadingReset ? 'Resetting…' : 'Reset'}
        </button>
      </div>
    </div>
  )
}
