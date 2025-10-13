
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { auth } from '../app/services/firebase';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const AuthContext = createContext();

// export const useAuth = () => {
//   return useContext(AuthContext);
// };

// const SetIsUserLoggedIn = async (value) => {
//   try {
//     await AsyncStorage.setItem('isUSerLoggedIn', value);
//   } catch (e) {
//     // saving error
//     console.error('Error saving isUserLoggedIn to AsyncStorage', e);
//   }
// };

// const GetIsUserLoggedIn = async () => {
//   try {
//     const value = await AsyncStorage.getItem('isUSerLoggedIn'); 

//     return value;
//   } catch (e) {
//     // error reading value
//     console.error('Error reading isUserLoggedIn from AsyncStorage', e);
//     return null;
//   }
// }
// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   let isUserLoggedIn = GetIsUserLoggedIn();
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//       if(user){
//         SetIsUserLoggedIn(user.emailVerified);
//       }
//       setIsLoaded(true);
//     });

//     return unsubscribe;
//   }, []);

//   const logout = () => {
//     return signOut(auth);
//   };

//   const value = {
//     user,
//     isLoaded,
//     logout,
//     isUserLoggedIn
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { auth } from '../app/services/firebase';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const AuthContext = createContext();

// export const useAuth = () => {
//   return useContext(AuthContext);
// };

// // ✅ FIXED: Typo in key ('isUSerLoggedIn' → 'isUserLoggedIn')
// // ✅ ADDED: JSON.stringify to store booleans properly
// const SetIsUserLoggedIn = async (value) => {
//   try {
//     await AsyncStorage.setItem('isUserLoggedIn', JSON.stringify(value));
//   } catch (e) {
//     console.error('Error saving isUserLoggedIn to AsyncStorage', e);
//   }
// };

// // ✅ ADDED: JSON.parse to convert stored string back to boolean
// const GetIsUserLoggedIn = async () => {
//   try {
//     const value = await AsyncStorage.getItem('isUserLoggedIn');
//     return value !== null ? JSON.parse(value) : null;
//   } catch (e) {
//     console.error('Error reading isUserLoggedIn from AsyncStorage', e);
//     return null;
//   }
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isLoaded, setIsLoaded] = useState(false);

//   // ✅ NEW: Local state for isUserLoggedIn
//   const [isUserLoggedIn, setIsUserLoggedInState] = useState(null);

//   // ✅ NEW: Load login status from AsyncStorage on app load
//   useEffect(() => {
//     const loadLoginStatus = async () => {
//       const storedLoginStatus = await GetIsUserLoggedIn();
//       setIsUserLoggedInState(storedLoginStatus); // update state with stored value
//     };
//     loadLoginStatus();
//   }, []);

//   // ✅ UPDATED: onAuthStateChanged is now async to allow awaiting AsyncStorage write
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       setUser(user);

//       if (user) {
//         const verified = user.emailVerified;

//         // ✅ Store in memory
//         setIsUserLoggedInState(verified);

//         // ✅ Store in AsyncStorage (awaited to ensure it's written before isLoaded)
//         await SetIsUserLoggedIn(verified);
//       } else {
//         setIsUserLoggedInState(false);
//         await SetIsUserLoggedIn(false);
//       }

//       setIsLoaded(true);
//     });

//     return unsubscribe;
//   }, []);

//   const logout = () => {
//     console.log("Logging out user");
//     return signOut(auth);
//   };

//   const value = {
//     user,
//     isLoaded,
//     isUserLoggedIn, // ✅ Now holds the correct boolean value, not a Promise
//     logout,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../app/services/firebase';
import * as SecureStore from 'expo-secure-store';

// Create context
const AuthContext = createContext();

// Hook
export const useAuth = () => useContext(AuthContext);

// 🔐 SecureStore Keys
const STORAGE_KEYS = {
  USER: 'user',
  LOGGED_IN: 'isUserLoggedIn',
};

// 🔐 Store data
const save = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.error(`❌ Error saving ${key}:`, e);
  }
};

// 🔐 Get data
const getValue = async (key) => {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value;
  } catch (e) {
    console.error(`❌ Error getting ${key}:`, e);
    return null;
  }
};

// 🔐 Delete data
const remove = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.error(`❌ Error deleting ${key}:`, e);
  }
};

//
// 🔧 AuthProvider
//

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);               // Firebase user object
  const [isUserLoggedIn, setIsUserLoggedInState] = useState(null); // Boolean
  const [isLoaded, setIsLoaded] = useState(false);      // Initialization flag
  const [storeLoaded, setStoreLoaded] = useState(false) // Store loaded
  // 🔁 Load from SecureStore when app starts
  useEffect(() => {
    const loadInitialAuth = async () => {
      const storedUserStr = await getValue(STORAGE_KEYS.USER);
      const storedLoggedInStr = await getValue(STORAGE_KEYS.LOGGED_IN);
      console.log(storedLoggedInStr,storedUserStr, "Secure store" )

      if (storedUserStr) setUser(JSON.parse(storedUserStr));
      if (storedLoggedInStr) setIsUserLoggedInState(JSON.parse(storedLoggedInStr));
      setStoreLoaded(true)
    };

    loadInitialAuth();
  }, []);

  // 🔁 Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(auth, "auth.currentUser")
      if (firebaseUser) {
        const verified = firebaseUser.emailVerified;

        setUser(firebaseUser);
        setIsUserLoggedInState(verified);

        await save(STORAGE_KEYS.USER, JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: verified,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }));

        await save(STORAGE_KEYS.LOGGED_IN, JSON.stringify(verified));
      }
      setIsLoaded(true);
    });

    return unsubscribe;
  }, [auth.currentUser]);

  // 🔓 Logout
  const logout = async () => {
    console.log("🚪 Logging out...");
    setUser(null);
    setIsUserLoggedInState(false);
    await remove(STORAGE_KEYS.USER);
    await save(STORAGE_KEYS.LOGGED_IN, JSON.stringify(false));
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isUserLoggedIn,
        storeLoaded,
        isLoaded,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
