import React from 'react'
import { AnimatePresence } from 'framer-motion'

/**
 * Animation Section Component
 * Displays just the animations (text is now separate)
 */
const AnimationSection = ({ animationPhase, renderAnimation }) => {
  return (
    <div className="animation-section">
      <AnimatePresence mode="wait">
        {renderAnimation(animationPhase)}
      </AnimatePresence>
    </div>
  )
}

export default AnimationSection