import React from 'react'

const ControlPanel = ({ isAnimating, showDetails, startJourney, setIsAnimating, setShowDetails }) => {
  return (
    <div className="control-panel">
      {!isAnimating ? (
        <button onClick={startJourney} className="journey-button">
          Start Journey
        </button>
      ) : (
        <button onClick={() => setIsAnimating(false)} className="journey-button secondary">
          Pause Journey
        </button>
      )}
      <button 
        onClick={() => setShowDetails(!showDetails)} 
        className="journey-button secondary ml-4"
      >
        {showDetails ? 'Hide' : 'Show'} Technical Details
      </button>
    </div>
  )
}

export default ControlPanel