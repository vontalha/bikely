import React, {useCallback, useEffect, useLayoutEffect} from 'react';
import {
  Alert,
  Modal,
  PermissionsAndroid,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  collection,
  arrayRemove,
  deleteDoc,
} from 'firebase/firestore';
import {app, auth, db} from '../config/Firebase';
import {Bubble, GiftedChat} from 'react-native-gifted-chat';
import {Login, Signup} from '../components/Authentication';
import CustomListItem from '../components/CustomListItem';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useActionSheet} from '@expo/react-native-action-sheet';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {getDownloadURL, getStorage, ref, uploadBytes} from '@firebase/storage';
import * as uuid from 'uuid';
import MapView, {Marker} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';



//hier muss ich noch user id als prop übergeben
export const Chat = ({route}) => {
  const {chatId} = route.params;
  const {offer} = route.params || null;

  //console.log('chatId: ' + chatId, 'offer: ' + offer);

  const [messages, setMessages] = React.useState([]);
  const [offerAccepted, setOfferAccepted] = React.useState('');
  const {showActionSheetWithOptions} = useActionSheet();

  //listen for changes in firestore db, useLayoutEffect is called once when component is mounted
  //and remains in memory until the component is unmounted
  //is used in order to display all messages in chat including new ones
  useLayoutEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'chats', chatId), snapshot => {
      const chat = snapshot.data();
      setMessages(
        chat.messages.map(doc => ({
          _id: doc._id,
          createdAt: doc.createdAt.toDate(),
          text: doc.text,
          image: doc.image,
          location: doc.location,
          user: doc.user,
          offer: doc.offer,
        })),
      );

      
      console.log('chat: ' + messages);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (offer !== null && offer !== undefined) {
      setOfferData(offer);
    }
  }, []);
  useEffect(() => {}, [offerAccepted]);
  //gets called after message is sent triggers a re-render
  //messages array of obj containing data such as _id, createdAt, text, user
  const onSend = useCallback(
    (messages = []) => {
      setMessages(previousMessages =>
        GiftedChat.append(messages, previousMessages),
      );
      //update messages array at document (on this specific chatId)
      console.log('onSend: ' + messages[0]);
      updateDoc(doc(db, 'chats', chatId), {
        messages: arrayUnion(messages[0]),
      });
    },
    [chatId],
  );

  const handleActionSheetPress = () => {
    const options = [
      'Take Photo',
      'Choose from Library',
      'Send Location',
      'Cancel',
    ];
    const icons = [
      <Icon name="camera" size={15} />,
      <Icon name="image" size={15} />,
      <Icon name="map-marker" size={15} />,
      <Icon name="times" size={15} />,
    ];
    const cancelButtonIndex = 3;
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        icons,
        cancelButtonTintColor: '#D70040',
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            launchCamera().then(res => {
              if (!res.didCancel && !res.errorCode) {
                uploadMediaToFirestore(res);
              }
            });
            break;

          case 1:
            launchImageLibrary().then(res => {
              if (!res.didCancel && !res.errorCode) {
                uploadMediaToFirestore(res);
              }
            });
            break;

          case 2:
            getLocation();
            break;

          case 3:
            break;
        }
      },
    );
  };

  const uploadMediaToFirestore = async res => {
    const uri = res.assets[0].uri;
    const filename = uri.substring(uri.lastIndexOf('/') + 1);

    const storage = getStorage(app);
    const fileRef = ref(storage, filename);
    const img = await fetch(uri);
    const bytes = await img.blob();
    let metadata = {contentType: 'image/jpeg'};

    uploadBytes(fileRef, bytes, metadata).then(async uploadTask => {
      const url = await getDownloadURL(uploadTask.ref);
      setImageData(url);
    });
  };

  const setImageData = async url => {
    const message = {
      _id: uuid.v4(),
      createdAt: new Date(),
      image: url,
      user: {
        _id: auth?.currentUser?.uid,
        name: auth?.currentUser?.displayName,
        avatar: auth?.currentUser?.photoURL,
      },
    };
    //update messages array at document (on this specific chatId)
    setMessages(previousMessages =>
      GiftedChat.append(message, previousMessages),
    );
    updateDoc(doc(db, 'chats', chatId), {
      messages: arrayUnion(message),
    })
    console.log('setImageData: ' + message);
  };

  const getLocation = async () => {
    const result = await requestLocationPermission();
    if (result) {
      Geolocation.getCurrentPosition(
        position => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocationData(location);
        },
        error => {
          Alert.alert('Error', JSON.stringify(error));
        },
      );
    }
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Bikely Location Permission',
          message: 'Bikely needs access to your location',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
    }
  };

  const setLocationData = async location => {
    const message = {
      _id: uuid.v4(),
      createdAt: new Date(),
      location: location,
      user: {
        _id: auth?.currentUser?.uid,
        name: auth?.currentUser?.displayName,
        avatar: auth?.currentUser?.photoURL,
      },
    };
    setMessages(previousMessages =>
      GiftedChat.append(message, previousMessages),
    );
    updateDoc(doc(db, 'chats', chatId), {
      messages: arrayUnion(message),
    });
    console.log('setLocationData: ' + message);
  };


  const setOfferData = async offer => {
    const message = {
      _id: uuid.v4(),
      createdAt: new Date(),
      offer: offer,
      user: {
        _id: auth?.currentUser?.uid,
        name: auth?.currentUser?.displayName,
        avatar: auth?.currentUser?.photoURL,
      },
    };
    setMessages(previousMessages =>
      GiftedChat.append(message, previousMessages),
    );
    updateDoc(doc(db, 'chats', chatId), {
      messages: arrayUnion(message),
    });
    console.log('setOfferData: ' + message);
  };
  
  // const LocationView = ({location}) => {
  //     const openmaps = () => {
  //         const url = `http://maps.google.com/?q=${location.latitude},${location.longitude}`
  //         //`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`

  //     Linking.canOpenURL(url).then((supported) => {
  //         if (supported) {
  //             Linking.openURL(url)
  //         } else {
  //             Alert.alert('Error', 'Opening the map failed')
  //         }
  //     }).catch((err) => console.warn(err))
  //     }
  //     return (
  //         <TouchableOpacity
  //             onPress={openmaps}
  //             style={{ backgroundColor: 'gray', width: 250, height: 250 }}>
  //             <MapView
  //                 style={{width: 250, height: 250}}
  //                 region={{
  //                     latitude: location.latitude,
  //                     longitude: location.longitude,
  //                     latitudeDelta: 0.0922,
  //                     longitudeDelta: 0.0421,
  //                 }}>
  //                 <Marker
  //                     coordinate={{
  //                         latitude: location.latitude,
  //                         longitude: location.longitude,
  //                     }}/>
  //             </MapView>
  //         </TouchableOpacity>
  //     )
  // }
  const handleOfferAccept = async (currentMessage, chatId) => {
    // if accept render last message in green, delete other offers from chat and delete lisitng
    currentMessage.offer.timestamp = Date.now();
    updateDoc(doc(db, 'users', auth.currentUser.uid), {
      offers: arrayUnion(currentMessage.offer),
    });

    const listingDocRef = doc(collection(db, 'listings'), currentMessage.offer.listingId);
    
    const chatDocRef = doc(collection(db, 'chats'), chatId);
    const chatDocSnapshot = await getDoc(chatDocRef);
  
    const chatData = chatDocSnapshot.data().messages;
    const deleteOfferMessage = chatData.filter((item) => {
        if(item.offer 
          && item.offer.offerId !== currentMessage.offer.offerId 
          && item.offer.listingId === currentMessage.offer.listingId){
          return item;
        }
      });
      
    deleteOfferMessage.forEach(async (item) => {
      await updateDoc(doc(collection(db, 'chats'), chatId), {
        messages: arrayRemove(item),
      });
    });


    //set message with in messages array with currentMessage.offer.offerId === offerId to accepted
    const acceptedOfferMessage = chatData.filter((item) => {
      if(item.offer
        && item.offer.offerId === currentMessage.offer.offerId
        && item.offer.listingId === currentMessage.offer.listingId){
        return item;
      }
    });
    await updateDoc(doc(collection(db, 'chats'), chatId), {
      messages: arrayRemove(acceptedOfferMessage[0]),
    });
    acceptedOfferMessage[0].offer.accepted = true;
    
    await updateDoc(doc(collection(db, 'chats'), chatId), {
      messages: arrayUnion(acceptedOfferMessage[0]),
    });

    await deleteDoc(listingDocRef);

    
    setOfferAccepted(currentMessage._id);
    Alert.alert('Congratulations you accepted an Offer! 🥳', 
    'In 3 days you will have the opportunity to \
    to rate the seller and tell us how your trade went', [
      {text: 'OK', onPress: () => console.log('OK Pressed')},
    ]);
  };

  const renderBubble = (props) => {
      const { currentMessage } = props
      //const listingOffer = await getDoc(doc(db, 'listings', currentMessage.offer.listingId));
      if (currentMessage.offer) {

        if(currentMessage._id === offerAccepted || currentMessage.offer.accepted ){

          return (
            <View style={styles.CardAccepted}>
              <View style={styles.CardTitle}>
                <Text style={{fontSize: 23, fontWeight: 'bold', color:'white'}}>Offer Accepted! 💰</Text>
              </View>
              <View style={styles.CardHeader}>
                <Text style={{fontWeight:'500', textAlign:'center', fontSize: 17, color:'white', marginLeft:20, marginTop: 16}}>
                {currentMessage.offer.listingTitle}</Text>
                <Text style={{fontWeight:'800', textAlign:'center', fontSize: 30, color:'white', marginLeft:50, marginTop: 10}}>
                {currentMessage.offer.bid} $</Text>
              </View>
            </View>
          );
        }

        if(currentMessage.offer.bidderId === auth.currentUser.uid && !currentMessage.offer.accepted){
          return (
            <View style={styles.Card}>
              <View style={styles.CardTitle}>
                <Text style={{fontSize: 23, fontWeight: 'bold', color:'white'}}>Offer Sent! 🎉</Text>
              </View>
              <View style={styles.CardHeader}>
                <Text style={{fontWeight:'500', textAlign:'center', fontSize: 17, color:'white', marginLeft:20, marginTop: 16}}>
                {currentMessage.offer.listingTitle}</Text>
                <Text style={{fontWeight:'800', textAlign:'center', fontSize: 30, color:'white', marginLeft:50, marginTop: 10}}>
                {currentMessage.offer.bid} $</Text>
              </View>
            </View>
          );
        }

        return (
          <View style={styles.Card}>
            <View style={styles.CardTitle}>
              <Text style={{fontSize: 23, fontWeight: 'bold', color:'white'}}>New Price Offer! 🎉</Text>
            </View>
            <View style={styles.CardHeader}>
              <Text style={{fontWeight:'500', textAlign:'center', fontSize: 17, color:'white', marginLeft:10, marginTop: 16}}>
              {currentMessage.offer.listingTitle}</Text>
              <Text style={{fontWeight:'800', textAlign:'center', fontSize: 30, color:'white', marginLeft:50, marginTop: 10}}>
              {currentMessage.offer.bid} $</Text>
            </View>
              <View style={styles.CardFooter}>
                <TouchableOpacity
                  style={styles.Acceptbutton}
                  onPress={() => {
                    handleOfferAccept(currentMessage, chatId);
                  }}>
                  <Text 
                    style={{fontWeight:'800', textAlign:'center', fontSize: 17, color:'white'}}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                style={styles.Declinebutton}
                  onPress={() => {
                    handleOfferDecline(currentMessage, chatId);
                  }}>
                  <Text 
                    style={{fontWeight:'800', textAlign:'center', fontSize: 17, color:'white'}}>Decline</Text>
                </TouchableOpacity>
              </View>
          </View>
        );
          // return (
          //   <OfferCard offer={currentMessage.offer} />              
          // )
      }
      return <Bubble {...props} />
  }
  return (
    <View style={{flex: 1}}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: auth?.currentUser?.uid,
          name: auth?.currentUser?.displayName,
          avatar: auth?.currentUser?.photoURL,
        }}
        inverted={false}
        //add camera icon to input toolbar
        renderActions={() => {
          return (
            <TouchableOpacity
              onPress={handleActionSheetPress}
              style={styles.cameraButton}>
              <Icon name="paperclip" size={25} />
            </TouchableOpacity>
          );
        }}
        renderCustomView={props => {
          const {currentMessage} = props;
          if (currentMessage.location) {
            return (
              <MapView
                style={{width: 150, height: 100, borderRadius: 13, margin: 3}}
                region={{
                  latitude: currentMessage.location.latitude,
                  longitude: currentMessage.location.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}>
                <Marker
                  coordinate={{
                    latitude: currentMessage.location.latitude,
                    longitude: currentMessage.location.longitude,
                  }}
                />
              </MapView>
            );
          } 
          // else if (currentMessage.offer) {
          //   return <OfferCard offer={currentMessage.offer} />;
          // }
        }}
        renderBubble={renderBubble}
      />
    </View>
  );
};

