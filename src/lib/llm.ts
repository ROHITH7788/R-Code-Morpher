import { NextResponse } from 'next/server'

function basicConvert(sourceLang: string, targetLang: string, inputCode: string) {
  if (sourceLang === targetLang) return { outputCode: inputCode, explanation: 'Source and target are the same.' }
  if (sourceLang === 'javascript' && targetLang === 'python') {
    let out = inputCode
    out = out.replace(/console\.log\s*\(/g, 'print(')
    out = out.replace(/\b(let|const)\s+/g, '')
    out = out.replace(/;\s*$/gm, '')
    out = out.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, (m, name, args) => `def ${name}(${args}):`)
    out = out.replace(/=>\s*\{/g, ':')
    out = out.replace(/\{\s*$/gm, ':')
    out = out.replace(/\}/g, '')
    return { outputCode: out, explanation: 'Heuristic JS→Python conversion: logs→print, functions→def, removed semicolons and braces.' }
  }
  if (sourceLang === 'python' && targetLang === 'javascript') {
    let out = inputCode
    out = out.replace(/\bprint\s*\(/g, 'console.log(')
    out = out.replace(/^def\s+(\w+)\s*\(([^)]*)\)\s*:\s*$/gm, (m, name, args) => `function ${name}(${args}) {`)
    out = out.replace(/^\s{2,}(.+)/gm, (m, line) => line)
    out = out.replace(/\n\s*$/g, '\n}')
    return { outputCode: out, explanation: 'Heuristic Python→JS conversion: print→console.log, def→function with braces.' }
  }
  const s = inputCode
  const toPrint = (lang: string, inner: string) => {
    switch (lang) {
      case 'javascript': return `console.log(${inner})`
      case 'typescript': return `console.log(${inner})`
      case 'python': return `print(${inner})`
      case 'java': return `System.out.println(${inner})`
      case 'c': return `printf(${inner})`
      case 'cpp': return `printf(${inner})`
      case 'csharp': return `Console.WriteLine(${inner})`
      case 'go': return `fmt.Println(${inner})`
      case 'rust': return `println!(${inner})`
      case 'ruby': return `puts ${inner}`
      case 'php': return `echo ${inner};`
      case 'swift': return `print(${inner})`
      case 'kotlin': return `println(${inner})`
      case 'scala': return `println(${inner})`
      case 'haskell': return `putStrLn ${inner}`
      case 'elixir': return `IO.puts(${inner})`
      default: return inner
    }
  }
  const normalizePrints = (lang: string, code: string) => {
    let out = code
    if (lang === 'java') out = out.replace(/System\.out\.println\s*\(([^)]+)\)\s*;?/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'c') out = out.replace(/printf\s*\(([^)]+)\)\s*;?/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'cpp') out = out.replace(/printf\s*\(([^)]+)\)\s*;?/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'csharp') out = out.replace(/Console\.WriteLine\s*\(([^)]+)\)\s*;?/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'go') out = out.replace(/fmt\.Println\s*\(([^)]+)\)\s*;?/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'rust') out = out.replace(/println!\s*\(([^)]+)\)\s*;?/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'ruby') out = out.replace(/puts\s+(.+)/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'php') out = out.replace(/echo\s+(.+);?/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'swift') out = out.replace(/print\s*\(([^)]+)\)/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'kotlin') out = out.replace(/println\s*\(([^)]+)\)/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'scala') out = out.replace(/println\s*\(([^)]+)\)/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'haskell') out = out.replace(/putStrLn\s+(.+)/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'elixir') out = out.replace(/IO\.puts\s*\(([^)]+)\)/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'javascript' || lang === 'typescript') out = out.replace(/console\.log\s*\(([^)]+)\)\s*;?/g, (_, a) => `__PRINT__(${a})`)
    if (lang === 'python') out = out.replace(/print\s*\(([^)]+)\)/g, (_, a) => `__PRINT__(${a})`)
    return out
  }
  const denormalizePrints = (lang: string, code: string) => code.replace(/__PRINT__\(([^)]+)\)/g, (_, a) => toPrint(lang, a))
  const normalized = normalizePrints(sourceLang, s)
  const transformed = denormalizePrints(targetLang, normalized)
  if (transformed !== s) return { outputCode: transformed, explanation: 'Converted print statements to target language.' }
  const wrapped = toPrint(targetLang, JSON.stringify(s))
  return { outputCode: wrapped, explanation: 'Wrapped original code as a printable string in the target language.' }
}

export async function convertWithLLM(payload: { sourceLang: string; targetLang: string; inputCode: string; dsaMode?: boolean }) {
  const { sourceLang, targetLang, inputCode, dsaMode } = payload
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    const basic = basicConvert(sourceLang, targetLang, inputCode)
    return { outputCode: basic.outputCode, explanation: basic.explanation, complexity: 'unknown', tests: '', usedLLM: false }
  }
  try {
    const body = {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            (dsaMode
              ? 'You are an expert in data structures and algorithms. Convert the code to the TARGET LANGUAGE ONLY. Ensure the result compiles/runs as-is: add missing imports, standard entry points (e.g., main), and fix syntax automatically while preserving algorithmic correctness and time/space complexity. Use idiomatic data structures and standard libraries of the target language. Return strict JSON: {"outputCode": string, "explanation": string, "complexity": string, "tests": string}. The "outputCode" must be pure target-language code with no comments or text outside code. The "tests" must be target-language.'
              : 'You are an expert software translator. Convert the code to the TARGET LANGUAGE ONLY. Ensure the result runs as-is: include necessary imports, standard entry points (e.g., main) and fix syntax automatically. Preserve functionality, use idiomatic patterns. Return strict JSON: {"outputCode": string, "explanation": string, "complexity": string, "tests": string}. The "outputCode" must be pure target-language code with no mixed languages or explanations.')
        },
        {
          role: 'user',
          content: `Source language: ${sourceLang}\nTarget language: ${targetLang}\nCode:\n\n${inputCode}`,
        },
      ],
      response_format: { type: 'json_object' },
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`LLM error ${res.status}`)
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    const parsed = content ? JSON.parse(content) : { outputCode: inputCode, explanation: 'No explanation.', complexity: 'unknown', tests: '' }
    return { ...parsed, usedLLM: true }
  } catch (e: any) {
    const basic = basicConvert(sourceLang, targetLang, inputCode)
    return { outputCode: basic.outputCode, explanation: `LLM failure: ${e.message}. ${basic.explanation}`, complexity: 'unknown', tests: '', usedLLM: false }
  }
}
