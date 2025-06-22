// Test Firebase connection
import { collection, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to access a collection (this will trigger the connection)
    const testCollection = collection(db, 'test');
    console.log('Firestore collection created successfully');
    
    // Try to read from it (this will make the actual network request)
    const querySnapshot = await getDocs(testCollection);
    console.log('Firestore connection successful! Documents found:', querySnapshot.size);
    
  } catch (error) {
    console.error('Firebase connection error:', error);
    
    if (error.code === 'permission-denied') {
      console.log('Permission denied - check Firestore security rules');
    } else if (error.code === 'unavailable') {
      console.log('Service unavailable - check network connection');
    } else if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.log('Request blocked by browser - disable ad blocker or try incognito mode');
    }
  }
}

// Run the test
testFirebaseConnection();
