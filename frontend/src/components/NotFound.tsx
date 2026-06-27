import React, { useState, useEffect, useRef } from 'react'

interface NotFoundProps {
  isDark?: boolean
}

const NotFound: React.FC<NotFoundProps> = ({ isDark = false }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Subtle mouse tracking for minimal parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5
        })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Keyboard shortcut to return home
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' || e.key === 'Escape') {
        window.location.href = '/'
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
  
    <div 
      ref={containerRef}
      className={`min-h-screen relative ${
        isDark ? 'bg-zinc-950' : 'bg-stone-50'
      }`}
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none"></div>
      
      {/* Very subtle ambient lighting */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{
          background: isDark 
            ? 'radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.05), transparent 70%)',
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 10}px)`,
          left: '50%',
          top: '40%',
          marginLeft: '-12rem',
          marginTop: '-12rem'
        }}
      />

      <div className="relative z-10 px-6 py-8 max-w-4xl mx-auto">
        
        {/* Clean header */}
        <header className="flex items-center justify-center mb-20">
          <a href="/" className="group flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full ${
              isDark ? 'bg-white' : 'bg-zinc-900'
            } flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${
                isDark ? 'bg-zinc-900' : 'bg-white'
              }`}></div>
            </div>
            <span className={`text-xl font-light tracking-wide ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}>Orbit</span>
          </a>
        </header>

        <main className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          
          {/* Status indicator */}
          <div className="mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium ${
              isDark 
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                : 'bg-white text-zinc-600 border border-stone-200 shadow-sm'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                isDark ? 'bg-amber-400' : 'bg-amber-500'
              }`}></div>
              Page not found
            </div>
          </div>

          {/* Large, elegant 404 */}
          <div className="mb-8">
            <h1 className={`text-8xl md:text-9xl font-extralight tracking-tighter ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`} style={{ lineHeight: '0.85' }}>
              404
            </h1>
          </div>

          {/* Subtitle */}
          <div className="mb-12 max-w-lg">
            <h2 className={`text-2xl font-light leading-snug mb-4 ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}>
              This page has wandered off
            </h2>
            <p className={`text-base leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              The page you're looking for doesn't exist or has been moved.<br />
              Let's get you back on track.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <a
              href="/"
              className={`px-8 py-3 rounded-xl font-medium transition-colors ${
                isDark 
                  ? 'bg-white text-zinc-900 hover:bg-stone-100' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              Return home
            </a>
            
            <button
              onClick={() => window.history.back()}
              className={`px-8 py-3 rounded-xl font-medium border transition-colors ${
                isDark 
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800/50' 
                  : 'border-stone-300 text-zinc-700 hover:bg-stone-100'
              }`}
            >
              Go back
            </button>
          </div>

          {/* Helpful suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            <div className={`p-6 rounded-xl border ${
              isDark 
                ? 'border-zinc-800/50 bg-zinc-900/20' 
                : 'border-stone-200/50 bg-white/50'
            }`}>
              <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                isDark ? 'bg-zinc-800' : 'bg-stone-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`font-medium mb-2 ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                Double-check the URL
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                Make sure the web address is spelled correctly
              </p>
            </div>

            <div className={`p-6 rounded-xl border ${
              isDark 
                ? 'border-zinc-800/50 bg-zinc-900/20' 
                : 'border-stone-200/50 bg-white/50'
            }`}>
              <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                isDark ? 'bg-zinc-800' : 'bg-stone-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className={`font-medium mb-2 ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                Try refreshing
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                Sometimes a simple refresh resolves the issue
              </p>
            </div>
          </div>
        </main>

        {/* Minimal footer */}
        <footer className="pt-16 text-center">
          <p className={`text-sm font-light ${
            isDark ? 'text-zinc-600' : 'text-zinc-500'
          }`}>
            © 2024 Orbit
          </p>
          <p className={`text-xs mt-2 ${
            isDark ? 'text-zinc-700' : 'text-zinc-400'
          }`}>
            Press R or Escape to return home
          </p>
        </footer>
      </div>
    </div>
    </>
  )
}

export default NotFound