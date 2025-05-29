import React from 'react'

const FloatingParticles = () => {
  return (
    <div className="particles-container">
      {[...Array(20)].map((_, i) => (
        <div key={i} className={`particle particle-${i}`}></div>
      ))}
    </div>
  )
}

export default FloatingParticles