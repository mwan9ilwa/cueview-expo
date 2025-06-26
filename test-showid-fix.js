// Test script to verify showId handling in notifications
// Run this with: node test-showid-fix.js

const mockUserShow1 = {
  id: "user123_show456",
  userId: "user123", 
  showId: "456", // String showId (from Firestore)
  status: "watching",
  showDetails: {
    name: "Test Show"
  }
};

const mockUserShow2 = {
  id: "user123_show789",
  userId: "user123",
  showId: 789, // Number showId 
  status: "watching",
  showDetails: {
    name: "Another Test Show"
  }
};

const mockUserShow3 = {
  id: "user123_showNaN",
  userId: "user123", 
  showId: "not-a-number", // Invalid showId
  status: "watching",
  showDetails: {
    name: "Broken Show"
  }
};

// Simulate the fixed generateMockUpcomingEpisodes logic
function generateMockUpcomingEpisodes(userShow) {
  console.log('Processing userShow:', userShow.showDetails?.name);
  console.log('userShow.showId type:', typeof userShow.showId, 'value:', userShow.showId);
  
  // Ensure showId is a valid number - handle both string and number cases
  let showId = userShow.showId;
  if (typeof showId === 'string') {
    showId = parseInt(showId, 10);
  }
  if (isNaN(showId) || !showId) {
    console.error('Invalid showId for userShow:', userShow.showDetails?.name);
    return [];
  }
  
  console.log('Processed showId:', showId, 'type:', typeof showId);
  
  const episodes = [];
  for (let i = 1; i <= 2; i++) {
    episodes.push({
      showId: showId,
      showName: userShow.showDetails?.name || 'Unknown Show',
      season: 1,
      episode: i,
      id: `${showId}-1-${i}`
    });
  }
  
  return episodes;
}

console.log('=== Testing showId Fix ===\n');

console.log('Test 1: String showId (from Firestore)');
const episodes1 = generateMockUpcomingEpisodes(mockUserShow1);
console.log('Result:', episodes1);

console.log('\nTest 2: Number showId');  
const episodes2 = generateMockUpcomingEpisodes(mockUserShow2);
console.log('Result:', episodes2);

console.log('\nTest 3: Invalid showId');
const episodes3 = generateMockUpcomingEpisodes(mockUserShow3); 
console.log('Result:', episodes3);

console.log('\n=== Test Complete ===');
