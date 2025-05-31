import React from 'react'
import { AnimatePresence } from 'framer-motion'

/**
 * Animation Section Component
 * Displays animations only
 */
const AnimationSection = ({ 
  animationPhase, 
  renderAnimation
}) => {
  return (
    <div className="animation-section">
      <AnimatePresence mode="wait">
        {renderAnimation(animationPhase)}
      </AnimatePresence>
    </div>
  )
}

export default AnimationSection