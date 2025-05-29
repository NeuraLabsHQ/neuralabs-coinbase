import React from 'react'

const AnimatedCube = () => {
  return (
    <div className="cube-container">
      <div className="cube">
        <div className="cube-face front">
          <svg viewBox="0 0 100 100" className="face-icon">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="50" cy="50" r="15" fill="white"/>
          </svg>
        </div>
        <div className="cube-face back">
          <svg viewBox="0 0 100 100" className="face-icon">
            <path d="M50 20 L70 40 L70 60 L50 80 L30 60 L30 40 Z" fill="none" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        <div className="cube-face left">
          <svg viewBox="0 0 100 100" className="face-icon">
            <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M35 50 L50 35 L65 50" fill="none" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        <div className="cube-face right">
          <svg viewBox="0 0 100 100" className="face-icon">
            <rect x="30" y="30" width="40" height="40" fill="none" stroke="white" strokeWidth="2"/>
            <line x1="30" y1="50" x2="70" y2="50" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        <div className="cube-face top">
          <svg viewBox="0 0 100 100" className="face-icon">
            <polygon points="50,20 70,50 50,80 30,50" fill="none" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        <div className="cube-face bottom">
          <svg viewBox="0 0 100 100" className="face-icon">
            <path d="M30 30 Q50 20 70 30 T70 70 Q50 80 30 70 T30 30" fill="none" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default AnimatedCube