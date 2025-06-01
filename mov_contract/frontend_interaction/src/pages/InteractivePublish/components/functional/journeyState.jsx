import { useState, useCallback } from 'react';
import { initialState } from './journeyConfig';

export const useJourneyState = () => {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setCurrentStep = useCallback((step) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const markStepComplete = useCallback((stepIndex) => {
    setState((prev) => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, stepIndex])],
    }));
  }, []);

  const setLoading = useCallback((loading) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const resetJourney = useCallback(() => {
    setState(initialState);
  }, []);

  const canProceed = useCallback((stepIndex) => {
    if (stepIndex === 0) return true;
    return state.completedSteps.includes(stepIndex - 1);
  }, [state.completedSteps]);

  return {
    state,
    updateState,
    setCurrentStep,
    markStepComplete,
    setLoading,
    setError,
    resetJourney,
    canProceed,
  };
};