import React from 'react'

const StepsTimeline = ({ steps, currentStep, isAnimating, renderStepIcon, renderStepAnimation }) => {
  return (
    <div className="steps-timeline">
      {steps.map((step, index) => (
        <div 
          key={step.id}
          className={`step ${index <= currentStep ? 'active' : ''} ${index === currentStep ? 'current' : ''}`}
        >
          <div className="step-connector">
            <div className="connector-line"></div>
            <div className="pulse-ring"></div>
          </div>
          
          <div className="step-content">
            <div className="step-icon">
              {renderStepIcon(step.icon, index === currentStep)}
            </div>
            <div className="step-info">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index === currentStep && step.details && (
                <p className="step-details">{step.details}</p>
              )}
            </div>
          </div>

          {index === currentStep && isAnimating && (
            <div className="step-animation">
              {renderStepAnimation(step.id)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default StepsTimeline