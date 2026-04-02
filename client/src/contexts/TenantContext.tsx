import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Client, ClientConfiguration, TenantContext } from '../types/config';

const TenantContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clients] = useState<Client[]>([]);
  const [configurations, setConfigurations] = useState<Record<string, ClientConfiguration>>({});

  // Initialize with default clients
  useState(() => {
    const defaultClients: Client[] = [
      {
        id: 'client-a',
        name: 'Client A',
        displayName: 'Client A',
        domain: 'client-a.example.com',
        theme: 'light',
        settings: {
          timezone: 'UTC',
          dateFormat: 'DD/MM/YYYY',
          currency: 'USD',
          language: 'en'
        },
        metadata: {
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
          isActive: true,
          isDefault: true
        }
      },
      {
        id: 'client-b',
        name: 'Client B',
        displayName: 'Client B',
        domain: 'client-b.example.com',
        theme: 'dark',
        settings: {
          timezone: 'UTC+5:30',
          dateFormat: 'MM/DD/YYYY',
          currency: 'EUR',
          language: 'en'
        },
        metadata: {
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
          isActive: true,
          isDefault: false
        }
      }
    ];

    const defaultConfigs: Record<string, ClientConfiguration> = {
      'client-a': {
        clientId: 'client-a',
        configurations: {
          services: [],
          integrations: [],
          customMappings: {},
          settings: {
            notifications: true,
            logging: true,
            debugging: false
          }
        },
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      },
      'client-b': {
        clientId: 'client-b',
        configurations: {
          services: [],
          integrations: [],
          customMappings: {},
          settings: {
            notifications: true,
            logging: true,
            debugging: false
          }
        },
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    setClients(defaultClients);
    setConfigurations(defaultConfigs);
  });

  const switchClient = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setCurrentClient(client);
      // Load client-specific configurations
      const clientConfig = configurations[clientId];
      if (clientConfig) {
        console.log(`Switched to client: ${client.displayName}`, clientConfig);
      }
    }
  }, [clients, configurations]);

  const updateClientSettings = useCallback((clientId: string, settings: Partial<Client['settings']>) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, settings: { ...client.settings, ...settings } }
        : client
    ));
  }, []);

  const getClientConfiguration = useCallback((clientId: string): ClientConfiguration | null => {
    return configurations[clientId] || null;
  }, [configurations]);

  const saveClientConfiguration = useCallback((clientId: string, config: ClientConfiguration) => {
    setConfigurations(prev => ({
      ...prev,
      [clientId]: {
        ...config,
        lastUpdated: new Date().toISOString(),
        version: '1.0.1'
      }
    }));
    
    console.log(`Saved configuration for client: ${clientId}`, config);
  }, []);

  const contextValue: TenantContext = {
    currentClient,
    clients,
    configurations,
    switchClient,
    updateClientSettings,
    getClientConfiguration,
    saveClientConfiguration
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContext => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantContextProvider');
  }
  return context;
};

export default TenantContextProvider;