export const initiateChat = async (navigation, user1, user2) => {
  const chatId = user1 > user2 ? user1 + user2 : user2 + user1;
  const chatDocRef = doc(db, 'chats', chatId);
  const chatDocSnapshot = await getDoc(chatDocRef);
  const updatedUserChats = async user => {
    //add new chat to user chats array in case there is no chat yet
    const userDocRef = doc(db, 'users', user);
    await updateDoc(userDocRef, {
      chats: arrayUnion(chatId),
    });
  };
  if (!chatDocSnapshot.exists()) {
    await updatedUserChats(user1);
    await updatedUserChats(user2);
    await setDoc(chatDocRef, {messages: [], participants: [user1, user2]});
  }

  navigation.navigate('ChatUser', {chatId: chatId});
};

export const ChatList = ({navigation}) => {
  const [chatListItems, setChatListItems] = React.useState([]);

  useLayoutEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'users', auth.currentUser.uid),
      snapshot => {
        const chatsArray = snapshot.data().chats;
        setChatListItems(chatsArray);
      },
    );
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView>
      <ScrollView>
        <View></View>
        {chatListItems.map(chatId => {
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('ChatUser', {chatId: chatId})}
              key={chatId}>
              <CustomListItem chatId={chatId} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export const LoginPrompt = () => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [loginScreen, setLoginScreen] = React.useState(false);
  const [signupScreen, setSignupScreen] = React.useState(false);

  return (
    <View>
      <Text>Log in or Sign up to chat</Text>
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
        presentationStyle="overFullScreen">
        <Pressable onPress={() => setModalVisible(!modalVisible)}>
          <Text style={styles.Close}>x</Text>
        </Pressable>
        {loginScreen && <Login />}
        {signupScreen && <Signup />}
      </Modal>

      <Pressable
        style={styles.Button}
        onPress={() => {
          setLoginScreen(true), setModalVisible(true), setSignupScreen(false);
        }}>
        <Text>Login</Text>
      </Pressable>
      <Text>or</Text>
      <Pressable
        style={styles.Button}
        onPress={() => {
          setSignupScreen(true), setModalVisible(true), setLoginScreen(false);
        }}>
        <Text>Sign up</Text>
      </Pressable>
    </View>
  );
};

// export const handleOfferAccept = async (currentMessage, chatId) => {
//   // wenn accept dann rerender von last mesage diesesmal in gruen
//   currentMessage.offer.timestamp = Date.now();
//   updateDoc(doc(db, 'users', auth.currentUser.uid), {
//     offers: arrayUnion(currentMessage.offer),
//   });
//   setOfferAccepted(currentMessage._id);
// };

export const handleOfferDecline = async (currentMessage, chatId) => {
  // if offer declined, remove offer from listing offers and remove offer chat message
  const listingDocRef = doc(collection(db, 'listings'), currentMessage.offer.listingId);
  const chatDocRef = doc(collection(db, 'chats'), chatId);
  const chatDocSnapshot = await getDoc(chatDocRef);
  const chatData = chatDocSnapshot.data();
  const listingDocSnapshot = await getDoc(listingDocRef);
  const listingData = listingDocSnapshot.data();
  const updatedOffers = listingData.offer.currentOffers.filter(
    item => item.offerId !== currentMessage.offer.offerId,
  );
  const deleteMessage = chatData.messages.filter(
    item => item._id === currentMessage._id,
  );

  updateDoc(listingDocRef, {
    'offer.currentOffers': updatedOffers,
  });

  updateDoc(doc(collection(db, 'chats'), chatId), {
      messages: arrayRemove(deleteMessage[0]),
    });
}

const styles = StyleSheet.create({
  CardAccepted: {
    backgroundColor: '#1dd3b0',
    height: Dimensions.get("screen").height / 100 * 19,
    width: Dimensions.get("screen").width / 100 * 80,
    borderRadius: 20,
  },

  Card: {
    height: Dimensions.get("screen").height / 100 * 19,
    width: Dimensions.get("screen").width / 100 * 80,
    borderRadius: 20,
    backgroundColor: '#2C2E43',

  },  
  CardTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  CardHeader: {
    flexDirection: 'row',
  },
  CardFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    height: Dimensions.get("screen").height / 100 * 5,

  },
  Acceptbutton: {
    borderRadiusLeft: 20,
    backgroundColor: '#1dd3b0',
    width: (Dimensions.get("screen").width / 100 * 80)/2,
    height: '100%',
    borderBottomLeftRadius: 20,
    justifyContent: 'center',
  },
  Declinebutton: {
    borderRadiusRight: 20,
    backgroundColor: '#FF0060',
    width: (Dimensions.get("screen").width / 100 * 80)/2,
    height: '100%',
    borderBottomRightRadius: 20,
    justifyContent: 'center',
  },





  Button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    alignItems: 'center',
  },
  Close: {
    marginTop: 15,
    marginLeft: 15,
    fontSize: 30,
  },
  cameraButton: {
    padding: 10,
  },
});
