import React, { createContext, useContext, useState } from 'react';

const AIChatContext = createContext(null);

export const AIChatProvider = ({ children }) => {
  const [analysisContext, setAnalysisContext] = useState(null);

  return (
    <AIChatContext.Provider value={{ analysisContext, setAnalysisContext }}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error('useAIChat must be used within AIChatProvider');
  return ctx;
};

export default AIChatContext;
