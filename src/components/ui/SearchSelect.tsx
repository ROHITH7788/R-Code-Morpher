"use client"
import { useMemo, useState } from 'react'

export default function SearchSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => options.filter(o => o.toLowerCase().includes(q.toLowerCase())), [q, options])
  return (
    <div className="relative">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="border rounded px-2 py-1 w-full mb-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500">
        {filtered.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
