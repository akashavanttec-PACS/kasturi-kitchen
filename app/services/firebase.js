
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpl52fADjWCyMHbbAlR6hhGGnIlSMwmwI",
    authDomain: "kasturi-kitchen.firebaseapp.com",
    projectId: "kasturi-kitchen",
    storageBucket: "kasturi-kitchen.firebasestorage.app",
    messagingSenderId: "627889881489",
    appId: "1:627889881489:web:805405b998e44ffba8da30",
    measurementId: "G-HVQRP6XPHP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});


// Conditionally initialize Analytics
isSupported().then((supported) => {
    if (supported) {
        const analytics = getAnalytics(app);
    }
});

export { auth, db };
