import { auth, db } from '@/config/firebase';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

// User type matching our app needs
interface SimpleUser {
  email: string;
  username: string;
  id: string;
  createdAt?: Date;
}

interface AuthContextType {
  user: SimpleUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Extracted auth state update logic
  const updateAuthState = async (firebaseUser: any) => {
    console.log('🔥 Updating auth state for:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
    
    if (firebaseUser) {
      console.log('📧 Firebase user detected:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
      
      // User is signed in, get additional user data from Firestore
      try {
        console.log('📚 Fetching user data from Firestore...');
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          console.log('✅ Firestore user data found');
          const userData = userDoc.data();
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            username: userData.username || firebaseUser.displayName || 'User',
            createdAt: userData.createdAt?.toDate(),
          };
          console.log('👤 Setting user data:', user);
          setUser(user);
          setIsAuthenticated(true);
          console.log('🔓 Authentication complete with Firestore data');
        } else {
          console.log('⚠️ No Firestore document found, using fallback');
          // Fallback if no Firestore document
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            username: firebaseUser.displayName || 'User',
          };
          console.log('👤 Setting fallback user data:', user);
          setUser(user);
          setIsAuthenticated(true);
          console.log('🔓 Authentication complete with fallback data');
        }
      } catch (error: any) {
        console.error('❌ Error fetching user data:', error);
        
        // Check for specific Firebase errors
        if (error?.code === 'firestore/permission-denied') {
          console.error('🚫 Firestore permission denied - check security rules');
        } else if (error?.code === 'firestore/unavailable') {
          console.error('🌐 Firestore unavailable - check network connection');
        } else if (error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
          console.error('🚨 Request blocked by browser - disable ad blocker or try incognito mode');
        }
        
        // Always set user with basic Firebase info to prevent blocking
        const user = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          username: firebaseUser.displayName || 'User',
        };
        console.log('👤 Setting user data despite Firestore error:', user);
        setUser(user);
        setIsAuthenticated(true);
        console.log('🔓 Authentication complete despite Firestore error');
      }
    } else {
      console.log('🔒 No user, setting authenticated to false');
      // User is signed out
      setUser(null);
      setIsAuthenticated(false);
    }
    console.log('⏳ Setting loading to false');
    setIsLoading(false);
  };

  useEffect(() => {
    console.log('🔧 Setting up Firebase auth state listener...');
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      updateAuthState(firebaseUser);
    });
    
    return () => {
      console.log('🔧 Cleaning up Firebase auth state listener');
      unsubscribe();
    };
  }, []);

  // Real authentication functions
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting sign in for:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign in successful:', result.user.uid);
      
      // Manually trigger auth state update since onAuthStateChanged might not fire immediately
      console.log('🔄 Manually updating auth state...');
      await updateAuthState(result.user);
      
    } catch (error: any) {
      console.error('❌ Sign in failed:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update the user's display name
      await updateProfile(firebaseUser, { displayName: username });

      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        username,
        email: firebaseUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // User state will be updated by the onAuthStateChanged listener
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
