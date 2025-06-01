import React from 'react'
import { motion } from 'framer-motion'

/**
 * Journey Header Component
 * Displays the main title and description for interactive journey
 */
const JourneyHeader = () => {
  return (
    <motion.div 
      className="journey-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1>Encryption Journey</h1>
      <p>Experience the power of decentralized encryption</p>
    </motion.div>
  )
}

export default JourneyHeader