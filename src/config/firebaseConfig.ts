// Firebase web app configuration values.
// Replace these with your own project values if needed.
export const firebaseConfig = {
  apiKey: 'AIzaSyD5Z6hyTqctMlWALxjBTAiBuSr-dW-ildo',
  authDomain: 'masong-bd5c2.firebaseapp.com',
  projectId: 'masong-bd5c2',
  storageBucket: 'masong-bd5c2.firebasestorage.app',
  messagingSenderId: '164651092111',
  appId: '1:164651092111:web:2deec1e08711f6c40c48fa',
  measurementId: 'G-R7KK4C62GY',
  googleWebClientId: '164651092111-gcruc8ne3tpqmcso911id2aneqgou9mi.apps.googleusercontent.com',
  googleAndroidClientId: '164651092111-a04gcijuflepa6dp592qfdk9q480ira5.apps.googleusercontent.com',
  googleIosClientId: '',
};

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;

export const isFirebaseConfigured = requiredConfigKeys.every(
  (key) => Boolean(firebaseConfig[key]) && !String(firebaseConfig[key]).includes('YOUR_')
);