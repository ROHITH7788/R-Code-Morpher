 

function ensureRunnable(lang: string, code: string) {
  const body = (code || '').trim()
  if (!body) return body
  const semi = (s: string) =>
    s
      .split(/\r?\n/)
      .map(l => {
        const t = l.trim()
        if (!t) return ''
        return /;\s*$/.test(t) ? t : t + ';'
      })
      .join('\n')
  switch (lang) {
    case 'java':
      if (/public\s+static\s+void\s+main|class\s+\w+/.test(body)) return body
      return `class Main { public static void main(String[] args){\n${semi(body)}\n} }`
    case 'c':
      if (/int\s+main\s*\(/.test(body)) return body
      return `#include <stdio.h>\nint main(){\n${semi(body)}\nreturn 0;\n}`
    case 'cpp':
      if (/int\s+main\s*\(/.test(body)) return body
      return `#include <stdio.h>\nint main(){\n${semi(body)}\nreturn 0;\n}`
    case 'csharp':
      if (/static\s+void\s+Main\s*\(/.test(body)) return body
      return `using System;\nclass Program { static void Main(){\n${semi(body)}\n} }`
    case 'go':
      if (/package\s+main/.test(body)) return body
      return `package main\nimport "fmt"\nfunc main(){\n${body}\n}`
    case 'rust':
      if (/fn\s+main\s*\(/.test(body)) return body
      return `fn main(){\n${semi(body)}\n}`
    case 'kotlin':
      if (/fun\s+main\s*\(/.test(body)) return body
      return `fun main(){\n${body}\n}`
    case 'scala':
      if (/object\s+\w+\s*\{/.test(body)) return body
      return `object Main{ def main(args:Array[String]){\n${body}\n} }`
    case 'php':
      if (/<\?php/.test(body)) return body
      return `<?php\n${semi(body)}\n?>`
    default:
      return body
  }
}

function toPrint(lang: string, inner: string) {
  switch (lang) {
    case 'javascript':
      return `console.log(${inner})`
    case 'typescript':
      return `console.log(${inner})`
    case 'python':
      return `print(${inner})`
    case 'java':
      return `System.out.println(${inner})`
    case 'c':
      return `printf(${inner})`
    case 'cpp':
      return `printf(${inner})`
    case 'csharp':
      return `Console.WriteLine(${inner})`
    case 'go':
      return `fmt.Println(${inner})`
    case 'rust':
      return `println!(${inner})`
    case 'ruby':
      return `puts ${inner}`
    case 'php':
      return `echo ${inner};`
    case 'swift':
      return `print(${inner})`
    case 'kotlin':
      return `println(${inner})`
    case 'scala':
      return `println(${inner})`
    case 'haskell':
      return `putStrLn ${inner}`
    case 'elixir':
      return `IO.puts(${inner})`
    default:
      return inner
  }
}

function normalizePrints(lang: string, code: string) {
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

function denormalizePrints(lang: string, code: string) {
  return code.replace(/__PRINT__\(([^)]+)\)/g, (_, a) => toPrint(lang, a))
}

function estimateComplexity(code: string) {
  const s = (code || '').toString()
  let loops = 0
  const add = (re: RegExp) => { loops += ((s.match(re) || []).length) }
  add(/\bfor\b/g)
  add(/\bwhile\b/g)
  add(/\brange\s*\(/g)
  add(/\bforeach\b/g)
  add(/\bforEach\s*\(/g)
  const nested = loops >= 2
  const sort = /(arrays\.sort|collections\.sort|std::sort|sorted\s*\(|\.sort\s*\()/i.test(s)
  const rec = /(def|function|void|int|double|float|char|bool|boolean)\s+(\w+)\s*\([^)]*\)[\s\S]*?\b\2\s*\(/.test(s)
  let time = 'O(1)'
  if (sort) time = 'O(n log n)'
  else if (nested) time = 'O(n^2)'
  else if (loops > 0 || rec) time = 'O(n)'
  let space = 'O(1)'
  const dyn = /(new\s+(Array|ArrayList|Vector|List|Map|HashMap)|\[\]|\bdict\b|\bmap\b|\bset\b|\bpush\s*\(|\bappend\s*\()/i.test(s)
  if (dyn) space = 'O(n)'
  return `Time: ${time}; Space: ${space}`
}
function basicConvert(sourceLang: string, targetLang: string, inputCode: string) {
  if (sourceLang === targetLang) return { outputCode: inputCode, explanation: 'Source and target are the same.' }
  if (sourceLang === 'java' && targetLang === 'python') {
    const pre = inputCode.replace(/\{/g, '{\n').replace(/\}/g, '\n}')
    const lines = pre.split(/\r?\n/)
    let out: string[] = []
    let indent = 0
    const push = (s: string) => out.push('    '.repeat(indent) + s)
    const mainLines: string[] = []
    for (let raw of lines) {
      let line = raw.trim()
      if (!line) { push(''); continue }
      line = line.replace(/^import\s+.+;$/, '')
      line = line.replace(/^package\s+.+;$/, '')
      if (/^\s*(public|private|protected)?\s*class\s+\w+\s*\{?\s*$/.test(line)) { continue }
      line = line.replace(/System\.out\.println\s*\(/g, 'print(')
      line = line.replace(/System\.out\.print\s*\(/g, 'print(')
      line = line.replace(/System\.out\.printf\s*\(/g, 'print(')
      line = line.replace(/;\s*$/g, '')
      if (/^\s*Scanner\s+\w+\s*=\s*new\s+Scanner\s*\(\s*System\.in\s*\)\s*;?\s*$/.test(line)) { continue }
      line = line.replace(/\b(\w+)\.nextFloat\s*\(\s*\)/g, 'float(input())')
      line = line.replace(/\b(\w+)\.nextDouble\s*\(\s*\)/g, 'float(input())')
      line = line.replace(/\b(\w+)\.nextInt\s*\(\s*\)/g, 'int(input())')
      line = line.replace(/\b(\w+)\.nextLong\s*\(\s*\)/g, 'int(input())')
      line = line.replace(/\b(\w+)\.nextShort\s*\(\s*\)/g, 'int(input())')
      line = line.replace(/\b(\w+)\.nextLine\s*\(\s*\)/g, 'input()')
      line = line.replace(/\bnew\s+/g, '')
      line = line.replace(/\b(\d+(?:\.\d+)?)f\b/gi, '$1')
      line = line.replace(/^\s*else\s+if\s*\((.+)\)\s*\{?\s*$/i, (_m, cond) => {
        const c = (cond || '')
          .replace(/&&/g, 'and')
          .replace(/\|\|/g, 'or')
          .replace(/\btrue\b/gi, 'True')
          .replace(/\bfalse\b/gi, 'False')
          .replace(/!\s*(?!\=)/g, 'not ')
        return `elif ${c}:`
      })
      line = line.replace(/^\s*(public|private|protected)?\s*static\s+void\s+main\s*\(\s*String\s*(\[\]\s*\w+|\w+\s*\[\])\s*\)\s*\{?\s*$/i, 'def main():')
      line = line.replace(/^\s*(public|private|protected)?\s*(static)?\s*(void|int|double|float|char|boolean|long|short|byte)\s+(\w+)\s*\(([^)]*)\)\s*\{?\s*$/i, (_m, _a, _b, _ret, name, args) => {
        const a = (args || '').replace(/\b(int|double|float|char|boolean|long|short|byte|String)\b\s+/g, '').trim()
        return `def ${name}(${a}):`
      })
      line = line.replace(/^\s*for\s*\(\s*\w+\s+(\w+)\s*:\s*([^)]+)\)\s*\{?\s*$/i, (_m, v, iter) => `for ${v} in ${iter}:`)
      line = line.replace(/^\s*for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\w+)\s*;\s*\1\+\+\s*\)\s*\{?\s*$/i, (_m, v, start, end) => `for ${v} in range(${start}, ${end}):`)
      line = line.replace(/^\s*if\s*\((.+)\)\s*\{?\s*$/i, (_m, cond) => {
        const c = (cond || '')
          .replace(/&&/g, 'and')
          .replace(/\|\|/g, 'or')
          .replace(/\btrue\b/gi, 'True')
          .replace(/\bfalse\b/gi, 'False')
          .replace(/!\s*(?!\=)/g, 'not ')
          .replace(/(\w+)\.length\b/g, 'len($1)')
        return `if ${c}:`
      })
      line = line.replace(/^\s*else\s*\{?\s*$/i, 'else:')
      line = line.replace(
        /^\s*(int|double|float|boolean|long|short|byte|char|String)\s*\[\]\s+(\w+)\s*=\s*(?:new\s+)?\1\s*\[\s*([^\]]+)\s*\]\s*;?\s*$/i,
        (_m, type, name, size) => {
          const t = String(type).toLowerCase()
          let def = '0'
          if (t === 'double' || t === 'float') def = '0.0'
          else if (t === 'boolean') def = 'False'
          else if (t === 'char' || t === 'string') def = "''"
          return `${name} = [${def}] * ${size}`
        }
      )
      line = line.replace(
        /^\s*(int|double|float|boolean|long|short|byte|char|String)\s*\[\]\s+(\w+)\s*=\s*\1\s*\[\s*([^\]]+)\s*\]\s*;?\s*$/i,
        (_m, type, name, size) => {
          const t = String(type).toLowerCase()
          let def = '0'
          if (t === 'double' || t === 'float') def = '0.0'
          else if (t === 'boolean') def = 'False'
          else if (t === 'char' || t === 'string') def = "''"
          return `${name} = [${def}] * ${size}`
        }
      )
      line = line.replace(/^\s*(int|double|float|char|boolean|long|short|byte|String)\s+(\w+)\s*=\s*([^;]+);?$/i, (_m, _type, name, value) => `${name} = ${value}`)
      line = line.replace(/\btrue\b/gi, 'True').replace(/\bfalse\b/gi, 'False')
      line = line.replace(/(\w+)\.length\b/g, 'len($1)')
      const opens = (line.match(/\{/g) || []).length
      const closes = (line.match(/\}/g) || []).length
      if (closes > 0) indent = Math.max(0, indent - closes)
      const cleaned = line.replace(/\{/g, '').replace(/\}/g, '')
      if (/def\s+main\s*\(\s*\)\s*:\s*$/.test(cleaned)) {
        push(cleaned)
        mainLines.push('if __name__ == "__main__":')
        mainLines.push('  main()')
        indent = 1
        continue
      }
      push(cleaned)
      if (opens > closes) indent += opens - closes
    }
    if (mainLines.length > 0) out = out.concat(mainLines)
    const result = out.join('\n').replace(/\n{3,}/g, '\n\n')
    const complexity = estimateComplexity(result)
    return { outputCode: result, explanation: 'Heuristic Java→Python conversion: println→print, method→def, braces→indent.', complexity }
  }
  if (sourceLang === 'javascript' && targetLang === 'python') {
    let out = inputCode
    out = out.replace(/console\.log\s*\(/g, 'print(')
    out = out.replace(/\b(let|const)\s+/g, '')
    out = out.replace(/;\s*$/gm, '')
    out = out.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, (m, name, args) => `def ${name}(${args}):`)
    out = out.replace(/=>\s*\{/g, ':')
    out = out.replace(/\{\s*$/gm, ':')
    out = out.replace(/\}/g, '')
    const complexity = estimateComplexity(out)
    return { outputCode: out, explanation: 'Heuristic JS→Python conversion: logs→print, functions→def, removed semicolons and braces.', complexity }
  }
  if (sourceLang === 'php' && targetLang === 'python') {
    let out = inputCode
    out = out.replace(/<\?php/g, '')
    out = out.replace(/\?>/g, '')
    out = out.replace(/echo\s+(.+);?/g, (_, a) => `print(${a})`)
    out = out.replace(/;\s*$/gm, '')
    const o = out.trim()
    const complexity = estimateComplexity(o)
    return { outputCode: o, explanation: 'Heuristic PHP→Python conversion: removed PHP tags, echo→print, removed semicolons.', complexity }
  }
  if (sourceLang === 'typescript' && targetLang === 'python') {
    let out = inputCode
    out = out.replace(/console\.log\s*\(/g, 'print(')
    out = out.replace(/\b(let|const)\s+(\w+)\s*:\s*[^=]+=\s*/g, (_m, _kw, name) => `${name} = `)
    out = out.replace(/\b(let|const)\s+/g, '')
    out = out.replace(/\s+as\s+[A-Za-z0-9_<>\[\]\|?.]+/g, '')
    out = out.replace(/^\s*(interface|type)\s+.+$/gm, '')
    out = out.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*[^ {]+)?\s*\{/g, (_m, name, args) => {
      const a = (args || '').replace(/\b(\w+)\s*:\s*[^,)\s]+/g, '$1')
      return `def ${name}(${a}):`
    })
    out = out.replace(/const\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>\s*\{/g, (_m, name, args) => {
      const a = (args || '').replace(/\b(\w+)\s*:\s*[^,)\s]+/g, '$1')
      return `def ${name}(${a}):`
    })
    out = out.replace(/;\s*$/gm, '')
    out = out.replace(/\{\s*$/gm, ':')
    out = out.replace(/=>\s*\{/g, ':')
    out = out.replace(/\}/g, '')
    const complexity = estimateComplexity(out)
    return { outputCode: out, explanation: 'Heuristic TS→Python conversion: logs→print, remove types, functions→def, removed semicolons and braces.', complexity }
  }
  if (sourceLang === 'csharp' && targetLang === 'python') {
    const pre = inputCode.replace(/\{/g, '{\n').replace(/\}/g, '\n}')
    const lines = pre.split(/\r?\n/)
    let out: string[] = []
    let indent = 0
    const push = (s: string) => out.push('  '.repeat(indent) + s)
    const mainLines: string[] = []
    for (let raw of lines) {
      let line = raw.trim()
      if (!line) { push(''); continue }
      line = line.replace(/^using\s+.+;$/, '')
      line = line.replace(/^namespace\s+.+\s*\{?$/, '')
      if (/class\s+\w+/.test(line)) { continue }
      line = line.replace(/Console\.Write(Line)?\s*\(/g, 'print(')
      line = line.replace(/;\s*$/g, '')
      line = line.replace(/^\s*(public|private|protected)?\s*(static)?\s*void\s+Main\s*\(\s*\)\s*\{?\s*$/i, 'def main():')
      line = line.replace(/^\s*(public|private|protected)?\s*(static)?\s*(void|int|double|float|char|bool|boolean|long|short|string|object|var)\s+(\w+)\s*\(([^)]*)\)\s*\{?\s*$/i,
        (_m, _vis, _stat, _ret, name, args) => {
          const a = (args || '').replace(/\b(int|double|float|char|bool|boolean|long|short|string|object|var)\b\s+/gi, '').replace(/\s*=\s*[^,)\s]+/g, '')
          return `def ${name}(${a}):`
        })
      line = line.replace(/^\s*for\s*\(\s*(int|var)\s+(\w+)\s*=\s*(\d+)\s*;\s*\2\s*<\s*(\w+)\s*;\s*\2\+\+\s*\)\s*\{?\s*$/i,
        (_m, _kw, v, start, end) => `for ${v} in range(${start}, ${end}):`)
      line = line.replace(/^\s*if\s*\((.+)\)\s*\{?\s*$/i, (_m, cond) => `if ${cond}:`)
      line = line.replace(/^\s*else\s*\{?\s*$/i, 'else:')
      const opens = (line.match(/\{/g) || []).length
      const closes = (line.match(/\}/g) || []).length
      if (closes > 0) indent = Math.max(0, indent - closes)
      const cleaned = line.replace(/\{/g, '').replace(/\}/g, '')
      if (/def\s+main\s*\(\s*\)\s*:\s*$/.test(cleaned)) {
        push(cleaned)
        mainLines.push('if __name__ == "__main__":')
        mainLines.push('  main()')
        indent = 1
        continue
      }
      if (cleaned) push(cleaned)
      if (opens > closes) indent += opens - closes
    }
    if (mainLines.length > 0) out = out.concat(mainLines)
    const result = out.join('\n').replace(/\n{3,}/g, '\n\n')
    const complexity = estimateComplexity(result)
    return { outputCode: result, explanation: 'Heuristic C#→Python conversion: WriteLine→print, method→def, braces→indent.', complexity }
  }
  if (sourceLang === 'python' && targetLang === 'javascript') {
    let out = inputCode
    out = out.replace(/\bprint\s*\(/g, 'console.log(')
    out = out.replace(/^def\s+(\w+)\s*\(([^)]*)\)\s*:\s*$/gm, (m, name, args) => `function ${name}(${args}) {`)
    out = out.replace(/^\s{2,}(.+)/gm, (m, line) => line)
    out = out.replace(/\n\s*$/g, '\n}')
    const complexity = estimateComplexity(out)
    return { outputCode: out, explanation: 'Heuristic Python→JS conversion: print→console.log, def→function with braces.', complexity }
  }
  const s = inputCode
  const normalized = normalizePrints(sourceLang, s)
  const transformed = denormalizePrints(targetLang, normalized)
  if (transformed !== s) {
    const runnable = ensureRunnable(targetLang, transformed)
    const complexity = estimateComplexity(runnable)
    return { outputCode: runnable, explanation: 'Converted print statements to target language.', complexity }
  }
  const complexity = estimateComplexity(inputCode)
  return { outputCode: inputCode, explanation: 'No reliable heuristic available for this pair without LLM.', complexity }
}

 

export async function convertWithLLM(payload: { sourceLang: string; targetLang: string; inputCode: string; dsaMode?: boolean }) {
  const { sourceLang, targetLang, inputCode, dsaMode } = payload
  const key = process.env.OPENAI_API_KEY
  const envConvTimeout = parseInt(String(process.env.LLM_TIMEOUT_MS || '').trim(), 10)
  const convTimeout = Number.isFinite(envConvTimeout) && envConvTimeout > 0 ? envConvTimeout : 20000
  let outputCode = ''
  let explanation = ''
  let complexity = 'unknown'
  let tests = ''
  let usedLLM = false
  if (!key) throw new Error('LLM_API_KEY_MISSING')
  try {
    const messages = [
      {
        role: 'system',
        content:
          (dsaMode
            ? 'You are an expert in data structures and algorithms. Convert the code to the TARGET LANGUAGE ONLY. Ensure the result compiles/runs as-is: add missing imports, standard entry points (e.g., main), and fix syntax automatically while preserving algorithmic correctness and time/space complexity. Use idiomatic data structures and standard libraries of the target language. For Python, use // for integer division and ensure valid syntax (no spaced operators like "< ="). Return strict JSON: {"outputCode": string, "explanation": string, "complexity": string, "tests": string}. The "outputCode" must be pure target-language code with no comments or text outside code. The "tests" must be target-language.'
            : 'You are an expert software translator. Convert the code to the TARGET LANGUAGE ONLY. Ensure the result runs as-is: include necessary imports, standard entry points (e.g., main) and fix syntax automatically. Preserve functionality, use idiomatic patterns. For Python, use // for integer division. Return strict JSON: {"outputCode": string, "explanation": string, "complexity": string, "tests": string}. The "outputCode" must be pure target-language code with no mixed languages or explanations.')
      },
      {
        role: 'user',
        content: `Source language: ${sourceLang}\nTarget language: ${targetLang}\nCode:\n\n${inputCode}`,
      },
    ]
    const data1 = await chatCompletionWithRetry(key, messages, { json: true, temperature: 0.2, maxRetries: 2, timeoutMs: convTimeout })
    const content1 = data1.choices?.[0]?.message?.content
    const parsed = content1 ? JSON.parse(content1) : { outputCode: inputCode, explanation: 'No explanation.', complexity: 'unknown', tests: '' }
    let candidate = postProcess(targetLang, parsed.outputCode || '')
    if (sourceLang !== targetLang && candidate.trim() === (inputCode || '').trim()) {
      const messages2 = [
        { role: 'system', content: 'You strictly convert source into TARGET LANGUAGE. Never return the original source unchanged. Ensure runnable code: add imports, a main/entry if needed. Return strict JSON: {"outputCode": string, "explanation": string, "complexity": string, "tests": string}.' },
        { role: 'user', content: `Source language: ${sourceLang}\nTarget language: ${targetLang}\nCode:\n\n${inputCode}` },
      ]
      const data2 = await chatCompletionWithRetry(key, messages2, { json: true, temperature: 0.2, maxRetries: 2, timeoutMs: convTimeout })
      const content2 = data2.choices?.[0]?.message?.content
      const parsed2 = content2 ? JSON.parse(content2) : parsed
      candidate = postProcess(targetLang, parsed2.outputCode || '')
      if (sourceLang !== targetLang && candidate.trim() === (inputCode || '').trim()) {
        const messages3 = [
          { role: 'system', content: 'Strictly convert to TARGET LANGUAGE with runnable code. Never return the source unchanged. Return JSON: {"outputCode": string, "explanation": string, "complexity": string, "tests": string}.' },
          { role: 'user', content: `Source language: ${sourceLang}\nTarget language: ${targetLang}\nCode:\n\n${inputCode}` },
        ]
        const data3 = await chatCompletionWithRetry(key, messages3, { json: true, temperature: 0.4, maxRetries: 3, timeoutMs: convTimeout + 5000 })
        const content3 = data3.choices?.[0]?.message?.content
        const parsed3 = content3 ? JSON.parse(content3) : parsed2
        candidate = postProcess(targetLang, parsed3.outputCode || '')
        if (sourceLang !== targetLang && candidate.trim() === (inputCode || '').trim()) {
          throw new Error('LLM_UNCHANGED_OUTPUT')
        }
        outputCode = candidate
        explanation = parsed3.explanation || ''
        complexity = parsed3.complexity || 'unknown'
        tests = parsed3.tests || ''
        usedLLM = true
      } else {
        outputCode = candidate
        explanation = parsed2.explanation || ''
        complexity = parsed2.complexity || 'unknown'
        tests = parsed2.tests || ''
        usedLLM = true
      }
    } else {
      outputCode = candidate
      explanation = parsed.explanation || ''
      complexity = parsed.complexity || 'unknown'
      tests = parsed.tests || ''
      usedLLM = true
    }
  } catch (e: any) {
    try {
      const messages3 = [
        { role: 'system', content: 'Convert to TARGET LANGUAGE and output runnable code only. Return JSON: {"outputCode": string, "explanation": string, "complexity": string, "tests": string}.' },
        { role: 'user', content: `Source language: ${sourceLang}\nTarget language: ${targetLang}\nCode:\n\n${inputCode}` },
      ]
      const data3 = await chatCompletionWithRetry(key, messages3, { json: true, temperature: 0, maxRetries: 1, timeoutMs: Math.max(6000, Math.floor(convTimeout / 2)) })
      const content3 = data3.choices?.[0]?.message?.content
      const parsed3 = content3 ? JSON.parse(content3) : { outputCode: inputCode, explanation: 'No explanation.', complexity: 'unknown', tests: '' }
      const cleaned3 = postProcess(targetLang, parsed3.outputCode || '')
      outputCode = cleaned3
      explanation = parsed3.explanation || ''
      complexity = parsed3.complexity || 'unknown'
      tests = parsed3.tests || ''
      usedLLM = true
    } catch {
      throw e
    }
  }
  outputCode = (outputCode || '').toString().replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim()
  explanation = sanitizeText(explanation || '')
  let c = sanitizeText(complexity || '').split('\n')[0].trim()
  if (!c || /unknown/i.test(c)) c = estimateComplexity(outputCode)
  complexity = c
  if (!explanation) explanation = `Converted ${sourceLang} → ${targetLang}`
  return { outputCode, explanation, complexity, tests, usedLLM }
}

function postProcess(lang: string, code: string) {
  let out = (code || '').toString()
  out = out.replace(/^```[a-zA-Z0-9]*\s*/gm, '').replace(/```$/gm, '')
  if (lang === 'python') {
    out = out.replace(/;\s*$/gm, '')
    out = out.replace(/^\s*{\s*$/gm, '').replace(/^\s*}\s*$/gm, '')
    out = out.replace(/^(\s*)(def\s+\w+\s*\([^)]*\))\s*$/gm, (_m, pad, sig) => `${pad}${sig}:`)
    out = out.replace(/^(\s*)(if|elif|else|for|while|try|except|finally)\b(.*?)(?<!:)\s*$/gm, (_m, pad, kw, rest) => `${pad}${kw}${rest}:`)
    out = out.replace(/\bdef\s+main\s*\(\s*args\s*\[\s*\]\s*\)\s*:/g, 'def main():')
    out = out.replace(/\b(\d+(?:\.\d+)?)[fFdD]\b/g, '$1')
    out = out.replace(/\b(\d+)[lL]\b/g, '$1')
    out = out.replace(/\btrue\b/gi, 'True').replace(/\bfalse\b/gi, 'False')
    out = out.replace(/<\s*=/g, '<=').replace(/>\s*=/g, '>=').replace(/!\s*=/g, '!=')
    out = out.replace(/(?<![!<>])=\s*=/g, '==')
    out = out.replace(/\)\s*\/\)\s*\/\//g, ') //')
    out = out.replace(/mid\s*=\s*\(\s*([^)]+?)\s*\)\s*\/\s*2/g, 'mid = ($1) // 2')
    out = out.replace(/mid\s*=\s*([^\n]+?)\s*\/\s*2/g, 'mid = ($1) // 2')
    out = out.replace(/\s*-\s*/g, ' - ')
    out = out.replace(/\s*\+\s*/g, ' + ')
    out = out.replace(/\s*=\s*/g, ' = ')
    out = out.replace(/,\s*/g, ', ')
    out = out.replace(/^\s*int\s+(\w+)\s*\[\]\s*=\s*(?:new\s+)?int\s*\[\s*([^\]]+)\s*\]\s*;?\s*$/gm, (_m, name, size) => `${name} = [0] * ${size}`)
    const needsIndentFix = /def\s+main\s*\(\s*\)\s*:\s*\n\s*\w/.test(out)
    if (needsIndentFix) {
      const lines = out.split(/\r?\n/)
      let indent = 0
      const outLines: string[] = []
      for (let raw of lines) {
        const t = raw.replace(/^\s+/, '')
        if (!t) { outLines.push(''); continue }
        if (/^(elif|else|except|finally)\b/.test(t)) indent = Math.max(0, indent - 1)
        outLines.push('    '.repeat(indent) + t)
        if (/^(def|class|if|elif|else|for|while|try|except|finally)\b.*:\s*$/.test(t)) indent++
      }
      out = outLines.join('\n')
    }
    // Generalize binary search sort insertion
    if (/while\s+\w+\s*<=\s*\w+\s*:/.test(out)) {
      const matches = Array.from(out.matchAll(/\b([A-Za-z_]\w*)\s*\[\s*(?:mid|left|right|start|end|low|high|[^\]]+)\]/g))
      const arrName = matches.length ? matches[0][1] : null
      const hasSort = arrName ? new RegExp(`\\b${arrName}\\.sort\\s*\\(\\s*\\)`).test(out) : /\b\w+\.sort\s*\(\s*\)/.test(out)
      if (arrName && !hasSort) {
        const lines = out.split(/\r?\n/)
        let inserted = false
        for (let i = 0; i < lines.length; i++) {
          if (/^\s*(tar|target|key)\s*=\s*int\s*\(\s*input\s*\(\s*\)\s*\)\s*$/.test(lines[i])) {
            const pad = (lines[i].match(/^\s*/) || [''])[0]
            lines.splice(i + 1, 0, `${pad}${arrName}.sort()`)
            inserted = true
            break
          }
        }
        if (!inserted) {
          for (let i = 0; i < lines.length; i++) {
            if (/^\s*while\s+\w+\s*<=\s*\w+\s*:\s*$/.test(lines[i])) {
              const pad = (lines[i].match(/^\s*/) || [''])[0]
              lines.splice(i, 0, `${pad}${arrName}.sort()`)
              inserted = true
              break
            }
          }
        }
        if (!inserted) {
          for (let i = 0; i < lines.length; i++) {
            const re = new RegExp(`^\\s*${arrName}\\s*=\\s*\\[`)
            if (re.test(lines[i])) {
              const pad = (lines[i].match(/^\s*/) || [''])[0]
              lines.splice(i + 1, 0, `${pad}${arrName}.sort()`)
              inserted = true
              break
            }
          }
        }
        out = lines.join('\n')
      }
    }
    // Generalize move print outside loop
    if (/^\s*while\s+\w+\s*<=\s*\w+\s*:\s*$/m.test(out)) {
      const lines = out.split(/\r?\n/)
      let i = 0
      const toMove: Array<{ idx: number; text: string; indent: string; afterIdx: number; afterIndent: string }> = []
      while (i < lines.length) {
        const line = lines[i]
        if (/^\s*while\s+\w+\s*<=\s*\w+\s*:\s*$/.test(line)) {
          const whileIndent = (line.match(/^\s*/) || [''])[0]
          let k = i + 1
          let afterIdx = i + 1
          while (k < lines.length) {
            const curIndent = (lines[k].match(/^\s*/) || [''])[0]
            const trimmed = lines[k].trim()
            if (trimmed && curIndent.length <= whileIndent.length) { afterIdx = k; break }
            if (/^\s*print\s*\(/.test(lines[k])) {
              toMove.push({ idx: k, text: lines[k].trim(), indent: curIndent, afterIdx: -1, afterIndent: whileIndent })
            }
            k++
            afterIdx = k
          }
          // assign afterIdx for recorded prints in this while block
          for (let t of toMove) {
            if (t.afterIdx === -1) t.afterIdx = afterIdx
          }
          i = k
        } else {
          i++
        }
      }
      // Remove prints inside loops
      for (let j = toMove.length - 1; j >= 0; j--) {
        const rm = toMove[j]
        lines.splice(rm.idx, 1)
      }
      // Insert prints after respective loops with loop-level indent
      for (let m of toMove) {
        const pad = m.afterIndent
        lines.splice(m.afterIdx <= lines.length ? m.afterIdx : lines.length, 0, `${pad}${m.text}`)
      }
      out = lines.join('\n')
    }
    if (/def\s+main\s*\(\s*\)\s*:\s*/.test(out) && !/__name__\s*==\s*["']__main__["']/.test(out)) {
      out = `${out}\n\nif __name__ == "__main__":\n    main()`
    }
  } else if (lang === 'javascript' || lang === 'typescript') {
    out = out.replace(/\bprint\s*\(/g, 'console.log(')
  } else {
    out = ensureRunnable(lang, out)
  }
  out = out.replace(/\r\n/g, '\n')
  out = out.replace(/[ \t]+$/gm, '')
  out = out.replace(/\n{3,}/g, '\n\n')
  out = out.trim()
  return out
}

function filterRunOutput(s: string) {
  const lines = String(s || '').split(/\r?\n/)
  const kept = lines.filter(l => {
    const t = l.trim()
    if (!t) return false
    const low = t.toLowerCase()
    if (low.startsWith('#problem:')) return false
    if (low.includes('unknown at rule')) return false
    if (/^\[warning\]/i.test(t)) return false
    if (low.startsWith('warning')) return false
    if (low.startsWith('error')) return false
    return true
  })
  return kept.join('\n').trim()
}

function sanitizeText(s: string) {
  const lines = String(s || '').split(/\r?\n/)
  const kept = lines.filter(l => {
    const t = l.trim()
    if (!t) return false
    const low = t.toLowerCase()
    if (low.startsWith('#problem:')) return false
    if (/^\[warning\]/i.test(t)) return false
    if (low.startsWith('warning')) return false
    if (low.startsWith('error')) return false
    return true
  })
  const joined = kept.join('\n').replace(/^```[a-zA-Z0-9]*\s*/gm, '').replace(/```$/gm, '')
  return joined.trim()
}

export async function runWithLLM(payload: { lang: string; code: string }) {
  const { lang, code } = payload
  const key = process.env.OPENAI_API_KEY
  const envRunTimeout = parseInt(String(process.env.LLM_RUN_TIMEOUT_MS || '').trim(), 10)
  const runTimeout = Number.isFinite(envRunTimeout) && envRunTimeout > 0 ? envRunTimeout : 4000
  if (!key) {
    return { output: '', usedLLM: false }
  }
  try {
    const messages = [
      { role: 'system', content: 'You execute code and return ONLY the exact stdout. No explanations, no code fences, no prefixes. If the program waits for input, assume empty input. If it cannot run, return an empty string.' },
      { role: 'user', content: `Language: ${lang}\nCode:\n\n${code}` },
    ]
    const data = await chatCompletionWithRetry(key, messages, { json: false, temperature: 0, maxRetries: 1, timeoutMs: runTimeout })
    const content = data.choices?.[0]?.message?.content ?? ''
    const cleaned = filterRunOutput(String(content || '').replace(/^```[a-zA-Z0-9]*\s*/gm, '').replace(/```$/gm, '').trim())
    return { output: cleaned, usedLLM: true }
  } catch (e: any) {
    try {
      const messages2 = [
        { role: 'system', content: 'Return ONLY program stdout for the provided language and code.' },
        { role: 'user', content: `Language: ${lang}\nCode:\n\n${code}` },
      ]
      const data2 = await chatCompletionWithRetry(key, messages2, { json: false, temperature: 0, maxRetries: 1, timeoutMs: runTimeout })
      const content2 = data2.choices?.[0]?.message?.content ?? ''
      const cleaned2 = filterRunOutput(String(content2 || '').replace(/^```[a-zA-Z0-9]*\s*/gm, '').replace(/```$/gm, '').trim())
      return { output: cleaned2, usedLLM: true }
    } catch {
      return { output: '', usedLLM: false }
    }
  }
}

async function chatCompletionWithRetry(
  key: string,
  messages: Array<{ role: string; content: string }>,
  opts: { json: boolean; temperature: number; maxRetries?: number; timeoutMs?: number }
) {
  const maxRetries = typeof opts.maxRetries === 'number' ? opts.maxRetries : 5
  const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 5000
  let attempt = 0
  let lastErr: any = null
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  while (attempt < maxRetries) {
    try {
      const body: any = {
        model,
        temperature: opts.temperature,
        messages,
      }
      if (opts.json) body.response_format = { type: 'json_object' }
      const controller = new AbortController()
      const to = setTimeout(() => { try { controller.abort() } catch {} }, timeoutMs)
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(to)
      if (res.ok) return await res.json()
      const retriable = res.status === 429 || res.status >= 500
      if (!retriable) {
        let text = ''
        try { text = await res.text() } catch {}
        throw new Error(`LLM error ${res.status}${text ? `: ${text}` : ''}`)
      }
      const waitMs = 500 * Math.pow(2, attempt)
      await new Promise(r => setTimeout(r, waitMs))
      attempt++
      continue
    } catch (e: any) {
      lastErr = e
      const waitMs = 500 * Math.pow(2, attempt)
      await new Promise(r => setTimeout(r, waitMs))
      attempt++
    }
  }
  throw lastErr || new Error('LLM request failed')
}
