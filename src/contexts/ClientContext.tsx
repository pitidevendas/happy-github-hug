import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ClientContextType {
  selectedClientId: string | null;
  selectedClientEmail: string | null;
  selectClient: (uid: string, email: string) => void;
  clearClient: () => void;
  isImpersonating: boolean;
}

const ClientContext = createContext<ClientContextType>({} as ClientContextType);

export const useClient = () => useContext(ClientContext);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);

  const selectClient = (uid: string, email: string) => {
    setSelectedClientId(uid);
    setSelectedClientEmail(email);
  };

  const clearClient = () => {
    setSelectedClientId(null);
    setSelectedClientEmail(null);
  };

  const isImpersonating = !!selectedClientId;

  return (
    <ClientContext.Provider value={{
      selectedClientId,
      selectedClientEmail,
      selectClient,
      clearClient,
      isImpersonating
    }}>
      {children}
    </ClientContext.Provider>
  );
};
