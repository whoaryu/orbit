import { useState, useEffect } from 'react'
import React from 'react'
import Onboarding from './components/Onboarding'
import CallScreen from './components/CallScreen'
import MobileFallback from './components/MobileFallback'
import { useUserData } from './hooks/useUserData'
import type { UserData } from './hooks/useUserData'
// import RotatingText from './components/RotatingTitle'
//import CountUp from './components/CountUp'


// Dark mode context
const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => {}
})



function App() {
  const [isConnecting] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'home' | 'onboarding' | 'call'>('home')
  const { userData, saveUserData, hasStoredData } = useUserData()
  const [isMobile, setIsMobile] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage for saved preference, default to light mode
    const saved = localStorage.getItem('orbit-theme')
    return saved ? JSON.parse(saved) : false
  })

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('orbit-theme', JSON.stringify(isDark))
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Detect small screens (mobile) and update on resize/orientation changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const handleStartCall = () => {
    setCurrentScreen('onboarding')
  }

  const handleOnboardingComplete = (data: UserData) => {
    saveUserData(data)
    setCurrentScreen('call')
  }


  const handleEndCall = () => {
    setCurrentScreen('home')
  }

  // Mock partner data for demo
  const mockPartnerInfo = {
    name: 'Zuck',
    skills: ['React', 'TypeScript', 'Node.js', 'Python'],
    interests: ['AI', 'Web Development', 'Open Source'],
    experience: 'Senior Developer',
    lookingFor: ['Collaboration', 'Learning', 'Mentorship']
  }

  // Render different screens based on current state
  if (isMobile) {
    return <MobileFallback isDark={isDark} />
  }
  if (currentScreen === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} isDark={isDark} initialData={userData || undefined} />
  }

  if (currentScreen === 'call') {
    return (
      <CallScreen
        isDark={isDark}
        onEndCall={handleEndCall}
        partnerInfo={mockPartnerInfo}
        userData={userData || undefined}
      />
    )
  }

  // Home screen (default)
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 to-gray-900 text-white' 
          : 'bg-gradient-to-br from-slate-50 to-gray-50 text-slate-900'
      }`}>
        {/* Header */}
        <header className={`border-b transition-colors duration-300 sticky top-0 z-50 ${
          isDark 
            ? 'border-slate-700 bg-slate-900/80 backdrop-blur-sm' 
            : 'border-slate-200 bg-white/80 backdrop-blur-sm'
        }`}>
           <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              {/* Logo - consistent with other pages */}
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
              
              <div className="flex items-center space-x-6">
                {/* Sponsors */}
                <nav className="hidden md:flex items-center space-x-5">
                  <a
                    href="https://buymeachai.ezee.li/whoaryu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center"
                    aria-label="Sponsor with Chai"
                  >
                    <img
                      src="/chai.png"
                      alt="Buy me a Chai"
                      className={`h-8 w-8 rounded-lg shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md ${
                        isDark ? 'ring-1 ring-slate-600' : 'ring-1 ring-slate-200'
                      }`}
                    />
                  </a>
                  <a
                    href="https://buymeacoffee.com/whoaryu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center"
                    aria-label="Sponsor with Coffee"
                  >
                    <img
                      src="/coffee.png"
                      alt="Buy me a Coffee"
                      className={`h-8 w-8 rounded-lg shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md ${
                        isDark ? 'ring-1 ring-slate-600' : 'ring-1 ring-slate-200'
                      }`}
                    />
                  </a>
                </nav>
                
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                    isDark 
                      ? 'bg-slate-700 hover:bg-slate-600 text-yellow-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  aria-label="Toggle dark mode"
                >
                  {isDark ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 transition-colors duration-300 ${
              isDark 
                ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300' 
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                isDark ? 'bg-emerald-400' : 'bg-emerald-500'
              }`}></span>
              Live • 127 developers online
            </div>
            
            <h2 className={`mb-6 tracking-tight transition-colors duration-300 leading-[1.05] ${
              isDark ? 'text-white' : 'text-slate-900'
            } text-5xl sm:text-6xl md:text-7xl font-extrabold`}>
              <span className={`${
                isDark
                  ? 'bg-gradient-to-r from-emerald-300 via-teal-300 to-sky-400'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600'
              } bg-clip-text text-transparent`}>Build real connections with</span>
              <br />
              top techies in the world
            </h2>
            <p className={`mb-12 max-w-3xl mx-auto transition-colors duration-300 text-balance ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            } text-lg sm:text-xl leading-relaxed font-normal`}>
              Drop into meaningful video chats with peers who share your stack and ambitions.
              No sign-ups, no friction — just genuine connections that accelerate your journey.
            </p>
            
            
            {/* Call to Action */}
            <div className="space-y-4">
              {hasStoredData && userData && (
                <div className="mb-6">
                  <button
                    onClick={() => setCurrentScreen('call')}
                    className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      isDark 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    Continue as {userData.name}
                  </button>
                  <p className={`text-sm mt-2 transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Welcome back! Your profile is ready.
                  </p>
      </div>
              )}
              
              <button
                onClick={handleStartCall}
                disabled={isConnecting}
                className={`px-10 py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                  isDark 
                    ? 'bg-white text-slate-900 hover:bg-slate-100' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding Connection...
                  </span>
                ) : (
                  hasStoredData ? 'Start New Call' : 'Start a Call'
                )}
        </button>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {hasStoredData ? 'Start a new connection or continue with your profile' : 'Connect instantly with developers worldwide'}
              </p>
            </div>
          </div>

          {/* Steps (simple 3-step flow) */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: 'Tell us who you are',
                desc: 'Add your role, stack, and interests so we can match you well.',
                color: isDark ? 'from-emerald-500 to-teal-400' : 'from-emerald-500 to-teal-600'
              },
              {
                title: 'Get instantly matched',
                desc: 'We connect you with peers at a similar level, in seconds.',
                color: isDark ? 'from-blue-400 to-indigo-400' : 'from-blue-500 to-indigo-600'
              },
              {
                title: 'Jump into a call',
                desc: 'Video + chat in a focused workspace designed for real conversations.',
                color: isDark ? 'from-purple-400 to-pink-400' : 'from-purple-500 to-pink-600'
              }
            ].map((step, index) => (
              <div
                key={index}
                className={`p-6 md:p-8 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                  isDark ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600' : 'bg-white/90 border-slate-200 hover:border-slate-300 backdrop-blur'
                }`}
              >
                <div className="flex items-center mb-5">
                  <div className={`w-10 h-10 rounded-xl mr-4 flex items-center justify-center bg-gradient-to-br ${step.color}`}>
                    <span className="text-white font-semibold">{index + 1}</span>
              </div>
                  <h3 className={`text-lg md:text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
            </div>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed font-light`}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <div className={`inline-flex items-center space-x-8 rounded-2xl px-8 py-6 border transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              <div>
              <div className={`text-3xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>2847</div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>Developers Connected</div>
              </div>
              <div className={`w-px h-12 transition-colors duration-300 ${
                isDark ? 'bg-slate-600' : 'bg-slate-200'
              }`}></div>
              <div>
                <div className={`text-3xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>127</div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>Currently Online</div>
              </div>
              <div className={`w-px h-12 transition-colors duration-300 ${
                isDark ? 'bg-slate-600' : 'bg-slate-200'
              }`}></div>
              <div>
                <div className={`text-3xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>15,392</div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>Calls Made</div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={`border-t mt-20 transition-colors duration-300 ${
          isDark 
            ? 'border-slate-700 bg-slate-900/50' 
            : 'border-slate-200 bg-white/50'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className={`text-center text-sm font-medium transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <p>&copy; 2024 Orbit. Built for developers, by developers.</p>
            </div>
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
  )
}

export default App


