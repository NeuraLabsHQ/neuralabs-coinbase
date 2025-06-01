import React from 'react'
import { motion } from 'framer-motion'

const AccessCapabilityAnimation = ({ colorMode = 'light' }) => {
  const theme = {
    light: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#999999',
      level4 : '#aaaaaa',
      bg: 'transparent',
      glow: 'rgba(0, 0, 0, 0.1)',
      accent: '#333333',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#888888',
      level4 : '#555555',
      bg: 'transparent',
      glow: 'rgba(255, 255, 255, 0.1)',
      accent: '#dddddd',
    }
  }

  const colors = colorMode === "dark" ? theme.dark : theme.light

  // Position people in a circle with access levels
  const peoplePositions = [
    { angle: -Math.PI/2, level: 6, role: 'Admin' },     // top - highest access
    { angle: -Math.PI/6, level: 5, role: 'Manager' },   // top right
    { angle: Math.PI/6, level: 4, role: 'Lead' },       // bottom right
    { angle: Math.PI/2, level: 3, role: 'User' },       // bottom
    { angle: 5*Math.PI/6, level: 2, role: 'Guest' },    // bottom left
    { angle: -5*Math.PI/6, level: 1, role: 'Visitor' }, // top left
  ]

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Expanding security zones background */}
      {[1, 2, 3, 4, 5, 6].map((level) => (
        <motion.div
          key={level}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: level * 12,
            opacity: [0, 0.15, 0]
          }}
          transition={{ 
            duration: 4,
            delay: level * 0.3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeOut"
          }}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            border: `3px solid ${level === 6 ? colors.accent : colors.tertiary}`,
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Outer security perimeter */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          width: '80%',
          height: '80%',
          border: `2px solid ${colors.tertiary}`,
          borderRadius: '50%',
          opacity: 0.3
        }}
      />

      {/* Inner security zone */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          width: '55%',
          height: '55%',
          border: `2px solid ${colors.accent}`,
          borderRadius: '50%',
          opacity: 0.4
        }}
      />

      {/* Central authority/security controller */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, type: "spring", damping: 12 }}
        style={{
          position: 'absolute',
          zIndex: 10
        }}
      >
        {/* Authority circle */}
        <motion.div
          style={{
            width: '55px',
            height: '55px',
            borderRadius: '50%',
            backgroundColor: colors.accent,
            border: `3px solid ${colors.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${colors.glow}`
          }}
        >
          {/* Security/Lock icon instead of key */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="10" width="12" height="10" rx="1" stroke={colors.level4} strokeWidth="2" fill="none"/>
            <path d="M8 10V6a4 4 0 0 1 8 0v4" stroke={colors.level4} strokeWidth="2" fill="none"/>
            <circle cx="12" cy="15" r="1" fill={colors.level4}/>
          </svg>
        </motion.div>
        
        {/* Security pulse */}
        <motion.div
          animate={{
            scale: [1, 2, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '55px',
            height: '55px',
            borderRadius: '50%',
            backgroundColor: colors.accent,
            opacity: 0.3
          }}
        />
      </motion.div>

      {/* Users with different access levels */}
      {peoplePositions.map((person, index) => {
        const radius = 38 // percentage
        const x = Math.cos(person.angle) * radius
        const y = Math.sin(person.angle) * radius
        
        // Color coding based on access level
        const getAccessColor = (level) => {
          if (level >= 5) return colors.accent
          if (level >= 3) return colors.secondary
          return colors.tertiary
        }
        
        return (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: 1.5 + index * 0.2,
              type: "spring",
              stiffness: 120
            }}
            style={{
              position: 'absolute',
              left: `${50 + x}%`,
              top: `${50 + y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            {/* User circle - much more visible */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundColor: person.level >= 5 ? getAccessColor(person.level) : colors.bg,
                border: `3px solid ${getAccessColor(person.level)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '600',
                color: person.level >= 5 ? colors.level4 : getAccessColor(person.level),
                boxShadow: `0 2px 10px ${colors.glow}`,
                cursor: 'pointer'
              }}
            >
              {/* Access level number - much more prominent */}
              <div style={{ fontSize: '20px', fontWeight: '700' }}>
                {person.level}
              </div>
            </motion.div>
            
            {/* Role label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 + index * 0.1 }}
              style={{
                marginTop: '8px',
                fontSize: '11px',
                fontWeight: '500',
                color: colors.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {person.role}
            </motion.div>
            

          </motion.div>
        )
      })}

      {/* Security scanning effect */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          width: '90%',
          height: '90%',
          pointerEvents: 'none'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '0%',
          left: '50%',
          width: '2px',
          height: '45%',
          background: `linear-gradient(to bottom, ${colors.accent}, transparent)`,
          transformOrigin: 'bottom center',
          opacity: 0.6
        }} />
      </motion.div>


    </div>
  )
}

export default AccessCapabilityAnimation