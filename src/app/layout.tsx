import '../styles/globals.css'
import { ReactNode } from 'react'
import Script from 'next/script'
import NavBar from '@/components/NavBar'
import ToastProvider from '@/components/toast/ToastProvider'
import AuthProvider from '@/components/AuthProvider'

export const metadata = {
  title: 'R Code Morpher',
  description: 'Convert code between programming languages with AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-bg-light to-white dark:from-bg-dark dark:to-gray-900 text-gray-900 dark:text-gray-100">
        <Script id="amd-config" strategy="beforeInteractive">
          {`
            try {
              var req = window.require;
              if (req && typeof req.config === 'function') {
                req.config({ paths: {
                  stackframe: 'https://cdn.jsdelivr.net/npm/stackframe@1.3.4/stackframe.min',
                  'error-stack-parser': 'https://cdn.jsdelivr.net/npm/error-stack-parser@2.1.4/dist/error-stack-parser.min'
                } });
              }
            } catch (e) {}
          `}
        </Script>
        <Script id="error-filters" strategy="beforeInteractive">
          {`
            try {
              var originalError = window.console.error.bind(window.console);
              var tokens = [
                'net::ERR_ABORTED',
                'AbortError',
                'net::ERR_CONNECTION_REFUSED',
                'Failed to fetch',
                'Loading "stackframe" failed',
                'error-stack-parser',
                'Here are the modules that depend on it:',
                'stackframe.js',
                '[object Event]',
                'pyodide',
                '/api/convert',
                'SyntaxError: Invalid or unexpected token',
                'ide_webview_request_time',
                '_rsc=',
                'login?callbackUrl=',
                'reset?',
                'signup?'
              ];
              function shouldFilter(args) {
                try {
                  var s = Array.prototype.slice.call(args).map(function(a){
                    if (typeof a === 'string') return a;
                    if (a && a.message) return a.message;
                    if (a && a.target && (a.target.src || a.target.href)) return String(a.target.src || a.target.href);
                    try { return String(a); } catch(_) { return ''; }
                  }).join(' ');
                  for (var i=0;i<tokens.length;i++){ if (s.indexOf(tokens[i]) !== -1) return true; }
                } catch(e) {}
                return false;
              }
              window.console.error = function() {
                try {
                  for (var i = 0; i < arguments.length; i++) {
                    var a = arguments[i];
                    if (a && a.name === 'AbortError') return;
                    if (a && a.error && a.error.name === 'AbortError') return;
                  }
                } catch {}
                if (shouldFilter(arguments)) return;
                originalError.apply(window.console, arguments);
              };
              window.addEventListener('error', function(e){
                try {
                  var msg = (e && e.message) || '';
                  var src = (e && e.target && (e.target.src || e.target.href)) || e.filename || '';
                  var combined = msg + ' ' + src;
                  if (e && e.error && e.error.name === 'AbortError') { e.stopImmediatePropagation(); e.preventDefault(); return; }
                  for (var i=0;i<tokens.length;i++){ if (combined.indexOf(tokens[i]) !== -1) { e.stopImmediatePropagation(); e.preventDefault(); return; } }
                } catch(err) {}
              }, true);
              window.addEventListener('unhandledrejection', function(e){
                try {
                  var r = e && e.reason; var msg = (r && r.message) || String(r || '');
                  if (r && r.name === 'AbortError') { e.stopImmediatePropagation(); e.preventDefault(); return; }
                  for (var i=0;i<tokens.length;i++){ if (msg.indexOf(tokens[i]) !== -1) { e.stopImmediatePropagation(); e.preventDefault(); return; } }
                } catch(err) {}
              }, true);
            } catch (e) {}
          `}
        </Script>
        <AuthProvider>
          <ToastProvider>
            <NavBar />
            <div className="max-w-[1600px] mx-auto p-4">{children}</div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
