#!/usr/bin/env node

/**
 * Test script for expo-notifications
 * Run this with: node scripts/test-notifications.js
 * 
 * This script helps test push notifications in your development build
 */

const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

async function sendTestNotification(expoPushToken) {
  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
    return;
  }

  // Construct a message
  let message = {
    to: expoPushToken,
    sound: 'default',
    body: 'This is a test notification from your CueView app!',
    title: 'CueView Test',
    data: { withSome: 'data' },
  };

  try {
    let ticketChunk = await expo.sendPushNotificationsAsync([message]);
    console.log('Notification sent successfully:', ticketChunk);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Example usage
const testToken = process.argv[2];
if (testToken) {
  sendTestNotification(testToken);
} else {
  console.log('Usage: node scripts/test-notifications.js <expo-push-token>');
  console.log('Get your expo push token from your app by running this in your app:');
  console.log('import * as Notifications from "expo-notifications";');
  console.log('const token = await Notifications.getExpoPushTokenAsync();');
  console.log('console.log(token.data);');
}
