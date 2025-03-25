import {app, auth, db} from '../config/Firebase';
import {Button, Text, TextInput, View, PermissionsAndroid} from 'react-native';
import React, {useState, useEffect} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {doc, setDoc, getDoc, updateDoc} from 'firebase/firestore';
import messaging from '@react-native-firebase/messaging';
// import {
//   signOut,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword
// } from 'firebase/auth'
const VAPID_KEY = 'BN32MkLEaO-03UuYU4mL207juCP0Ts-M8CtNtJ3ztCVkWDLNfHcVxfpWf-HQrOCZ5rfesyGqGN7D_Z6eL8-nucU'


export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const requestNotificationPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
        const token = await messaging().getToken();
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();

        if (userData.fcmToken !== token){
          await updateDoc(userDocRef, {fcmToken: token});
          console.log('Token Updated');
        } else console.log('Token already up to date');
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.log('Error requesting notification permission:', error);
    }
  };
 

  const loginUser = async () => {

    try {
      await signInWithEmailAndPassword(auth, email, password);
      requestNotificationPermissions();
    } catch (error) {
      if (
        error.code === 'auth/invalid-email' ||
        error.code === 'auth/wrong-password'
      ) {
        setError('Invalid Email or Password');
      } else if (error.code === 'auth/user-not-found') {
        setError('User not found');
      } else {
        setError('There was a Problem with your Login Request');
      }
    }
  };

  return (
    <View>
      <View>
        <Text>Login</Text>
      </View>

      {error && <Text>{error}</Text>}

      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="Enter E-mail address"
        autocapitalize="none"
        placeholderTextColor="#aaa"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        placeholder="Enter Password"
        autocapitalize="none"
        placeholderTextColor="#aaa"
      />

      <Button
        title="Login"
        onPress={loginUser}
        disabled={!email || !password}
      />
    </View>
  );
};

export const Logout = () => {
  const logoutUser = async () => {
    try {
      await signOut(auth);
      console.log('User Logged out Successfully');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View>
      <Button title="Logout" onPress={logoutUser} />
    </View>
  );
};

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    const requestNotificationPermissions = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission granted');
          const token = await messaging().getToken();
          setFcmToken(token);
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.log('Error requesting notification permission:', error);
      }
    };

    requestNotificationPermissions();
  }, []);

  const signupUser = async () => {
    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredentials.user;

      const userDoc = await doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
        chats: [],
        userName: userName,
        favourites: [],
        bids: [],
        offers: [],
        notificationFlag: false,
        fcmToken: fcmToken,
        notifications: [],
        recentlySeen: [],
        recommendedLikes: [],
      };
      await setDoc(userDoc, userData);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid Email');
      } else {
        setError('There was a Problem with your Signup Request');
      }
    }
  };

  return (
    <View>
      <View>
        <Text>Sign up</Text>
      </View>

      {error && <Text>{error}</Text>}

      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="Enter E-mail address"
        autocapitalize="none"
        placeholderTextColor="#aaa"
      />

      <TextInput
        value={userName}
        onChangeText={setUserName}
        placeholder="Enter Username"
        autocapitalize="none"
        placeholderTextColor="#aaa"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        placeholder="Enter Password"
        autocapitalize="none"
        placeholderTextColor="#aaa"
      />

      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={true}
        placeholder="Confirm Password"
        autocapitalize="none"
        placeholderTextColor="#aaa"
      />

      <Button
        title="Create Account"
        onPress={signupUser}
        disabled={!email || !password || !confirmPassword}
      />
    </View>
  );
};

