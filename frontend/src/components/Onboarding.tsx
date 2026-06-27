import React, { useState, useRef, useEffect } from 'react'
import Cubes from './Cubes'

interface OnboardingProps {
  onComplete: (userData: UserData) => void
  isDark: boolean
  initialData?: UserData
}

interface UserData {
  name: string
  skills: string[]
  companies: string[]
  lookingFor: string[]
  rememberMe: boolean
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isDark, initialData }) => {
  const [userData, setUserData] = useState<UserData>({
    name: initialData?.name || '',
    skills: initialData?.skills || [],
    companies: (initialData as any)?.companies || [],
    lookingFor: initialData?.lookingFor || [],
    rememberMe: initialData?.rememberMe || false
  })

  const [tempSkill, setTempSkill] = useState('')
  const [tempCompany, setTempCompany] = useState('')
  const [nameError, setNameError] = useState('')
  const [skillError, setSkillError] = useState('')
  const [companyError, setCompanyError] = useState('')

  const skillInputRef = useRef<HTMLInputElement>(null)
  const companyInputRef = useRef<HTMLInputElement>(null)

  const lookingForOptions = [
    'Just chilling', 'Internship', 'Full time role', 'Hiring', 'Networking', 'Freelance'
  ]

  // Enhanced validation
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.trim().length > 50) return 'Name must be less than 50 characters'
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes'
    return ''
  }

  const validateSkill = (skill: string): string => {
    if (!skill.trim()) return 'Skill cannot be empty'
    if (skill.trim().length < 2) return 'Skill must be at least 2 characters'
    if (skill.trim().length > 30) return 'Skill must be less than 30 characters'
    if (userData.skills.includes(skill.trim())) return 'Skill already added'
    return ''
  }

  const validateCompany = (company: string): string => {
    if (!company.trim()) return 'Company cannot be empty'
    if (company.trim().length < 2) return 'Company must be at least 2 characters'
    if (company.trim().length > 50) return 'Company must be less than 50 characters'
    if (userData.companies.includes(company.trim())) return 'Company already added'
    return ''
  }

  const addSkill = () => {
    const error = validateSkill(tempSkill)
    if (error) {
      setSkillError(error)
      return
    }
    
    setUserData(prev => ({ ...prev, skills: [...prev.skills, tempSkill.trim()] }))
    setTempSkill('')
    setSkillError('')
    setTimeout(() => skillInputRef.current?.focus(), 100)
  }

  const removeSkill = (skill: string) => {
    setUserData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const addCompany = () => {
    const error = validateCompany(tempCompany)
    if (error) {
      setCompanyError(error)
      return
    }
    
    setUserData(prev => ({ ...prev, companies: [...prev.companies, tempCompany.trim()] }))
    setTempCompany('')
    setCompanyError('')
    setTimeout(() => companyInputRef.current?.focus(), 100)
  }

  const removeCompany = (company: string) => {
    setUserData(prev => ({ ...prev, companies: prev.companies.filter(c => c !== company) }))
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    } else if (e.key === 'Backspace' && tempSkill === '' && userData.skills.length > 0) {
      e.preventDefault()
      setUserData(prev => ({ ...prev, skills: prev.skills.slice(0, -1) }))
    }
  }

  const handleCompanyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCompany()
    } else if (e.key === 'Backspace' && tempCompany === '' && userData.companies.length > 0) {
      e.preventDefault()
      setUserData(prev => ({ ...prev, companies: prev.companies.slice(0, -1) }))
    }
  }

  const handleComplete = () => {
    const nameError = validateName(userData.name)
    if (nameError) {
      setNameError(nameError)
      return
    }
    onComplete(userData)
  }

  const canProceed = () => {
    const nameError = validateName(userData.name)
    return nameError === ''
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setUserData(prev => ({ ...prev, name }))
    
    if (nameError) {
      const error = validateName(name)
      setNameError(error)
    }
  }

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skill = e.target.value
    setTempSkill(skill)
    
    if (skillError) {
      const error = validateSkill(skill)
      setSkillError(error)
    }
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const company = e.target.value
    setTempCompany(company)
    
    if (companyError) {
      const error = validateCompany(company)
      setCompanyError(error)
    }
  }

  useEffect(() => {
    const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement
    if (nameInput && !userData.name) {
      nameInput.focus()
    }
  }, [])

  const textContainerRef = useRef<HTMLDivElement>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)
  const [cubesWidth, setCubesWidth] = useState<number | null>(null)
  const [cubesHeight, setCubesHeight] = useState<number | null>(null)

  useEffect(() => {
    const recalc = () => {
      const textWidth = textContainerRef.current?.offsetWidth || 0
      const formHeight = formContainerRef.current?.offsetHeight || 0
      const textHeight = textContainerRef.current?.offsetHeight || 0

      // Leave some breathing room (gap) between text and cubes
      const gap = 32
      const availableHeight = Math.max(0, formHeight - textHeight - gap)

      setCubesWidth(textWidth || null)
      // Prefer using available height so left column doesn't exceed form height
      // Fallback to a sensible height on small screens or if measurements fail
      setCubesHeight(
        availableHeight > 0
          ? availableHeight
          : Math.max(280, Math.min(520, Math.floor(window.innerHeight * 0.4)))
      )
    }

    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [])

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' : 'bg-gradient-to-br from-white via-slate-50 to-gray-100'
    }`}>
      <div className={`w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12`}>
        
        {/* Left Side - Welcome & Branding */}
        <div className="flex flex-col justify-center space-y-8">
          <div ref={textContainerRef}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm"></div>
              </div>
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Orbit
              </span>
            </div>
            
            <h1 className={`text-4xl lg:text-5xl font-bold mb-4 leading-tight ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to your
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent"> professional orbit</span>
            </h1>
            
            <p className={`text-lg leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Connect with like-minded professionals, discover opportunities, and build meaningful relationships in your field.
            </p>
          </div>

          {/* Visual Element */}
          <div
            style={{
              position: 'relative',
              width: cubesWidth ? `${cubesWidth}px` : '100%',
              maxWidth: '100%',
              height: cubesHeight ? `${cubesHeight}px` : '400px'
            }}
          >
            <Cubes 
              gridSize={6}
              maxAngle={60}
              radius={4}
              borderStyle="2px dashed #5227FF"
              faceColor="#1a1a2e"
              rippleColor="#ff6b6b"
              rippleSpeed={1.5}
              autoAnimate={true}
              rippleOnClick={true}
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div ref={formContainerRef} className={`rounded-3xl border backdrop-blur-sm transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800/50 border-gray-700/50 shadow-2xl shadow-black/20' 
            : 'bg-white/80 border-gray-200/50 shadow-xl shadow-gray-500/10'
        }`}>
          <div className="p-8 space-y-6">
            
            {/* Name Input */}
            <div>
              <input
                type="text"
                value={userData.name}
                onChange={handleNameChange}
                placeholder="What's your name? *"
                className={`w-full px-0 py-4 text-xl font-medium bg-transparent border-0 border-b-2 transition-all duration-300 focus:outline-none placeholder-opacity-70 ${
                  nameError 
                    ? 'border-red-400 text-red-400 placeholder-red-400' 
                    : isDark 
                      ? 'border-gray-600 text-white placeholder-gray-400 focus:border-emerald-400' 
                      : 'border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                }`}
              />
              {nameError && (
                <p className="mt-2 text-sm text-red-400">{nameError}</p>
              )}
            </div>

            {/* Skills */}
            <div>
              <div className="relative">
                <input
                  ref={skillInputRef}
                  type="text"
                  value={tempSkill}
                  onChange={handleSkillChange}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Add your skills (press Enter)"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
                {skillError && (
                  <p className="mt-1 text-sm text-red-400">{skillError}</p>
                )}
              </div>
              
              {userData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {userData.skills.map((skill) => (
                    <span
                      key={skill}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                        isDark 
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' 
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Companies */}
            <div>
              <div className="relative">
                <input
                  ref={companyInputRef}
                  type="text"
                  value={tempCompany}
                  onChange={handleCompanyChange}
                  onKeyDown={handleCompanyKeyDown}
                  placeholder="Where do you work? (press Enter)"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/20 ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
                {companyError && (
                  <p className="mt-1 text-sm text-red-400">{companyError}</p>
                )}
              </div>
              
              {userData.companies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {userData.companies.map((company) => (
                    <span
                      key={company}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {company}
                      <button
                        onClick={() => removeCompany(company)}
                        className="ml-2 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Looking For */}
            <div>
              <p className={`text-sm font-medium mb-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                What are you looking for?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {lookingForOptions.map((option) => {
                  const active = userData.lookingFor.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setUserData(prev => ({
                          ...prev,
                          lookingFor: active
                            ? prev.lookingFor.filter(o => o !== option)
                            : [...prev.lookingFor, option]
                        }))
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent shadow-md'
                          : isDark
                            ? 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={userData.rememberMe}
                onChange={(e) => setUserData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                className="w-4 h-4 text-emerald-500 bg-gray-100 border-gray-300 rounded focus:ring-emerald-400 focus:ring-2"
              />
              <label htmlFor="rememberMe" className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Remember my preferences
              </label>
            </div>

            {/* Action Button */}
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                canProceed()
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canProceed() ? 'Enter your orbit' : 'Please enter your name'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding