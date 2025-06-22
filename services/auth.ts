import { auth, db } from '@/config/firebase';
import { User } from '@/types';
import {
    createUserWithEmailAndPassword,
    deleteUser,
    User as FirebaseUser,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';

class AuthService {
  // Sign up with email and password
  async signUp(email: string, password: string, username: string): Promise<User> {
    try {
      // Check if username is already taken
      const usernameExists = await this.checkUsernameExists(username);
      if (usernameExists) {
        throw new Error('Username is already taken');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update the user's display name
      await updateProfile(firebaseUser, { displayName: username });

      // Create user document in Firestore
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        username,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });

      return user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        username: userData.username,
        profilePicture: userData.profilePicture,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<Pick<User, 'username' | 'profilePicture'>>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // If username is being updated, check if it's available
      if (updates.username) {
        const usernameExists = await this.checkUsernameExists(updates.username, userId);
        if (usernameExists) {
          throw new Error('Username is already taken');
        }
      }

      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Update Firebase Auth profile if username changed
      if (updates.username && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: updates.username });
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // Delete user account
  async deleteAccount(userId: string): Promise<void> {
    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // Delete all user shows
      const userShowsQuery = query(
        collection(db, 'userShows'), 
        where('userId', '==', userId)
      );
      const userShowsSnapshot = await getDocs(userShowsQuery);
      
      const deletePromises = userShowsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete Firebase Auth user
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        username: userData.username,
        profilePicture: userData.profilePicture,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Check if username exists
  private async checkUsernameExists(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username)
      );
      const snapshot = await getDocs(usersQuery);
      
      if (excludeUserId) {
        // Check if the username belongs to someone else
        return snapshot.docs.some(doc => doc.id !== excludeUserId);
      }
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Check username error:', error);
      return false;
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const user = await this.getCurrentUser();
          callback(user);
        } catch (error) {
          console.error('Auth state change error:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
