import React, { useEffect, useState } from 'react'

interface MobileFallbackProps {
  isDark: boolean
}

const MobileFallback: React.FC<MobileFallbackProps> = ({ isDark }) => {
  const [canShare, setCanShare] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!(navigator as any).share)
  }, [])

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      setCopied(false)
    }
  }

  const handleShare = async () => {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: 'Open Orbit on a larger screen',
          text: 'Join Orbit from your laptop or tablet for the best experience.',
          url: currentUrl
        })
      }
    } catch (_) {}
  }

  return (
    <div className={`min-h-screen relative ${
      isDark ? 'bg-zinc-950' : 'bg-stone-50'
    }`}>
      {/* Subtle background gradient - Swiss mountain inspired */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none"></div>
      
      {/* Content */}
      <div className="relative z-10 px-6 py-8 flex flex-col min-h-screen max-w-md mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-center mb-16">
          <div className="flex items-center space-x-3">
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
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center">
          
          {/* Status indicator */}
          <div className="flex justify-center mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium ${
              isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-zinc-600 shadow-sm border border-stone-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                isDark ? 'bg-amber-400' : 'bg-amber-500'
              }`}></div>
              Optimized for desktop
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-12">
            <h1 className={`text-3xl font-light leading-snug tracking-tight mb-4 ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}>
              Experience Orbit on a
              <br />
              <span className="font-normal">larger screen</span>
            </h1>
            <p className={`text-base leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              Precision-crafted for desktop workflows,<br />
              multi-panel layouts, and seamless collaboration.
            </p>
          </div>

          {/* Action card */}
          <div className={`rounded-2xl border p-6 mb-10 ${
            isDark 
              ? 'bg-zinc-900/50 border-zinc-800 backdrop-blur-sm' 
              : 'bg-white/80 backdrop-blur-sm border-stone-200 shadow-sm'
          }`}>
            
            {/* Header with icon */}
            <div className="flex items-center mb-6">
              <div className={`w-10 h-10 rounded-xl mr-4 flex items-center justify-center ${
                isDark ? 'bg-zinc-800' : 'bg-stone-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h3 className={`font-medium ${
                  isDark ? 'text-white' : 'text-zinc-900'
                }`}>Send to desktop</h3>
                <p className={`text-sm ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>Continue on your preferred device</p>
              </div>
            </div>

            {/* URL display */}
            <div className={`flex items-center justify-between p-3 mb-4 rounded-xl border ${
              isDark 
                ? 'border-zinc-700 bg-zinc-800/50' 
                : 'border-stone-200 bg-stone-50'
            }`}>
              <div className={`truncate text-sm font-mono ${
                isDark ? 'text-zinc-300' : 'text-zinc-700'
              }`}>
                {currentUrl.replace('https://', '').replace('http://', '')}
              </div>
              <button 
                onClick={handleCopy} 
                className={`ml-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDark 
                    ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' 
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              {canShare && (
                <button 
                  onClick={handleShare} 
                  className={`py-3 px-4 rounded-xl font-medium text-sm transition-colors ${
                    isDark 
                      ? 'bg-white text-zinc-900 hover:bg-stone-100' 
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  Share
                </button>
              )}
              <a
                href={`mailto:?subject=Open%20Orbit%20on%20Desktop&body=${encodeURIComponent(currentUrl)}`}
                className={`py-3 px-4 rounded-xl font-medium text-sm text-center transition-colors ${
                  canShare 
                    ? (isDark 
                        ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' 
                        : 'bg-stone-100 text-zinc-700 hover:bg-stone-200')
                    : (isDark 
                        ? 'bg-white text-zinc-900 hover:bg-stone-100' 
                        : 'bg-zinc-900 text-white hover:bg-zinc-800')
                }`}
              >
                Email link
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              'Multi-panel workspace design',
              'Advanced keyboard navigation',
              'Optimized bandwidth utilization'
            ].map((feature, index) => (
              <div 
                key={index}
                className={`flex items-center p-4 rounded-xl border ${
                  isDark 
                    ? 'border-zinc-800/50 bg-zinc-900/20' 
                    : 'border-stone-200/50 bg-white/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-4 ${
                  isDark ? 'bg-zinc-500' : 'bg-zinc-400'
                }`}></div>
                <span className={`text-sm ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8">
          <p className={`text-center text-xs font-light ${
            isDark ? 'text-zinc-600' : 'text-zinc-500'
          }`}>
            © 2024 Orbit
          </p>
        </div>
      </div>
    </div>
  )
}

export default MobileFallback