import React from 'react'
import { motion } from 'framer-motion'

/**
 * Background Effects Component
 * Provides animated background elements matching Interactive Journey style
 */
const BackgroundEffects = () => {
  return (
    <div className="background-effects">
      {/* Grid Pattern */}
      <div className="grid-pattern" />
      
      {/* Gradient Orbs */}
      <motion.div 
        className="gradient-orb orb-1"
        animate={{
          x: [0, -100, 100, 0],
          y: [0, 100, -50, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="gradient-orb orb-2"
        animate={{
          x: [0, 100, -100, 0],
          y: [0, -100, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

export default BackgroundEffects