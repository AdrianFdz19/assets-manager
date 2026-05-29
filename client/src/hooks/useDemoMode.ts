import { useState } from 'react';

export const useDemoMode = () => {
  const [isRestrictionOpen, setIsRestrictionOpen] = useState(false);
  
  // Lee la variable de entorno (Vite usa import.meta.env)
  const isDemoMode = import.meta.env.VITE_APP_MODE;

  const protectAction = (action: () => void) => {
    if (isDemoMode === 'demo') {
      setIsRestrictionOpen(true);
    } else {
      action();
    }
  };

  return {
    isRestrictionOpen,
    setIsRestrictionOpen,
    protectAction,
    isDemoMode
  };
};