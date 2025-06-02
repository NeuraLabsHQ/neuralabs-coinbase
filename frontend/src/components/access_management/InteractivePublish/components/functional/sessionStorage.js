/**
 * Session Storage Management for Interactive Publish Journey
 * Saves and loads journey data to persist across page reloads
 */

const STORAGE_PREFIX = 'neuralabs_publish_'

/**
 * Generate a unique flow ID for this publish session
 */
export const generateFlowId = () => {
  return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Save step data to session storage
 * @param {string} flowId - Unique flow identifier
 * @param {string} stepName - Name of the step (e.g., 'wallet', 'mint', etc.)
 * @param {object} data - Step data to save
 * @param {boolean} completed - Whether the step is completed
 */
export const saveStepData = (flowId, stepName, data, completed = false) => {
  try {
    const key = `${STORAGE_PREFIX}${flowId}_${stepName}`
    const stepData = {
      data,
      completed,
      timestamp: Date.now()
    }
    sessionStorage.setItem(key, JSON.stringify(stepData))
    
    // Also update the completed steps array
    const completedKey = `${STORAGE_PREFIX}${flowId}_completed`
    const existingCompleted = JSON.parse(sessionStorage.getItem(completedKey) || '[]')
    
    if (completed && !existingCompleted.includes(stepName)) {
      existingCompleted.push(stepName)
      sessionStorage.setItem(completedKey, JSON.stringify(existingCompleted))
    }
    
    console.log(`Saved step data for ${stepName}:`, stepData)
  } catch (error) {
    console.error('Error saving step data:', error)
  }
}

/**
 * Load step data from session storage
 * @param {string} flowId - Unique flow identifier
 * @param {string} stepName - Name of the step to load
 * @returns {object|null} Step data or null if not found
 */
export const loadStepData = (flowId, stepName) => {
  try {
    const key = `${STORAGE_PREFIX}${flowId}_${stepName}`
    const stored = sessionStorage.getItem(key)
    
    if (stored) {
      const stepData = JSON.parse(stored)
      console.log(`Loaded step data for ${stepName}:`, stepData)
      return stepData
    }
    
    return null
  } catch (error) {
    console.error('Error loading step data:', error)
    return null
  }
}

/**
 * Save current step index
 * @param {string} flowId - Unique flow identifier
 * @param {number} currentStep - Current step index
 */
export const saveCurrentStep = (flowId, currentStep) => {
  try {
    const key = `${STORAGE_PREFIX}${flowId}_current`
    sessionStorage.setItem(key, currentStep.toString())
  } catch (error) {
    console.error('Error saving current step:', error)
  }
}

/**
 * Load current step index
 * @param {string} flowId - Unique flow identifier
 * @returns {number} Current step index or 0 if not found
 */
export const loadCurrentStep = (flowId) => {
  try {
    const key = `${STORAGE_PREFIX}${flowId}_current`
    const stored = sessionStorage.getItem(key)
    return stored ? parseInt(stored, 10) : 0
  } catch (error) {
    console.error('Error loading current step:', error)
    return 0
  }
}

/**
 * Save complete journey data
 * @param {string} flowId - Unique flow identifier
 * @param {object} journeyData - Complete journey data object
 */
export const saveJourneyData = (flowId, journeyData) => {
  try {
    const key = `${STORAGE_PREFIX}${flowId}_journey`
    const dataToSave = {
      ...journeyData,
      timestamp: Date.now()
    }
    sessionStorage.setItem(key, JSON.stringify(dataToSave))
    console.log('Saved journey data:', dataToSave)
  } catch (error) {
    console.error('Error saving journey data:', error)
  }
}

/**
 * Load complete journey data
 * @param {string} flowId - Unique flow identifier
 * @returns {object|null} Journey data or null if not found
 */
export const loadJourneyData = (flowId) => {
  try {
    const key = `${STORAGE_PREFIX}${flowId}_journey`
    const stored = sessionStorage.getItem(key)
    
    if (stored) {
      const journeyData = JSON.parse(stored)
      console.log('Loaded journey data:', journeyData)
      return journeyData
    }
    
    return null
  } catch (error) {
    console.error('Error loading journey data:', error)
    return null
  }
}

/**
 * Get all completed steps for a flow
 * @param {string} flowId - Unique flow identifier
 * @returns {string[]} Array of completed step names
 */
export const getCompletedSteps = (flowId) => {
  try {
    const key = `${STORAGE_PREFIX}${flowId}_completed`
    const stored = sessionStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading completed steps:', error)
    return []
  }
}

/**
 * Clear all data for a specific flow
 * @param {string} flowId - Unique flow identifier
 */
export const clearFlowData = (flowId) => {
  try {
    const keys = []
    
    // Collect all keys for this flow
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(`${STORAGE_PREFIX}${flowId}`)) {
        keys.push(key)
      }
    }
    
    // Remove all keys for this flow
    keys.forEach(key => {
      sessionStorage.removeItem(key)
    })
    
    console.log(`Cleared ${keys.length} items for flow ${flowId}`)
  } catch (error) {
    console.error('Error clearing flow data:', error)
  }
}

/**
 * Get the current flow ID from session storage or generate a new one
 * @returns {string} Flow ID
 */
export const getFlowId = () => {
  try {
    const key = `${STORAGE_PREFIX}current_flow_id`
    let flowId = sessionStorage.getItem(key)
    
    if (!flowId) {
      flowId = generateFlowId()
      sessionStorage.setItem(key, flowId)
    }
    
    return flowId
  } catch (error) {
    console.error('Error getting flow ID:', error)
    return generateFlowId() // Fallback to new ID
  }
}

/**
 * Set a new flow ID (useful for resetting progress)
 * @param {string} flowId - New flow ID (optional, will generate if not provided)
 * @returns {string} The flow ID that was set
 */
export const setFlowId = (flowId = null) => {
  try {
    const newFlowId = flowId || generateFlowId()
    const key = `${STORAGE_PREFIX}current_flow_id`
    sessionStorage.setItem(key, newFlowId)
    return newFlowId
  } catch (error) {
    console.error('Error setting flow ID:', error)
    return generateFlowId() // Fallback to new ID
  }
}

/**
 * Check if a flow has any saved data
 * @param {string} flowId - Unique flow identifier
 * @returns {boolean} True if flow has saved data
 */
export const hasFlowData = (flowId) => {
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(`${STORAGE_PREFIX}${flowId}`) && !key.endsWith('_current_flow_id')) {
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Error checking for flow data:', error)
    return false
  }
}

/**
 * Get flow summary for debugging
 * @param {string} flowId - Unique flow identifier
 * @returns {object} Summary of flow data
 */
export const getFlowSummary = (flowId) => {
  try {
    const summary = {
      flowId,
      currentStep: loadCurrentStep(flowId),
      completedSteps: getCompletedSteps(flowId),
      journeyData: loadJourneyData(flowId),
      hasData: hasFlowData(flowId)
    }
    
    return summary
  } catch (error) {
    console.error('Error getting flow summary:', error)
    return { flowId, error: error.message }
  }
}