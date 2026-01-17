"use client"
import { useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
export const dynamic = 'force-dynamic'

type TestCase = { s: string; t: string; code: string }
type TestResult = { s: string; t: string; ok: boolean; usedLLM: boolean; status: number; explanation: string; sample: string; runOut?: string; runUsedLLM?: boolean }

const languages = [
  'javascript','typescript','python','java','c','cpp','csharp','go','rust','ruby','php','swift','kotlin','scala','haskell','elixir'
]

const testCases: TestCase[] = [
  { s: 'javascript', t: 'python', code: 'console.log("Hello")' },
  { s: 'python', t: 'javascript', code: 'print("Hello")' },
  { s: 'java', t: 'python', code: 'class Main { public static void main(String[] args){ System.out.println("Hello"); } }' },
  { s: 'c', t: 'python', code: '#include <stdio.h>\nint main(){ printf("Hello\\n"); return 0; }' },
  { s: 'go', t: 'ruby', code: 'package main\nimport "fmt"\nfunc main(){ fmt.Println("Hello") }' },
  { s: 'rust', t: 'python', code: 'fn main(){ println!("Hello"); }' },
  { s: 'ruby', t: 'php', code: 'puts "Hello"' },
  { s: 'php', t: 'python', code: '<?php echo "Hello"; ?>' },
  { s: 'swift', t: 'kotlin', code: 'print("Hello")' },
  { s: 'kotlin', t: 'swift', code: 'fun main(){ println("Hello") }' },
  { s: 'scala', t: 'go', code: 'object Main{ def main(args:Array[String]){ println("Hello") }}' },
  { s: 'csharp', t: 'java', code: 'using System; class Program { static void Main(){ Console.WriteLine("Hello"); } }' },
  { s: 'typescript', t: 'python', code: 'const msg: string = "Hello"; console.log(msg)' },
  { s: 'elixir', t: 'ruby', code: 'IO.puts("Hello")' },
  { s: 'haskell', t: 'python', code: 'main = putStrLn "Hello"' },
  { s: 'go', t: 'rust', code: 'package main\nimport "fmt"\nfunc main(){ fmt.Println("Hello") }' },
  { s: 'ruby', t: 'javascript', code: 'puts "Hello"' },
  { s: 'php', t: 'javascript', code: '<?php echo "Hello"; ?>' },
  { s: 'java', t: 'csharp', code: 'class Main { public static void main(String[] args){ System.out.println("Hello"); } }' },
  { s: 'csharp', t: 'python', code: 'using System; class Program { static void Main(){ Console.WriteLine("Hi"); } }' },
  { s: 'python', t: 'go', code: 'print("Hello")' },
  { s: 'python', t: 'rust', code: 'print("Hello")' },
  { s: 'javascript', t: 'java', code: 'console.log("Hello")' },
  { s: 'javascript', t: 'rust', code: 'console.log("Hello")' },
]

export default function TestsPage() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [matrixRunning, setMatrixRunning] = useState(false)
  const [throttleMs, setThrottleMs] = useState(3200)
  const stopRef = useRef(false)

  const summary = useMemo(() => {
    const total = results.length
    const ok = results.filter(r => r.ok).length
    const llm = results.filter(r => r.usedLLM).length
    return { ok, total, llm }
  }, [results])

  function isSuspiciousSameCode(s: string, t: string, input: string, output: string) {
    if (s === t) return false
    const a = (input || '').trim()
    const b = (output || '').trim()
    if (!a || !b) return false
    return a === b
  }

  function sanityCheck(_t: string, out: string) {
    const code = (out || '').toString()
    return !!code.trim()
  }

  async function runAll() {
    if (running) return
    setRunning(true)
    setResults([])
    for (const tc of testCases) {
      try {
        const res = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceLang: tc.s, targetLang: tc.t, inputCode: tc.code }),
        })
        const data = await res.json()
        const out: string = (data?.outputCode ?? '').toString()
        const sample = out.length > 0 ? out.slice(0, Math.min(160, out.length)) : ''
        let runOut = ''
        let runUsedLLM = false
        try {
          const rres = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: tc.t, code: out }) })
          const rdata = await rres.json()
          runOut = (rdata?.output ?? '').toString()
          runUsedLLM = !!rdata?.usedLLM
        } catch {}
        const ok = res.ok && !!data?.usedLLM && !isSuspiciousSameCode(tc.s, tc.t, tc.code, out) && sanityCheck(tc.t, out) && (!!runOut ? (!!runOut.trim() && !!runUsedLLM) : true)
        setResults(cur => [...cur, { s: tc.s, t: tc.t, ok, usedLLM: !!data?.usedLLM, status: res.status, explanation: (data?.explanation ?? '').toString(), sample, runOut, runUsedLLM }])
      } catch (e: any) {
        setResults(cur => [...cur, { s: tc.s, t: tc.t, ok: false, usedLLM: false, status: 0, explanation: e?.message || 'Request failed', sample: '' }])
      }
      await new Promise(r => setTimeout(r, throttleMs))
    }
    setRunning(false)
  }

  async function runMatrix() {
    if (matrixRunning) return
    stopRef.current = false
    setMatrixRunning(true)
    setResults([])
    for (const s of languages) {
      for (const t of languages) {
        if (stopRef.current) { setMatrixRunning(false); return }
        if (s === t) continue
        try {
          const res = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceLang: s, targetLang: t, inputCode: sampleCodeFor(s) }),
          })
          const data = await res.json()
          const out: string = (data?.outputCode ?? '').toString()
          const sample = out.length > 0 ? out.slice(0, Math.min(160, out.length)) : ''
          const ok = res.ok && !!data?.usedLLM && !isSuspiciousSameCode(s, t, sampleCodeFor(s), out) && sanityCheck(t, out)
          setResults(cur => [...cur, { s, t, ok, usedLLM: !!data?.usedLLM, status: res.status, explanation: (data?.explanation ?? '').toString(), sample }])
        } catch (e: any) {
          setResults(cur => [...cur, { s, t, ok: false, usedLLM: false, status: 0, explanation: e?.message || 'Request failed', sample: '' }])
        }
        await new Promise(r => setTimeout(r, throttleMs))
      }
    }
    setMatrixRunning(false)
  }

  function sampleCodeFor(lang: string) {
    switch (lang) {
      case 'javascript': return 'console.log("Hello")'
      case 'typescript': return 'const msg: string = "Hello"; console.log(msg)'
      case 'python': return 'print("Hello")'
      case 'java': return 'class Main { public static void main(String[] args){ System.out.println("Hello"); } }'
      case 'c': return '#include <stdio.h>\nint main(){ printf("Hello\\n"); return 0; }'
      case 'cpp': return '#include <stdio.h>\nint main(){ printf("Hello\\n"); return 0; }'
      case 'csharp': return 'using System; class Program { static void Main(){ Console.WriteLine("Hello"); } }'
      case 'go': return 'package main\nimport "fmt"\nfunc main(){ fmt.Println("Hello") }'
      case 'rust': return 'fn main(){ println!("Hello"); }'
      case 'ruby': return 'puts "Hello"'
      case 'php': return '<?php echo "Hello"; ?>'
      case 'swift': return 'print("Hello")'
      case 'kotlin': return 'fun main(){ println("Hello") }'
      case 'scala': return 'object Main{ def main(args:Array[String]){ println("Hello") }}'
      case 'haskell': return 'main = putStrLn "Hello"'
      case 'elixir': return 'IO.puts("Hello")'
      default: return 'print("Hello")'
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Conversion Test Runner</h1>
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={runAll} disabled={running}>{running ? 'Running…' : `Run All (${testCases.length})`}</Button>
        <Button className="bg-red-600" onClick={() => setResults([])} disabled={running}>Clear</Button>
        <div className="text-sm text-gray-600">
          Summary:
          <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800">{summary.ok}</span>
          /
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">{results.length || testCases.length}</span>
          successful,
          <span className="ml-2 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">{summary.llm}</span>
          used LLM
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={runMatrix} disabled={matrixRunning || running}>{matrixRunning ? 'Matrix Running…' : `Run Matrix (${languages.length * (languages.length - 1)})`}</Button>
        <Button className="bg-orange-600" onClick={() => { stopRef.current = true }} disabled={!matrixRunning}>Stop</Button>
        <label className="flex items-center gap-2 text-sm">
          Throttle ms
          <input type="number" className="border rounded px-2 py-1 w-24" value={throttleMs} onChange={e => setThrottleMs(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <div className="text-xs text-gray-600">Large matrix runs are slow due to rate limits. Consider deploying with OPENAI_API_KEY.</div>
      </div>
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left p-2">Pair</th>
              <th className="text-left p-2">OK</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">LLM</th>
              <th className="text-left p-2">Sample</th>
              <th className="text-left p-2">Explanation</th>
              <th className="text-left p-2">Run Out</th>
              <th className="text-left p-2">Run LLM</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.s + '->' + r.t + ':' + i} className="border-t">
                <td className="p-2">{r.s} → {r.t}</td>
                <td className="p-2">{r.ok ? 'yes' : 'no'}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.usedLLM ? 'yes' : 'no'}</td>
                <td className="p-2"><pre className="whitespace-pre-wrap max-w-[40ch] overflow-hidden">{r.sample}</pre></td>
                <td className="p-2"><pre className="whitespace-pre-wrap max-w-[50ch] overflow-hidden">{r.explanation}</pre></td>
                <td className="p-2"><pre className="whitespace-pre-wrap max-w-[30ch] overflow-hidden">{r.runOut}</pre></td>
                <td className="p-2">{r.runUsedLLM ? 'yes' : 'no'}</td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">No results yet. Click Run All.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-500">
        LLM is required for all conversions. Set OPENAI_API_KEY to enable successful runs.
      </div>
    </div>
  )
}
