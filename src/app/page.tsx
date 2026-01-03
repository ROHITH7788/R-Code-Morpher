"use client"
import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import Editor from '@monaco-editor/react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import SearchSelect from '@/components/ui/SearchSelect'
import { useToast } from '@/components/toast/ToastProvider'

type ConversionResult = { outputCode: string; explanation?: string }
type AdvancedConversionResult = { outputCode: string; explanation?: string; complexity?: string; tests?: string; usedLLM?: boolean }

const languages = [
  'javascript','typescript','python','java','c','cpp','csharp','go','rust','ruby','php','swift','kotlin','scala','haskell','elixir'
]

export default function Home() {
  const [sourceLang, setSourceLang] = useState('javascript')
  const [targetLang, setTargetLang] = useState('python')
  const [inputCode, setInputCode] = useState('// Paste code here')
  const [outputCode, setOutputCode] = useState('')
  const [explanation, setExplanation] = useState<string>('')
  const [complexity, setComplexity] = useState<string>('')
  const [tests, setTests] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<{ id: string; name: string }[]>([])
  const [filesError, setFilesError] = useState('')
  const [dsaMode, setDsaMode] = useState(false)
  const [liveMode, setLiveMode] = useState(false)
  const [autoRun, setAutoRun] = useState(true)
  const [runOutput, setRunOutput] = useState('')
  const [history, setHistory] = useState<{ id?: string; sourceLang: string; targetLang: string; inputCode: string; outputCode: string; createdAt?: string }[]>([])
  const [pyReady, setPyReady] = useState(false)
  const [pyLoading, setPyLoading] = useState(false)

  const canRun = useMemo(() => {
    if (!outputCode) return false
    if (targetLang === 'javascript') return true
    if (targetLang === 'python') {
      const looksLikeOtherLang = /(^|\n)\s*\/\//.test(outputCode) || /;\s*$/.test(outputCode)
      return !looksLikeOtherLang
    }
    return false
  }, [outputCode, targetLang])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rcm.state') || 'null')
      if (saved) {
        setSourceLang(saved.sourceLang || 'javascript')
        setTargetLang(saved.targetLang || 'python')
        setInputCode(saved.inputCode || '// Paste code here')
        setOutputCode(saved.outputCode || '')
        setExplanation(saved.explanation || '')
        setComplexity(saved.complexity || '')
        setTests(saved.tests || '')
        setDsaMode(!!saved.dsaMode)
        setLiveMode(!!saved.liveMode)
      }
      const savedHist = JSON.parse(localStorage.getItem('rcm.history') || '[]')
      if (Array.isArray(savedHist)) setHistory(savedHist)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const req: any = (window as any).require
      if (req && typeof req.config === 'function') {
        req.config({ paths: { stackframe: 'https://cdn.jsdelivr.net/npm/stackframe@1.3.4/stackframe.min', 'error-stack-parser': 'https://cdn.jsdelivr.net/npm/error-stack-parser@2.1.4/dist/error-stack-parser.min' } })
      }
    } catch {}
  }, [])

  useEffect(() => {
    const payload = { sourceLang, targetLang, inputCode, outputCode, explanation, complexity, tests, dsaMode, liveMode }
    try { localStorage.setItem('rcm.state', JSON.stringify(payload)) } catch {}
  }, [sourceLang, targetLang, inputCode, outputCode, explanation, complexity, tests, dsaMode, liveMode])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/conversions/list')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.conversions)) setHistory(data.conversions)
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          // ignore
        }
      }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/files/list')
        if (res.ok) {
          const data = await res.json()
          setFiles(data.files.map((f: any) => ({ id: f.id, name: f.name })))
        } else if (res.status === 401) {
          setFilesError('Sign in to manage files')
        } else {
          setFilesError('Unable to load files')
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          // ignore
        }
      }
    })()
  }, [])

  const toast = useToast()
  async function convert() {
    setLoading(true)
    const res = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceLang, targetLang, inputCode, dsaMode }),
    })
    const data: AdvancedConversionResult = await res.json()
    setOutputCode(data.outputCode)
    setExplanation(data.explanation ?? '')
    setComplexity(data.complexity ?? '')
    setTests(data.tests ?? '')
    setLoading(false)
    toast.show('Conversion completed')
    const item = { sourceLang, targetLang, inputCode, outputCode: data.outputCode, createdAt: new Date().toISOString() }
    setHistory(cur => {
      const next = [item, ...cur].slice(0, 20)
      try { localStorage.setItem('rcm.history', JSON.stringify(next)) } catch {}
      return next
    })
  }

  useEffect(() => {
    if (!liveMode) return
    const trimmed = (inputCode || '').trim()
    if (!trimmed) return
    if (trimmed.startsWith('// Paste code here')) return
    const controller = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceLang, targetLang, inputCode, dsaMode }),
          signal: controller.signal,
        })
        const data: AdvancedConversionResult = await res.json()
        setOutputCode(data.outputCode)
        setExplanation(data.explanation ?? '')
        setComplexity(data.complexity ?? '')
        setTests(data.tests ?? '')
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
        }
      } finally {
        setLoading(false)
      }
    }, 600)
    return () => { controller.abort(); clearTimeout(t) }
  }, [liveMode, sourceLang, targetLang, inputCode, dsaMode])

  function runJS(code: string) {
    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args: any[]) => { logs.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')) }
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(code)
      fn()
      setRunOutput(logs.join('\n'))
    } catch (e: any) {
      setRunOutput(`Error: ${e?.message || String(e)}`)
    } finally {
      console.log = originalLog
    }
  }

  const ensurePyodide = useCallback(async () => {
    if (pyReady || pyLoading) return
    setPyLoading(true)
    try {
      // @ts-ignore
      if (!(window as any).loadPyodide) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
        script.async = true
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.body.appendChild(script) })
      }
      // @ts-ignore
      const py = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' })
      // @ts-ignore
      ;(window as any).__pyodide = py
      setPyReady(true)
    } catch {
      setPyReady(false)
    } finally {
      setPyLoading(false)
    }
  }, [pyReady, pyLoading])

  const runPython = useCallback(async (code: string) => {
    setRunOutput('')
    try {
      await ensurePyodide()
      // @ts-ignore
      const py = (window as any).__pyodide
      if (!py) { setRunOutput('Python runtime unavailable'); return }
      // capture prints
      const wrapper = `import sys\nfrom js import console\nclass W:\n  def write(self,s):\n    if s.strip():\n      console.log(s)\n  def flush(self):\n    pass\nsys.stdout = W()\nsys.stderr = W()\n` + code
      await py.runPythonAsync(wrapper)
    } catch (e: any) {
      setRunOutput(`Error: ${e?.message || String(e)}`)
    }
  }, [ensurePyodide])

  useEffect(() => {
    if (!autoRun) return
    if (!canRun) return
    if (targetLang === 'javascript') runJS(outputCode)
    else if (targetLang === 'python') runPython(outputCode)
  }, [outputCode, targetLang, autoRun, runPython, canRun])

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[80vh]">
      <aside className="md:col-span-2 col-span-1 border rounded p-2 space-y-2">
        <h2 className="font-semibold">Project Files</h2>
        {filesError && (
          <div className="text-xs text-gray-600">
            {filesError} <Link href="/login" className="text-blue-600">Login</Link>
          </div>
        )}
        <input type="file" multiple onChange={async (e) => {
          const files = e.target.files
          if (!files || files.length === 0) return
          const form = new FormData()
          Array.from(files).forEach(f => form.append('files', f))
          const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: form })
          if (!uploadRes.ok) {
            if (uploadRes.status === 401) toast.show('Please sign in to upload')
            else toast.show('Upload failed')
            return
          }
          toast.show('Files uploaded')
          const res = await fetch('/api/files/list')
          if (res.ok) { const data = await res.json(); setFiles(data.files.map((f: any) => ({ id: f.id, name: f.name }))) }
        }} />
        <ul className="max-h-40 overflow-auto text-sm">
          {files.map(f => (
            <li key={f.id} className="flex justify-between items-center py-1">
              <span>{f.name}</span>
              <div className="flex gap-2">
                <button className="text-blue-600" onClick={async () => {
                  const res = await fetch('/api/files/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id }) })
                  if (res.ok) {
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = f.name
                    a.click()
                    toast.show('Downloaded')
                  }
                }}>Download</button>
                <button className="text-red-600" onClick={async () => {
                  await fetch('/api/files/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id }) })
                  setFiles(cur => cur.filter(x => x.id !== f.id))
                  toast.show('Deleted')
                }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <h2 className="font-semibold">Conversion History</h2>
          <ul className="max-h-40 overflow-auto text-sm">
            {history.map((h, idx) => (
              <li key={(h.id ?? '') + idx} className="py-1 border-b last:border-b-0">
                <div className="flex justify-between items-center">
                  <span>{h.sourceLang} → {h.targetLang}</span>
                  <div className="flex gap-2">
                    <button className="text-blue-600" onClick={() => {
                      setSourceLang(h.sourceLang)
                      setTargetLang(h.targetLang)
                      setInputCode(h.inputCode)
                      setOutputCode(h.outputCode)
                    }}>Load</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="md:col-span-10 col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded overflow-hidden">
          <div className="flex items-center justify-between p-2 border-b bg-white/50 dark:bg-black/20">
            <div className="flex items-center gap-2">
              <SearchSelect options={languages} value={sourceLang} onChange={setSourceLang} />
              <Button onClick={() => { const s = sourceLang; setSourceLang(targetLang); setTargetLang(s) }}>Swap</Button>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dsaMode} onChange={(e) => setDsaMode(e.target.checked)} /> DSA-aware</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} /> Live</label>
              <Button className="bg-red-600" onClick={() => { setInputCode('') }}>Delete</Button>
            </div>
            <Button onClick={convert} disabled={loading}>{loading ? (<><Spinner /> <span className="ml-2">Converting</span></>) : 'Convert →'}</Button>
          </div>
          <div
            className="p-2 border-b text-xs text-gray-600"
            onDragOver={(e) => { e.preventDefault() }}
            onDrop={async (e) => {
              e.preventDefault()
              const f = e.dataTransfer?.files?.[0]
              if (f) { const text = await f.text(); setInputCode(text) }
            }}
          >
            Click to select or drop your input code file here.
            <input
              type="file"
              accept=".js,.ts,.py,.java,.c,.cpp,.cs,.go,.rs,.rb,.php,.swift,.kt,.scala,.hs,.ex,.txt"
              className="ml-2"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) { const text = await f.text(); setInputCode(text) }
              }}
            />
          </div>
          <Editor
            height="64vh"
            language={sourceLang}
            theme="vs-dark"
            value={inputCode}
            onChange={(v) => setInputCode(v ?? '')}
            beforeMount={() => {
              try {
                const req: any = (window as any).require
                if (req && typeof req.config === 'function') {
                  req.config({ paths: { stackframe: 'https://cdn.jsdelivr.net/npm/stackframe@1.3.4/stackframe.min', 'error-stack-parser': 'https://cdn.jsdelivr.net/npm/error-stack-parser@2.1.4/dist/error-stack-parser.min' } })
                }
              } catch {}
            }}
            options={{ minimap: { enabled: false } }}
          />
        </div>
        <div className="border rounded overflow-hidden">
          <div className="flex items-center justify-between p-2 border-b bg-white/50 dark:bg-black/20">
          <div className="flex items-center gap-2">
            <SearchSelect options={languages} value={targetLang} onChange={setTargetLang} />
            <Button onClick={() => { navigator.clipboard.writeText(outputCode); toast.show('Output copied') }}>Copy</Button>
            <Button className="bg-red-600" onClick={() => { setOutputCode(''); setExplanation(''); setComplexity(''); setTests(''); setRunOutput('') }}>Delete</Button>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} /> Auto-run</label>
          </div>
          <Button onClick={async () => {
            const res = await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputCode, outputCode, sourceLang, targetLang }) })
            const data = await res.json()
            navigator.clipboard.writeText(window.location.origin + '/share/' + data.id)
            toast.show('Share link copied')
          }} className="bg-purple-600">Share</Button>
          </div>
          <div className="relative">
            <Editor
              height="50vh"
              language={targetLang}
              theme="vs-dark"
              value={outputCode}
              beforeMount={() => {
                try {
                  const req: any = (window as any).require
                  if (req && typeof req.config === 'function') {
                    req.config({ paths: { stackframe: 'https://cdn.jsdelivr.net/npm/stackframe@1.3.4/stackframe.min', 'error-stack-parser': 'https://cdn.jsdelivr.net/npm/error-stack-parser@2.1.4/dist/error-stack-parser.min' } })
                  }
                } catch {}
              }}
              options={{ readOnly: true, minimap: { enabled: false } }}
            />
            {!outputCode && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                Converted code appears here
              </div>
            )}
          </div>
          <div className="p-2 text-sm border-t bg-white/50 dark:bg-black/20 space-y-2">
            <div>
              <div className="font-semibold mb-1">Run Output {!(targetLang === 'javascript' || targetLang === 'python') && '(JS/Python only)'}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {targetLang === 'javascript' && <Button onClick={() => runJS(outputCode)} disabled={!canRun}>Run</Button>}
                {targetLang === 'python' && <Button onClick={() => runPython(outputCode)} disabled={!canRun || pyLoading}>{pyLoading ? 'Loading Python…' : 'Run'}</Button>}
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} /> Auto-run</label>
              </div>
              <pre className="whitespace-pre-wrap min-h-[60px]">{runOutput}</pre>
            </div>
            <div>
              <div className="font-semibold mb-1">Explanation</div>
              <pre className="whitespace-pre-wrap">{explanation}</pre>
            </div>
            {complexity && (
              <div>
                <div className="font-semibold mb-1">Complexity</div>
                <pre className="whitespace-pre-wrap">{complexity}</pre>
              </div>
            )}
            {tests && (
              <div>
                <div className="font-semibold mb-1">Tests</div>
                <pre className="whitespace-pre-wrap">{tests}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
