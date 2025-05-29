/**
 * Journey Logic Hook
 * Manages the journey state and progression
 */
import { useState, useCallback } from 'react'

export const useJourneyLogic = (totalSteps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const startJourney = useCallback(() => {
    setIsAnimating(true)
    setCurrentStep(0)
  }, [])

  const animateToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 3000)
    } else {
      setIsAnimating(false)
    }
  }, [currentStep, totalSteps])

  const pauseJourney = useCallback(() => {
    setIsAnimating(false)
  }, [])

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev)
  }, [])

  return {
    currentStep,
    setCurrentStep,
    isAnimating,
    setIsAnimating,
    showDetails,
    setShowDetails,
    startJourney,
    pauseJourney,
    animateToNextStep,
    toggleDetails
  }
}