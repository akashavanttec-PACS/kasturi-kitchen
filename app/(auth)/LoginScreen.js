import { useRouter } from "expo-router";
import {
  signInWithEmailAndPassword
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import LoadingScreen from "../../components/LoadingScreen";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../services/firebase";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {firebaseErrorMessages} from "../../constants/errorMessages"

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { user, isUserLoggedIn, isLoaded, storeLoaded } = useAuth();
  useEffect(() => {
    if (isUserLoggedIn) {
      router.replace('/(tabs)/HomeScreen');
    }
  }, [isUserLoggedIn]);

  if (!isLoaded || !storeLoaded) {
    return <LoadingScreen />; // fallback in case layout didn't catch it
  }

  // ✅ Email validation function
  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError("Email is required.");
    } else if (!emailRegex.test(text)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      if (user.emailVerified) {
        // The root layout will handle the redirect to home automatically
      } else {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email address to log in. Check your inbox for the verification link.",
          [
            //TO-DO:need to work on this later
            // {
            //   text: "Resend Email",
            //   onPress: async () => {
            //     try {
            //       await sendEmailVerification(user);
            //       Alert.alert(
            //         "Email Sent",
            //         "A new verification email has been sent to your address."
            //       );
            //     } catch (resendError) {
            //       setError(resendError.message);
            //     }
            //   },
            // },
            { text: "OK", style: "cancel" },
          ]
        );
        // It's good practice to sign the user out if their email is not verified
        await auth.signOut();
        setLoading(false)
      }
      setLoading(false)
    } catch (err) {
      const rawCode = err.code || err.message || "unknown";
      const friendlyMessage = firebaseErrorMessages[rawCode] || "Something went wrong. Please try again.";
      setError(friendlyMessage);
      setLoading(false)

    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 10,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../../assets/images/applogo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Login</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email*"
            value={email}
            onChangeText={(text) => {
              const filteredText = text.replace(/[^a-zA-Z0-9@._-]/g, "");
              setEmail(filteredText);
              setError(""); // clear global error when editing
              setEmailError("");
            }}
            onBlur={() => validateEmail(email)}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#888"
          />
          {emailError ? <Text style={styles.emailError}>{emailError}</Text> : null}
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password*"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#888"
          />
           <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconContainer}
          >
            <Icon
              name={showPassword ? 'eye' : 'eye-off'}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Logging in..." : "Login"}
            onPress={handleLogin}
            color={Colors.light.tint}
            disabled={loading}
          />
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/RegistrationScreen")}
        >
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  inputContainer: { width: "100%", alignItems: "center", marginBottom: 10 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#333",
  },
  input: {
    width: "90%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
    iconContainer: {
    position: 'absolute',
    right: "8%",   // position inside the input box, on the right
    top: "35%",
    transform: [{ translateY: -12 }], // center vertically (icon size 24, so 12 half)
    padding: 4,
  },
  error: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  emailError: {
    color: "red",
    width: "90%",
    marginBottom: 5,
    textAlign: "left !important",
  },
  buttonContainer: {
    width: "90%",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
    // backgroundColor: Colors.light.tint,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 5,
    // elevation: 3,
  },
  link: {
    marginTop: 15,
    color: Colors.light.tint,
    textDecorationLine: "underline",
    fontSize: 14,
  },
});

export default LoginScreen;
