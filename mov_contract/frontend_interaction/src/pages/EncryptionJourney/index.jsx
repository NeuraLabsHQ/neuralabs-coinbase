import React, { useState, useEffect, useRef } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import './styles/index.css'

// Visual Components
import JourneyHeader from './components/visual/JourneyHeader'
import AnimatedCube from './components/visual/AnimatedCube'
import StepsTimeline from './components/visual/StepsTimeline'
import FloatingParticles from './components/visual/FloatingParticles'
import ControlPanel from './components/visual/ControlPanel'
import TechnicalDetails from './components/visual/TechnicalDetails'
import BackgroundGrid from './components/visual/BackgroundGrid'

// Functional Components  
import { useJourneyLogic } from './components/functional/journeyLogic.jsx'
import { useStepAnimations } from './components/functional/stepAnimations.jsx'
import { JOURNEY_STEPS } from './components/functional/journeySteps'

const EncryptionJourney = ({ config }) => {
  const account = useCurrentAccount()
  const containerRef = useRef(null)
  
  const {
    currentStep,
    setCurrentStep,
    isAnimating,
    setIsAnimating,
    showDetails,
    setShowDetails,
    startJourney,
    animateToNextStep
  } = useJourneyLogic(JOURNEY_STEPS.length)
  
  const {
    renderStepIcon,
    renderStepAnimation
  } = useStepAnimations()

  useEffect(() => {
    if (isAnimating && currentStep < JOURNEY_STEPS.length - 1) {
      animateToNextStep()
    }
  }, [currentStep, isAnimating, animateToNextStep])

  return (
    <div className="encryption-journey" ref={containerRef}>
      <JourneyHeader />

      <div className="journey-container">
        <AnimatedCube />
        
        <StepsTimeline 
          steps={JOURNEY_STEPS}
          currentStep={currentStep}
          isAnimating={isAnimating}
          renderStepIcon={renderStepIcon}
          renderStepAnimation={renderStepAnimation}
        />

        <FloatingParticles />
        
        <ControlPanel 
          isAnimating={isAnimating}
          showDetails={showDetails}
          startJourney={startJourney}
          setIsAnimating={setIsAnimating}
          setShowDetails={setShowDetails}
        />

        <TechnicalDetails showDetails={showDetails} />
      </div>

      <BackgroundGrid />
    </div>
  )
}

export default EncryptionJourney