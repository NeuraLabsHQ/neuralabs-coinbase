import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { renderActionContent, renderPrerequisiteWarning } from '../functional/actionContent'

/**
 * Animation Section Component
 * Displays animations with action content directly below
 */
const AnimationSection = ({ 
  animationPhase, 
  renderAnimation, 
  currentStep, 
  journeyData, 
  incompletePrerequisites,
  handleActionFromContent 
}) => {
  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')

  const handleAction = () => {
    if (handleActionFromContent) {
      handleActionFromContent({ nftName, nftDescription })
    }
  }

  return (
    <div className="animation-section-container">
      {/* Animation Area - Takes 80-90% of space */}
      <div className="animation-area">
        <AnimatePresence mode="wait">
          {renderAnimation(animationPhase)}
        </AnimatePresence>
      </div>
      
      {/* Action Content Area - Takes 10-20% of space */}
      <div className="action-content-area">
        {incompletePrerequisites && incompletePrerequisites.length > 0 ? 
          renderPrerequisiteWarning(incompletePrerequisites) :
          renderActionContent(currentStep, journeyData, nftName, nftDescription, setNftName, setNftDescription, handleAction)
        }
      </div>
    </div>
  )
}

export default AnimationSection