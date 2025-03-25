import { Modal, Image, ScrollView, View, Dimensions, Pressable,StyleSheet} from 'react-native';
import {
  Card,
  Icon,
  StyleService,
  Text,
  useStyleSheet,
} from '@ui-kitten/components';
import React, { useLayoutEffect } from 'react';
import { arrayRemove, arrayUnion, collection, doc, getDoc, increment, onSnapshot, updateDoc } from 'firebase/firestore';
import {db, auth} from '../config/Firebase';
import {Login, Signup} from './Authentication';
import {getDistance} from 'geolib';
import Geolocation from '@react-native-community/geolocation';

const statusConditionMapping = {
  'New': 'success',
  'Used': 'warning',
  'Damaged': 'danger',
}

export default function BikeCardMedium({listing,locationData, navigation}) {
  const [isLiked, setIsLiked] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);

  const listingData = {
    _id: listing._id,
    title: listing.advertTitle,
    images: listing.images,
    userId: listing.userID,
    location: {
      latitude: listing.pos.coords.latitude,
      longitude: listing.pos.coords.longitude,
    },
    condition: listing.bike.bikeCondition,
    price: listing.price,
    views: listing.views.length,
    likes: listing.likes,
    brand: listing.bike.bikeBrand,
    model: listing.bike.bikeModel,
    gears: listing.bike.bikeNumberOfGears,
    description: listing.description,
    type: listing.bike.bikeType,
  }

  const conditionColor = statusConditionMapping[listingData.condition];

  if(auth.currentUser !== null){
    useLayoutEffect(() => {

        const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), async snapshot => {
            const userData = snapshot.data();
            
            if(userData.favourites.includes(listing._id)){
                setIsLiked(true);
            }
            else{
                setIsLiked(false);
            }
        });
    
        return () => unsubscribe();
    
    }, []);
  }

  const handleLikepress = async () => {
    if(isLiked){
        setIsLiked(false);
        updateDoc(doc(db, 'users', auth.currentUser.uid), {
            favourites: arrayRemove(listing._id)
        },
        updateDoc(doc(db, 'listings', listing._id), {
            likes: increment(-1)
        })
        
        );
    } else{
        setIsLiked(true);
        updateDoc(doc(db, 'users', auth.currentUser.uid), {
            favourites: arrayUnion(listing._id)
        },
        updateDoc(doc(db, 'listings', listing._id), {
            likes: increment(1)
        })
        );
    }

  };
  
  const increaseViews = async () => {
    updateDoc(doc(db, 'listings', listing._id), {
        views: arrayUnion(auth.currentUser.uid)
    });
  };

  return (
    <>
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
                <Login />
                <Signup />
        </Modal>
      <Card
        onPress={() => {
          navigation.navigate('Listing', {listing: listingData}),increaseViews();
      }}
        style={[
          styles.card
      ]} 
        status={conditionColor}>
        <View style={styles.topContainer}>
          <View style={styles.heart}>
            <Text style={styles.heartCounter}>{listingData.likes}</Text>
              <Pressable onPress={auth.currentUser? handleLikepress: ()=>setModalVisible(true)}>
                  <Icon
                      name={isLiked? 'heart' : 'heart-outline'}
                      style={[styles.heart, { width: 30, height: 30 }]}
                      fill={isLiked? '#fb6376': '#EEEEEE'}
                  />
              </Pressable>
          </View>
          <View style={styles.eye}>
          <Text style={styles.eyeCounter}>{listingData.views}</Text>
          <Icon
              name={'eye'}
              style={[styles.eye, { width: 30, height: 30 }]}
              fill={'white'}
          />
          </View>
          <Image
            key={listing._id}
            source={{uri: (listing.images)[0]}}
            style={styles.image}
            resizeMode={'cover'}
          />
        </View>
        <View style={styles.footerContainer}>
            <View style={styles.titleContainer}>
                <Text style={{fontWeight:'900', color:'#F0F0F0'}} numberOfLines={2} ellipsizeMode='tail'>{listingData.title}</Text>
            </View>
            <View style={styles.attributes}>
                <View style={styles.priceContainer}>
                    <Text category='label'>{listingData.price + " $"}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text category='label'>{"Brand: " + listingData.brand}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text category='label'>{"Model: " + listingData.model}</Text>
                </View>
            </View>
        
        </View>
        
      </Card>
    </>
  );
}

const styles = StyleService.create({
  /*
  viewCounter: {
    flexDirection: 'row',
    marginRight: 20,
  },
  container: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'center',
  },
  card: {
    width: '90%',
    alignSelf: 'center',
    margin: 10,
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  image: {
    marginHorizontal: 4,
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  
  infoContainer: {
    marginVertical: 10,
    padding: 6,
    borderRadius: 4,
    borderColor: 'rgba(220,220,220,0.5)',
    borderWidth: 1,
    flex: 1,
  },
  bikeContainer: {
    flexDirection: 'row',
  },
  */
  imageContainer: {
    marginVertical: 10,
    marginRight: 10,
    flexDirection: 'row',
    flex: 1,
  },
    topContainer: {
        position: 'relative',
        flexDirection: 'row',
        height: 120,
        flex: 1,        
    },
    eye: {
      position: 'absolute',
      top: 40,
      right: 16,
      zIndex: 1,
      marginHorizontal: -24,
      marginVertical: -16,
    }, 
    eyeCounter: {
      position: 'absolute',
      top: 62,
      right: 27,
      zIndex: 1,
      marginHorizontal: -24,
      marginVertical: -16,
      color: 'white'
    },
    heart: {
      position: 'absolute',
      top: 10,
      right: 16,
      zIndex: 1,
      marginHorizontal: -24,
      marginVertical: -16,
    },
    heartCounter: {
      position: 'absolute',
      top: 35,
      right: 27,
      zIndex: 1,
      marginHorizontal: -24,
      marginVertical: -16,
      color: 'white'
    },  
    
    titleContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },

    attributes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        
    },
    priceContainer: {
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: '#E8E8E8',
        marginRight: 10,
        marginLeft: 18,
        paddingVertical: 3,

    },
    distanceContainer: {
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginRight: 18,
        paddingVertical: 3,

    },
    card: {
      borderRadius: 10,
      marginBottom: 10,
      marginHorizontal: 20,
      marginVertical: 5,
      backgroundColor: '#2C2E43',
      height: 250,
      flex: 1,
  },

    topContainer: {
      position: 'relative',
      flexDirection: 'row',
      height: 120,
      flex: 1,        
    },
    
    image: {
      flex: 1,
      // borderTopRightRadius: 10,
      // borderTopLeftRadius: 10,
      height: 200,
      width: '100%',
      marginHorizontal: -24,
      marginVertical: -16,
      resizeMode: 'cover',
      marginRight: 20,
    },

    footerContainer: {
      height: 60,
      marginTop: 162,
      marginHorizontal: -24,
      marginVertical: -16,
    },

    titleContainer: {
      alignItems: 'center',
      marginBottom: 10,
    },

    attributes: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      
    },
    priceContainer: {
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 10,
      backgroundColor: '#E8E8E8',
      marginRight: 10,
      marginLeft: 18,
      paddingVertical: 3,

    },
    distanceContainer: {
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 10,
      marginRight: 18,
      paddingVertical: 3,

    },
});
