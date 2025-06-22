import { authService } from '@/services/auth';
import { dbService } from '@/services/database';
import { AppState, User, UserShow } from '@/types';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_USER_SHOWS'; payload: UserShow[] }
  | { type: 'ADD_USER_SHOW'; payload: UserShow }
  | { type: 'UPDATE_USER_SHOW'; payload: UserShow }
  | { type: 'REMOVE_USER_SHOW'; payload: string }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  userShows: [],
  cachedShows: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload,
        isAuthenticated: action.payload !== null,
      };
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    
    case 'SET_USER_SHOWS':
      return { ...state, userShows: action.payload };
    
    case 'ADD_USER_SHOW':
      return { 
        ...state, 
        userShows: [...state.userShows, action.payload] 
      };
    
    case 'UPDATE_USER_SHOW':
      return {
        ...state,
        userShows: state.userShows.map(show =>
          show.id === action.payload.id ? action.payload : show
        ),
      };
    
    case 'REMOVE_USER_SHOW':
      return {
        ...state,
        userShows: state.userShows.filter(show => show.id !== action.payload),
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  // User show actions
  addUserShow: (userShow: UserShow) => Promise<void>;
  updateUserShow: (userShow: UserShow) => Promise<void>;
  removeUserShow: (userShowId: string) => Promise<void>;
  loadUserShows: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await dbService.init();
        
        // Check for current user
        const currentUser = await authService.getCurrentUser();
        dispatch({ type: 'SET_USER', payload: currentUser });
        
        if (currentUser) {
          const userShows = await dbService.getUserShows(currentUser.id);
          dispatch({ type: 'SET_USER_SHOWS', payload: userShows });
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      dispatch({ type: 'SET_USER', payload: user });
      
      if (user) {
        try {
          const userShows = await dbService.getUserShows(user.id);
          dispatch({ type: 'SET_USER_SHOWS', payload: userShows });
        } catch (error) {
          console.error('Failed to load user shows:', error);
        }
      } else {
        dispatch({ type: 'SET_USER_SHOWS', payload: [] });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return unsubscribe;
  }, []);

  // Auth actions
  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authService.signIn(email, password);
      dispatch({ type: 'SET_USER', payload: user });
      const userShows = await dbService.getUserShows(user.id);
      dispatch({ type: 'SET_USER_SHOWS', payload: userShows });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authService.signUp(email, password, username);
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  // User show actions
  const addUserShow = async (userShow: UserShow) => {
    try {
      await dbService.saveUserShow(userShow);
      dispatch({ type: 'ADD_USER_SHOW', payload: userShow });
    } catch (error) {
      console.error('Failed to add user show:', error);
      throw error;
    }
  };

  const updateUserShow = async (userShow: UserShow) => {
    try {
      await dbService.saveUserShow(userShow);
      dispatch({ type: 'UPDATE_USER_SHOW', payload: userShow });
    } catch (error) {
      console.error('Failed to update user show:', error);
      throw error;
    }
  };

  const removeUserShow = async (userShowId: string) => {
    try {
      await dbService.deleteUserShow(userShowId);
      dispatch({ type: 'REMOVE_USER_SHOW', payload: userShowId });
    } catch (error) {
      console.error('Failed to remove user show:', error);
      throw error;
    }
  };

  const loadUserShows = async () => {
    try {
      if (!state.user) return;
      
      const userShows = await dbService.getUserShows(state.user.id);
      dispatch({ type: 'SET_USER_SHOWS', payload: userShows });
    } catch (error) {
      console.error('Failed to load user shows:', error);
    }
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    signIn,
    signUp,
    signOut,
    resetPassword,
    addUserShow,
    updateUserShow,
    removeUserShow,
    loadUserShows,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the app context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
