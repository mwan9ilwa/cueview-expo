import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
  isConnected: boolean;
  isOnline: boolean;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: React.ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('📶 Network state:', {
        connected: state.isConnected,
        type: state.type,
        details: state.details,
      });
      
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const contextValue: NetworkContextType = {
    isConnected,
    isOnline: isConnected,
    connectionType,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

// Utility function for checking connectivity
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error('Failed to check connectivity:', error);
    return false;
  }
};
