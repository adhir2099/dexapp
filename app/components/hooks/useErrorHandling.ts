import { useState } from 'react';

export const useErrorHandling = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = (error: any, customMessage: string) => {
    console.error(customMessage, error);
    setErrorMessage(customMessage);
  };

  const clearError = () => setErrorMessage(null);

  return { errorMessage, handleError, clearError };
};
