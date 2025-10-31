import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LoadingScreen from "../../components/LoadingScreen";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { db } from "../services/firebase";
import { Timestamp } from 'firebase/firestore';

import { formatTimeTo12Hour, getCurrentISTTime, getISTDateString } from "../../utils/utils";

// --- Development Flag ---
const IS_DEVELOPMENT_MODE = false;

// --- Time Restriction Logic ---
// const isBookingTimeActive = () => {
//   if (IS_DEVELOPMENT_MODE) {
//     return true; // Always allow booking in development mode
//   }

//   const now = new Date();
//   const currentMinutes = now.getHours() * 60 + now.getMinutes();

//   const startMinutes = 0;         // 12:00 AM
//   const endMinutes = 7 * 60 + 30; // 7:30 AM
//   // Booking active if time is between 12:00 AM and 7:30 AM
//   return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
// };

const isBookingTimeActive = () => {
  if (IS_DEVELOPMENT_MODE) {
    return true; // Always allow booking in development mode
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startMinutes = 0; // 12:00 AM
  const endMinutes = 7 * 60 + 30; // 7:30 AM
//  const endMinutes = 16 * 60 + 30; // 16 hours = 4 PM, +30 mins
 console.log("startMinutes", startMinutes, "endMinutes", endMinutes);
 // Booking active if time is between 12:00 AM and 7:30 AM
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isBookingEnabled, setIsBookingEnabled] = useState(
    isBookingTimeActive()
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [BookMealLoading, setBookMealLoading] = useState(false);
  const [bookedAlready, setBookedAlready] = useState(false)
  const [bookingMessage, setBookingMessage] = useState("")
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBookingEnabled(isBookingTimeActive());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  async function checkIsAdmin(uid) {
    if (!uid) return false; // Not logged in
    const adminDoc = await getDoc(doc(db, "admins", uid));
    return adminDoc.exists(); // true if admin, else false
  }



  const checkIfMealBookedAlready = async (userData) => {
    const today = new Date();
    const todayDateString = getISTDateString();

    const bookingsRef = collection(db, "mealBookings");
    const q = query(
      bookingsRef,
      where("employeeCode", "==", userData.employeeCode),
      where("mealDate", "==", todayDateString)
    );
    console.log("Im checking the DB", userData.employeeCode, todayDateString)
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const { mealDate, mealTime } = docData;

        const formattedTime = formatTimeTo12Hour(mealTime); // e.g. "6:57 AM"
        const [year, month, day] = mealDate.split("-");
        const formattedDate = `${day}-${month}-${year}`;
        
        const message = `Your meal was booked on ${formattedDate} at ${formattedTime}`;
        setBookedAlready(true);
        setBookingMessage(message);
      }
    } catch (error) {
      console.log("Unable to get details", error)
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const q = query(
            collection(db, "employees"),
            where("uid", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          const userIsAdmin = await checkIsAdmin(user.uid);
          setIsAdmin(userIsAdmin);
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setUserData(doc.data());
            checkIfMealBookedAlready(doc.data())
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Could not fetch user data.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const handleBookMeal = async () => {
    if (!isBookingEnabled) {
      Alert.alert(
        "Booking Closed",
        "Meal booking is only available between 12:00 AM - 7:30 AM."
      );
      return;
    }
    if (!userData) {
      Alert.alert("Error", "User data not loaded yet.");
      return;
    }
    if (!isBookingTimeActive()) {
      Alert.alert(
        "Booking Closed",
        "Meal booking is only available between 12:00 AM and 7:30 AM."
      );
      return;
    }

    const today = new Date();
    const todayDateString = getISTDateString();

    const bookingsRef = collection(db, "mealBookings");
    const q = query(
      bookingsRef,
      where("employeeCode", "==", userData.employeeCode),
      where("mealDate", "==", todayDateString)
    );

    try {
      setBookMealLoading(true);
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        Alert.alert(
          "Already Booked",
          "You have already booked a meal for today."
        );
      } else {
        const newBooking = {
          companyCode: userData.companyCode,
          employeeCode: userData.employeeCode,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          mealDate: todayDateString,
          mealTime: getCurrentISTTime(),
          orderDate: new Date()
        };
        console.log(newBooking, "new booking")
        await addDoc(bookingsRef, newBooking);
        Alert.alert("Success", "Your meal has been booked successfully.");
        checkIfMealBookedAlready(userData)
      }
    } catch (error) {
      console.error("Error booking meal:", error);
      Alert.alert("Sorry!", "We’re unable to book your meal at the moment. Please try again later.");
    } finally {
      setBookMealLoading(false); // ✅ Always stop loading
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Avanttec</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <View style={styles.content}>
          {userData ? (
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Hello, {userData.firstName}!</Text>
              <Text>Company Code: {userData.companyCode}</Text>
              <Text>Employee Code: {userData.employeeCode}</Text>
              <Text style={styles.bookingTiming}>
                Booking Timing: 12:00 AM - 7:30 AM
              </Text>

              {bookedAlready ? <Text style={styles.bookedAlready}>{bookingMessage}</Text> : ""}
            </View>
          ) : (
            <Text>Loading user data...</Text>
          )}
          <TouchableOpacity
            style={[
              styles.bookMealButton,
              (!isBookingEnabled || BookMealLoading) && styles.disabledButton,
            ]}
            onPress={handleBookMeal}
            disabled={!isBookingEnabled || BookMealLoading}
          >
            {BookMealLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={styles.bookMealButtonText}>Book a Meal</Text>
            )}
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity onPress={() => router.push("/AdminPanel")}>
              <Text style={styles.adminLink}>Access Admin Panel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: Colors.light.tint,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  logoutButton: {
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 3,
  },
  bookingTiming: {
    marginTop: 10,
    fontSize: 16,
    color: "#444",
    fontWeight: "500",
  },
  logoutButtonText: {
    color: Colors.light.tint,
    fontWeight: "bold",
    fontSize: 14,
  },
  bookedAlready: {
    color: "green",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  userDetails: {
    alignItems: "center",
    marginBottom: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bookMealButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#a9a9a9", // A darker grey for disabled state
  },
  bookMealButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  adminLink: {
    color: Colors.light.tint,
    textDecorationLine: "underline",
    marginTop: 20,
  },
});

export default HomeScreen;
