"use client"
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'))
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    if (typeof window !== 'undefined') localStorage.setItem('theme', theme)
  }, [theme])
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="border rounded px-3 py-1">
      {theme === 'dark' ? 'Light' : 'Dark'} mode
    </button>
  )
}
