// Test script to verify notes handling
const { dbService } = require('./services/database');

async function testNotesHandling() {
  console.log('Testing notes handling...');
  
  try {
    // Initialize database
    await dbService.init();
    
    // Create a test user show with no notes
    const testUserShow = {
      id: 'test_user_123',
      userId: 'test_user',
      showId: 123,
      status: 'watching',
      rating: undefined,
      notes: undefined,
      currentSeason: undefined,
      currentEpisode: undefined,
      watchedEpisodes: [],
      addedAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Original UserShow:', testUserShow);
    
    // Save to database
    await dbService.saveUserShow(testUserShow);
    console.log('Saved to database');
    
    // Read back from database
    const userShows = await dbService.getUserShows('test_user');
    const retrievedShow = userShows[0];
    
    console.log('Retrieved UserShow:', retrievedShow);
    console.log('Notes value:', retrievedShow?.notes);
    console.log('Notes type:', typeof retrievedShow?.notes);
    console.log('Rating value:', retrievedShow?.rating);
    console.log('Rating type:', typeof retrievedShow?.rating);
    
    // Clean up
    await dbService.deleteUserShow('test_user_123');
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testNotesHandling();
