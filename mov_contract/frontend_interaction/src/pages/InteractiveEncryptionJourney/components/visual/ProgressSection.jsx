import React from 'react'
import { motion } from 'framer-motion'

/**
 * Progress Section Component
 * Shows the journey progress with steps
 */
const ProgressSection = ({ steps, currentStep, journeyData, renderStepIcon }) => {
  return (
    <div className="progress-section">
      <div className="progress-track">
        <motion.div 
          className="progress-fill"
          initial={{ height: '0%' }}
          animate={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className={`progress-step ${step.completed(journeyData) ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
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
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ProgressSection