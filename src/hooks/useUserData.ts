import { useState } from 'react'

export interface UserData {
  name: string
  skills: string[]
  companies: string[]
  lookingFor: string[]
  rememberMe: boolean
}

const STORAGE_KEY = 'orbit-user-data'

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(() => {
    // Try to load from localStorage on initialization
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only restore if rememberMe was true
        if (parsed.rememberMe) {
          return parsed
        }
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error)
    }
    return null
  })

  const saveUserData = (data: UserData) => {
    setUserData(data)
    
    if (data.rememberMe) {
      // Save to localStorage if remember me is checked
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Error saving user data to localStorage:', error)
      }
    } else {
      // Remove from localStorage if remember me is unchecked
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        console.error('Error removing user data from localStorage:', error)
      }
    }
  }

  const clearUserData = () => {
    setUserData(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing user data from localStorage:', error)
    }
  }

  const updateUserData = (updates: Partial<UserData>) => {
    if (userData) {
      const updated = { ...userData, ...updates }
      setUserData(updated)
      
      if (updated.rememberMe) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
          console.error('Error updating user data in localStorage:', error)
        }
      }
    }
  }

  return {
    userData,
    saveUserData,
    clearUserData,
    updateUserData,
    hasStoredData: userData !== null
  }
}

