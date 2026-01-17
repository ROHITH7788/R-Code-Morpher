import { NextResponse } from 'next/server'
import { convertWithLLM, runWithLLM } from '@/lib/llm'

type TestCase = { s: string; t: string; code: string }
type TestResult = { s: string; t: string; ok: boolean; usedLLM: boolean; status: number; explanation: string; sample: string; runOut?: string; runUsedLLM?: boolean }

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

function isSuspiciousSameCode(s: string, t: string, input: string, output: string) {
  if (s === t) return false
  const a = (input || '').trim()
  const b = (output || '').trim()
  if (!a || !b) return false
  return a === b
}

export async function GET() {
  const results: TestResult[] = []
  for (const tc of testCases) {
    try {
      const converted = await convertWithLLM({ sourceLang: tc.s, targetLang: tc.t, inputCode: tc.code })
      const out = (converted.outputCode || '').toString()
      let runOut = ''
      let runUsedLLM = false
      try {
        const r = await runWithLLM({ lang: tc.t, code: out })
        runOut = (r?.output ?? '').toString()
        runUsedLLM = !!r?.usedLLM
      } catch {}
      const ok = !!(converted as any)?.usedLLM && !isSuspiciousSameCode(tc.s, tc.t, tc.code, out) && !!out.trim() && (!!runOut ? !!runOut.trim() : true)
      results.push({
        s: tc.s,
        t: tc.t,
        ok,
        usedLLM: !!(converted as any)?.usedLLM,
        status: 200,
        explanation: (converted as any)?.explanation?.toString?.() ?? '',
        sample: out.length > 0 ? out.slice(0, Math.min(160, out.length)) : '',
        runOut,
        runUsedLLM,
      })
      await new Promise(r => setTimeout(r, 250))
    } catch (e: any) {
      results.push({
        s: tc.s, t: tc.t, ok: false, usedLLM: false, status: 0, explanation: e?.message || 'Request failed', sample: '',
      })
      await new Promise(r => setTimeout(r, 250))
    }
  }
  const summary = { ok: results.filter(r => r.ok).length, total: results.length, llm: results.filter(r => r.usedLLM).length }
  return NextResponse.json({ summary, items: results })
}
