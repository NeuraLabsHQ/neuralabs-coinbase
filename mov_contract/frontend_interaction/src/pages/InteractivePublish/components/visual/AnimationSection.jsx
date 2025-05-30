import React from 'react'
import { motion } from 'framer-motion'
import { INTERACTIVE_PUBLISH_STEPS } from '../functional/journeyConfig'

/**
 * Animation Section Component
 * Central animation area matching Interactive Journey style
 */
const AnimationSection = ({ currentStep, isProcessing, animationPhase }) => {
  const step = INTERACTIVE_PUBLISH_STEPS[currentStep]
  
  return (
    <div className="animation-section">
      <canvas className="animation-canvas" />
      
      <div className="animation-content">
        <motion.h2
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {step.title}
        </motion.h2>
        
        <motion.p
          key={`${currentStep}-subtitle`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {step.subtitle}
        </motion.p>
        
        {isProcessing && (
          <motion.div
            className="processing-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginTop: '30px' }}
          >
            <motion.div
              style={{
                width: '60px',
                height: '60px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderTop: '3px solid #fff',
                borderRadius: '50%',
                margin: '0 auto',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default AnimationSection