import React from 'react'
import { motion } from 'framer-motion'

// Check if debug mode is enabled
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true'

/**
 * Progress Section Component
 * Shows the journey progress with steps
 */
const ProgressSection = ({ steps, currentStep, journeyData, renderStepIcon, onStepClick, onResetProgress, onResetFromStep }) => {
  
  // Check if a step can be clicked (all previous steps completed)
  const canClickStep = (stepIndex) => {
    if (stepIndex === 0) return true; // First step is always clickable
    
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!steps[i].completed(journeyData)) {
        return false;
      }
    }
    return true;
  }

  // Get incomplete prerequisite steps
  const getIncompletePrerequisites = (stepIndex) => {
    const incomplete = [];
    for (let i = 0; i < stepIndex; i++) {
      if (!steps[i].completed(journeyData)) {
        incomplete.push(steps[i]);
      }
    }
    return incomplete;
  }

  const handleStepClick = (stepIndex) => {
    if (canClickStep(stepIndex)) {
      onStepClick(stepIndex);
    } else {
      // Show prerequisites needed
      const incomplete = getIncompletePrerequisites(stepIndex);
      onStepClick(stepIndex, incomplete);
    }
  }

  return (
    <div className="progress-section hide-scrollbar ">
      <div className="progress-track">

        
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className={`progress-step ${step.completed(journeyData) ? 'completed' : ''} ${index === currentStep ? 'active' : ''} ${canClickStep(index) ? 'clickable' : 'disabled'}`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleStepClick(index)}
            style={{ cursor: canClickStep(index) ? 'pointer' : 'not-allowed' }}
          >
            <div className="step-icon">
              {renderStepIcon(step.icon, index === currentStep, step.completed(journeyData))}
            </div>
            <div className="step-info">
              <h3>{step.title}</h3>
              <p>{step.subtitle}</p>
              {step.completed(journeyData) && step.detail(journeyData) && (
                <motion.div 
                  className="step-detail"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  {step.detail(journeyData)}
                </motion.div>
              )}
            </div>
            
            {/* Debug mode refresh button */}
            {isDebugMode && step.completed(journeyData) && onResetFromStep && (
              <motion.button
                className="step-refresh-button"
                onClick={(e) => {
                  e.stopPropagation()
                  onResetFromStep(index)
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={`Reset from step ${index + 1}: ${step.title}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
              </motion.button>
            )}
          </motion.div>
        ))}
        
        {/* Reset Progress Button */}
        <motion.button
          className="reset-progress-button"
          onClick={onResetProgress}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: steps.length * 0.1 + 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 12a8 8 0 0 1 7.89-8 8.18 8.18 0 0 1 .9 0 8 8 0 0 1 7.21 8h-2a6 6 0 0 0-6-6 6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6h2a8 8 0 0 1-8 8 8 8 0 0 1-8-8z"/>
            <path d="m22 12-4-4v3H8v2h10v3z"/>
          </svg>
          Reset Progress
        </motion.button>
      </div>
    </div>
  )
}

export default ProgressSection