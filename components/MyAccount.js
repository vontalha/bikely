import React, {useEffect, useState} from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {getUserData} from './UserAPI';
import {doc, getFirestore, onSnapshot, updateDoc} from 'firebase/firestore';
import {auth, db} from '../config/Firebase';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import {launchImageLibrary} from 'react-native-image-picker';

const MyAccountPage = () => {
  const [user, setUser] = useState(null);
  const UserEmailEntry = auth.currentUser.email;
  const uid_ = auth.currentUser.uid;
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  const uploadMediaToFirestore = async (res, type) => {
    const uri = res.assets[0].uri;
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    const storage = getStorage();
    const fileRef = ref(storage, filename);
    const img = await fetch(uploadUri);
    const bytes = await img.blob();
    let metadata;

    if (type === 'video') {
      metadata = {
        contentType: 'video/mp4',
      };
    } else {
      metadata = {
        contentType: 'image/jpeg',
      };
    }

    const uploadTask = uploadBytesResumable(fileRef, bytes, metadata);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        snapshot => {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        () => {
          // Handle unsuccessful uploads
          reject();
        },
        () => {
          // Handle successful uploads on complete
          // For instance, get the download URL: https://firebasestorage.googleapis.com/...
          getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
            console.log('File available at', downloadURL);
            setProfilePictureUrl(downloadURL);

            const firestore = getFirestore();
            const userId = auth.currentUser.uid;

            const userRef = doc(firestore, 'Profile', userId);

            updateDoc(userRef, {
              ImageUrl: downloadURL,
            })
              .then(() => {
                console.log('Image URL stored in Firestore');
                resolve(downloadURL);
              })
              .catch(error => {
                console.log('Error storing image URL in Firestore:', error);
                reject(error);
              });
          });
        },
      );
    });
  };

  const selectPicture = async () => {
    const options = {mediaType: 'photo'};

    try {
      const result = await launchImageLibrary(options);
      if (!result.didCancel) {
        const imageUrl = await uploadMediaToFirestore(result, 'image');
        setProfilePictureUrl(imageUrl);
      }
    } catch (error) {
      console.log('ImagePicker Error:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserData(uid_);
        setUser(userData);
        console.log('userData: ', userData);
      } catch (error) {
        console.error('Error retrieving user data:', error);
        setUser(null);
      }
    };

    const unsubscribe = onSnapshot(doc(db, 'Profile', uid_), doc => {
      if (doc.exists()) {
        fetchUserData();
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(UserEmailEntry);
  const [mobileNumber, setMobileNumber] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setLastName(user.lastName || '');
      setEmail(user.email || UserEmailEntry);
      setMobileNumber(user.mobileNumber || '');
    }
  }, [user]);

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    setIsEditing(false);
    try {
      // Update the user document in Firestore
      await updateDoc(doc(db, 'Profile', uid_), {
        username: username,
        lastName: lastName,
        email: email,
        mobileNumber: mobileNumber,
      });

      // Update the user object in state
      setUser({
        ...user,
        username: username,
        lastName: lastName,
        email: email,
        mobileNumber: mobileNumber,
      });

      console.log('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Account</Text>

      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={() => console.log('Change profile picture')}>
          {profilePictureUrl ? (
            <Image
              style={styles.profilePicture}
              source={{uri: profilePictureUrl}}
            />
          ) : (
            <Image
              style={styles.profilePicture}
              source={require('../assets/userProfile.png')}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={selectPicture}>
          <Text style={styles.changePictureText}>Change Picture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Personal Details</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={text => setUsername(text)}
              placeholder={user.username}
              placeholderTextColor="#777"
            />
          ) : (
            <View>
              <Text style={styles.inputText}>
                {user?.username || 'Dummy username'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={text => setLastName(text)}
              placeholder="last name"
              placeholderTextColor="#777"
            />
          ) : (
            <View>
              <Text style={styles.inputText}>
                {lastName || 'Enter your last name'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={text => setEmail(text)}
              placeholder={UserEmailEntry}
              placeholderTextColor="#777"
            />
          ) : (
            <View>
              <Text style={styles.inputText}>
                {email || 'dummyemail@example.com'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={mobileNumber}
              onChangeText={text => setMobileNumber(text)}
              placeholder="123-456-7890"
              placeholderTextColor="#777"
            />
          ) : (
            <View>
              <Text style={styles.inputText}>
                {mobileNumber || 'Enter your mobile number'}
              </Text>
            </View>
          )}
        </View>

        {isEditing ? (
          <TouchableOpacity
            onPress={handleSaveChanges}
            style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#778899',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  changePictureText: {
    fontSize: 16,
    color: 'blue',
  },
  detailsContainer: {
    backgroundColor: '#DCDCDC',
    padding: 20,
    borderRadius: 10,
  },
  detailsTitle: {
    color: '#778899',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#778899',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    color: 'black',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
  },
  inputText: {
    fontSize: 16,
    color: 'black',
  },
  saveButton: {
    backgroundColor: '#778899',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#778899',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyAccountPage;
