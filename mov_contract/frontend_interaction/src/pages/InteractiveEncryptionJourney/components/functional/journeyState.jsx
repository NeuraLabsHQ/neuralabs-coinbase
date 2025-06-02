/**
 * Journey State Management Hook
 * Manages the interactive journey state
 */
import { useState, useCallback } from 'react'

export const useJourneyState = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [animationPhase, setAnimationPhase] = useState('idle')
  const [journeyData, setJourneyData] = useState({
    account: null,
    userNFTs: [],
    selectedNFT: null,
    sessionKey: null,
    sealInitialized: false,
    selectedFile: null,
    mockEncryptedData: null,
    walrusBlobId: null,
    completionData: null,
    accessLevel: 0
  })

  const updateJourneyData = useCallback((updates) => {
    setJourneyData(prev => ({ ...prev, ...updates }))
  }, [])

  const resetJourney = useCallback(() => {
    setCurrentStep(0)
    setIsProcessing(false)
    setAnimationPhase('idle')
    setJourneyData({
      account: null,
      userNFTs: [],
      selectedNFT: null,
      sessionKey: null,
      sealInitialized: false,
      selectedFile: null,
      mockEncryptedData: null,
      walrusBlobId: null,
      completionData: null,
      accessLevel: 0
    })
  }, [])

  return {
    currentStep,
    setCurrentStep,
    isProcessing,
    setIsProcessing,
    animationPhase,
    setAnimationPhase,
    journeyData,
    updateJourneyData,
    resetJourney
  }
}