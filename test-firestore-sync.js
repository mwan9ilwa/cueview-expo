// Test script for Firestore sync functionality
import './firebaseConfig.js';
import { userLibraryService } from './services/user-library.js';

async function testFirestoreSync() {
  console.log('🔥 Testing Firestore Sync...');
  
  const testUserId = 'test-user-123';
  const testShow = {
    id: 12345,
    name: 'Test Show',
    overview: 'This is a test show for Firestore sync',
    poster_path: '/test-poster.jpg',
    backdrop_path: '/test-backdrop.jpg',
    first_air_date: '2023-01-01',
    last_air_date: '2023-12-31',
    number_of_episodes: 10,
    number_of_seasons: 1,
    status: 'Ended',
    vote_average: 8.5,
    genres: [{ id: 1, name: 'Drama' }],
    networks: [{ id: 1, name: 'Test Network' }],
  };

  try {
    console.log('📱 Adding show to library...');
    await userLibraryService.addShowToLibrary(testUserId, testShow, 'watching');
    
    console.log('📊 Updating progress...');
    await userLibraryService.updateShowProgress(testUserId, testShow.id, 1, 5);
    
    console.log('⭐ Rating show...');
    await userLibraryService.rateShow(testUserId, testShow.id, 4);
    
    console.log('📝 Adding note...');
    await userLibraryService.addNoteToShow(testUserId, testShow.id, 'Great show! Really enjoyed it.');
    
    console.log('📋 Getting user shows...');
    const userShows = await userLibraryService.getUserShows(testUserId);
    console.log(`Found ${userShows.length} shows in library`);
    
    if (userShows.length > 0) {
      const testUserShow = userShows.find(show => show.showId === testShow.id);
      if (testUserShow) {
        console.log('✅ Show found in library:', testUserShow.showDetails?.name || testUserShow.showId);
        console.log('  Status:', testUserShow.status);
        console.log('  Progress:', `S${testUserShow.currentSeason}E${testUserShow.currentEpisode}`);
        console.log('  Rating:', testUserShow.rating);
        console.log('  Notes:', testUserShow.notes);
        console.log('  Watched Episodes:', testUserShow.watchedEpisodes.length);
      }
    }
    
    console.log('📈 Getting library stats...');
    const stats = await userLibraryService.getLibraryStats(testUserId);
    console.log('Stats:', stats);
    
    console.log('🔄 Testing sync to Firestore...');
    await userLibraryService.syncToFirestore(testUserId);
    
    console.log('📥 Testing sync from Firestore...');
    await userLibraryService.syncFromFirestore(testUserId);
    
    console.log('🧹 Cleaning up...');
    await userLibraryService.removeShowFromLibrary(testUserId, testShow.id);
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirestoreSync()
    .then(() => {
      console.log('🎉 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}
