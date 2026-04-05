import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface ParsedData {
  services_detected: string[];
  fields_detected: string[];
  mandatory_services: string[];
  optional_services: string[];
  confidence_score: number;
  processing_details: any;
  metadata: any;
}

interface SelectedAdapter {
  service: string;
  provider: string;
  version: string;
  endpoints: Record<string, string>;
  requiredFields: string[];
  optionalFields: string[];
  authentication: {
    type: string;
    header: string;
  };
  rateLimit: {
    requests: number;
    period: string;
  };
}

interface Schema {
  service: string;
  provider: string;
  version: string;
  requiredFields: string[];
  optionalFields: string[];
  endpoints: Record<string, string>;
}

interface FieldMapping {
  inputField: string;
  apiField: string;
  confidence: number;
}

interface GeneratedConfig {
  tenant_id: string;
  generated_at: string;
  integrations: any[];
}

interface FinalConfig {
  tenant_id: string;
  integrations: SelectedAdapter[];
  mappings: Record<string, FieldMapping>;
}

// State Interface
interface AppState {
  parsedData: ParsedData | null;
  selectedAdapters: SelectedAdapter[];
  schemas: Record<string, Schema>;
  mappings: Record<string, FieldMapping>;
  generatedConfig: GeneratedConfig | null;
  finalConfig: FinalConfig | null;
  currentStep: string;
  loading: boolean;
  error: string | null;
}

// Action Types
type AppAction =
  | { type: 'SET_PARSED_DATA'; payload: ParsedData }
  | { type: 'SET_SELECTED_ADAPTERS'; payload: SelectedAdapter[] }
  | { type: 'UPDATE_ADAPTER'; payload: { service: string; adapter: SelectedAdapter } }
  | { type: 'SET_SCHEMAS'; payload: Record<string, Schema> }
  | { type: 'SET_MAPPINGS'; payload: Record<string, FieldMapping> }
  | { type: 'UPDATE_MAPPING'; payload: { inputField: string; apiField: string; confidence: number } }
  | { type: 'REMOVE_MAPPING'; payload: string }
  | { type: 'SET_GENERATED_CONFIG'; payload: GeneratedConfig }
  | { type: 'SET_FINAL_CONFIG'; payload: FinalConfig }
  | { type: 'SET_CURRENT_STEP'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial State
const initialState: AppState = {
  parsedData: null,
  selectedAdapters: [],
  schemas: {},
  mappings: {},
  generatedConfig: null,
  finalConfig: null,
  currentStep: 'upload',
  loading: false,
  error: null,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_PARSED_DATA':
      return {
        ...state,
        parsedData: action.payload,
        error: null,
      };
    
    case 'SET_SELECTED_ADAPTERS':
      return {
        ...state,
        selectedAdapters: action.payload,
        error: null,
      };
    
    case 'UPDATE_ADAPTER':
      return {
        ...state,
        selectedAdapters: state.selectedAdapters.map(adapter =>
          adapter.service === action.payload.service ? action.payload.adapter : adapter
        ),
      };
    
    case 'SET_SCHEMAS':
      return {
        ...state,
        schemas: action.payload,
        error: null,
      };
    
    case 'SET_MAPPINGS':
      return {
        ...state,
        mappings: action.payload,
        error: null,
      };
    
    case 'UPDATE_MAPPING':
      return {
        ...state,
        mappings: {
          ...state.mappings,
          [action.payload.inputField]: {
            inputField: action.payload.inputField,
            apiField: action.payload.apiField,
            confidence: action.payload.confidence,
          },
        },
      };
    
    case 'REMOVE_MAPPING':
      const newMappings = { ...state.mappings };
      delete newMappings[action.payload];
      return {
        ...state,
        mappings: newMappings,
      };
    
    case 'SET_GENERATED_CONFIG':
      return {
        ...state,
        generatedConfig: action.payload,
        error: null,
      };
    
    case 'SET_FINAL_CONFIG':
      return {
        ...state,
        finalConfig: action.payload,
        error: null,
      };
    
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    setParsedData: (data: ParsedData) => void;
    setSelectedAdapters: (adapters: SelectedAdapter[]) => void;
    updateAdapter: (service: string, adapter: SelectedAdapter) => void;
    setSchemas: (schemas: Record<string, Schema>) => void;
    setMappings: (mappings: Record<string, FieldMapping>) => void;
    updateMapping: (inputField: string, apiField: string, confidence: number) => void;
    removeMapping: (inputField: string) => void;
    setGeneratedConfig: (config: GeneratedConfig) => void;
    setFinalConfig: (config: FinalConfig) => void;
    setCurrentStep: (step: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    resetState: () => void;
  };
} | undefined>(undefined);

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    setParsedData: (data: ParsedData) => dispatch({ type: 'SET_PARSED_DATA', payload: data }),
    setSelectedAdapters: (adapters: SelectedAdapter[]) => dispatch({ type: 'SET_SELECTED_ADAPTERS', payload: adapters }),
    updateAdapter: (service: string, adapter: SelectedAdapter) => dispatch({ type: 'UPDATE_ADAPTER', payload: { service, adapter } }),
    setSchemas: (schemas: Record<string, Schema>) => dispatch({ type: 'SET_SCHEMAS', payload: schemas }),
    setMappings: (mappings: Record<string, FieldMapping>) => dispatch({ type: 'SET_MAPPINGS', payload: mappings }),
    updateMapping: (inputField: string, apiField: string, confidence: number) => dispatch({ type: 'UPDATE_MAPPING', payload: { inputField, apiField, confidence } }),
    removeMapping: (inputField: string) => dispatch({ type: 'REMOVE_MAPPING', payload: inputField }),
    setGeneratedConfig: (config: GeneratedConfig) => dispatch({ type: 'SET_GENERATED_CONFIG', payload: config }),
    setFinalConfig: (config: FinalConfig) => dispatch({ type: 'SET_FINAL_CONFIG', payload: config }),
    setCurrentStep: (step: string) => dispatch({ type: 'SET_CURRENT_STEP', payload: step }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
