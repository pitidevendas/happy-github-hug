import { createContext, useContext, useState, ReactNode } from "react";

interface ClientContextType {
  selectedClientId: string | null;
  selectedClientEmail: string | null;
  selectClient: (uid: string, email: string) => void;
  clearClient: () => void;
  isImpersonating: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function useClient(): ClientContextType {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
}

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
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

  const value: ClientContextType = {
    selectedClientId,
    selectedClientEmail,
    selectClient,
    clearClient,
    isImpersonating,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}
