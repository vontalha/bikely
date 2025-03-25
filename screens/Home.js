import {
  Alert,
  FlatList,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  DrawerLayoutAndroid,
} from 'react-native';
import React, {useEffect, useLayoutEffect} from 'react';
import {collection, doc, getDoc, getDocs} from 'firebase/firestore';
import {SafeAreaView} from 'react-native-safe-area-context';
import {auth, db} from '../config/Firebase';
import {onAuthStateChanged} from 'firebase/auth';

import {initiateChat} from './Chat';
import Slider from '@react-native-community/slider';
//import {RequestLocationPermission} from '../Components/Location'
import Geolocation from '@react-native-community/geolocation';
import {getDistance} from 'geolib';
import SmallCard from '../components/SmallCard';
import {FAB} from 'react-native-elements';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
//import {index, searchClient} from '../config/Algolia';
import algoliasearch from 'algoliasearch/lite';

export const searchClient = algoliasearch(
  'D4TZ2FURAO',
  '1278f3eb519f1a21759a95faba372b26',
);
export const index = searchClient.initIndex('listings');

export default function Home({navigation}) {
  //function will be used in order to navigate to respective listing

  const [users, setUsers] = React.useState([]);
  const [vicinityBikes, setVicinityBikes] = React.useState([]);
  const [radius, setRadius] = React.useState(1);
  const [locationData, setLocationData] = React.useState(null);
  const [userName, setUserName] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [drawerPosition, setDrawerPosition] = useState('right');
  const [drawerData, setDrawerData] = useState('');
  const drawer = React.useRef(null);


  const openDrawer = () => {
    drawer.current.openDrawer();
  };

  const closeDrawer = () => {
    drawer.current.closeDrawer();
  };


  const updateDrawerData = (data) => {
    setDrawerData(data);
  };

  const navigationView = () => (
    <View style={[styles.container, styles.navigationContainer]}>
      <Text style={styles.paragraph}>I'm in the Drawer!</Text>
      <Button title="Close drawer" onPress={closeDrawer} />
      <Button title="Update Home Data" onPress={() => updateDrawerData('New Data')} />
    </View>
  );



  useLayoutEffect(() => {
    onAuthStateChanged(auth, user => {
      if (user) {
        console.log('User Logged in');
        fetchUserName();
      } else {
        console.log('User Logged out');
      }
    });
  }, []);

  const handleRadiusChange = radius => {
    setRadius(radius);
  };

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     const usersCollectionRef = collection(db, 'users');
  //     const querySnapshot = await getDocs(usersCollectionRef);
  //     const usersData = querySnapshot.docs.map(doc => ({
  //       id: doc.id,
  //       userName: doc.data().userName,
  //     }));
  //     setUsers(usersData);
  //     //setUserName();
  //   };
  //   fetchUsers();
  // }, []);

  const fetchUserName = async () => {
    if (auth.currentUser !== null) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      setUserName(userData.userName);
    }
  };
  // useEffect(() => {
  //     const fetchBikesRadius = async () => {
  //         getLocation()
  //         const bikesCollectionRef = collection(db, 'listing')
  //         const querySnapshot = await getDocs(bikesCollectionRef)
  //         const listingData = querySnapshot.docs.map((doc) => ({
  //                 title: doc.data().title,
  //                 images: doc.data().Image,
  //                 userId: doc.data().userID,
  //                 location: {
  //                     latitude: doc.data().pos.coords.latitude,
  //                     longitude: doc.data().pos.coords.longitude,
  //                 }
  //         }))
  //         bikesNear = listingData.filter((bike) => {
  //             const distance = getDistance(
  //                 {latitude: locationData.latitude, longitude: locationData.longitude},
  //                 {latitude: bike.location.latitude, longitude: bike.location.longitude}
  //             )
  //             return distance <= radius
  //         })
  //         console.log(bikesNear)
  //         setVicinityBikes(bikesNear)
  //         fetchBikesRadius()
  //     }
  // }, [radius])

  const RequestLocationPermission = async () => {
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
      console.warn(err);
    }
  };

  const fetchLocation = async () => {
    const locationPermission = await RequestLocationPermission();
    if (locationPermission) {
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

  useEffect(() => {
    const fetchBikesRadius = async () => {
      await fetchLocation();
      const bikesCollectionRef = collection(db, 'listings');
      const querySnapshot = await getDocs(bikesCollectionRef);
      const listingData = querySnapshot.docs.map(doc => ({
        _id: doc.id,
        title: doc.data().advertTitle,
        images: doc.data().images,
        userId: doc.data().userID,
        location: {
          latitude: doc.data().pos.coords.latitude,
          longitude: doc.data().pos.coords.longitude,
        },
        condition: doc.data().bike.bikeCondition,
        price: doc.data().price,
        views: doc.data().views.length,
        likes: doc.data().likes,
        brand: doc.data().bike.bikeBrand,
        model: doc.data().bike.bikeModel,
        type: doc.data().bike.bikeType,
        gears: doc.data().bike.bikeNumberOfGears,
        description: doc.data().description,
        offer: {
          accepted: doc.data().offer.accepted,
          currentOffers: doc.data().offer.currentOffers,
          minimumOffer: doc.data().offer.minimumOffer,
        },
      }));
      console.log(listingData);
      if (locationData) {
        if (listingData.length > 0) {
          //filter bikes which are within radius
          const filteredBikes = listingData.filter(bike => {
            return bike.userId !== (auth.currentUser && auth.currentUser.uid);
          });
          const bikesNear = filteredBikes.filter(bike => {
            const distance = getDistance(
              {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
              },
              {
                latitude: bike.location.latitude,
                longitude: bike.location.longitude,
              },
            );
            return distance / 1000 <= radius;
          });
          //sort bikes by distance
          bikesNear.sort((a, b) => {
            const distanceA = getDistance(
              {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
              },
              {
                latitude: a.location.latitude,
                longitude: a.location.longitude,
              },
            );
            const distanceB = getDistance(
              {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
              },
              {
                latitude: b.location.latitude,
                longitude: b.location.longitude,
              },
            );
            return distanceA - distanceB;
          });

          setVicinityBikes(bikesNear);
        }
      }
    };
    fetchBikesRadius();
  }, [radius]);

  const handleUserPress = userId2 => {
    initiateChat(navigation, auth.currentUser.uid, userId2);
  };

  const handleSearchQuery = () => {
    fetchLocation();
    console.log(searchQuery);
    console.log(locationData);
    index
      .search(searchQuery, {
        attributesToRetrieve: [
          'advertTitle',
          'bike.bikeCondition',
          'bike.bikeType',
          'bike.bikeBrand.id',
          'bike.bikeModel',
          'bike.bikeNumberOfGears',
          'description',
          'price',
          'pos.coords',
          'images',
          'objectID',
          'likes',
          'views',
        ],
      })
      .then(({hits}) => {
        console.log(hits);
        navigation.navigate('Search', {results: hits, location: locationData});
      })
      .catch(err => console.log(err));

    //navigation.navigate('Search')
  };

  const handleLastSeen = async () => {};

  return (
    <DrawerLayoutAndroid
      ref={drawer}
      drawerWidth={200}
      drawerPosition={drawerPosition}
      renderNavigationView={navigationView}
    >
    <View style={styles.homeContainer}>
      <SafeAreaView>
        <ScrollView>
          <View style={styles.headerContainer}>
            <Text style={styles.greetingTitle}>
              {/* Hi{
              auth.currentUser && ", " + userName} */}
              {auth.currentUser ? 'Hi, ' + userName : 'Hi'}
            </Text>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              value={searchQuery}
              style={styles.searchBox}
              placeholder="Search"
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSearchQuery}
              onChangeText={text => setSearchQuery(text)}
            />

            <FontAwesomeIcon
              name="search"
              color="#3C486B"
              size={18}
              style={{left: 70, top: 15, position: 'absolute'}}
              onPress={handleSearchQuery}
            />
            <IoniconsIcon
              name="options"
              color="#3C486B"
              size={30}
              style={{right: 57, top: 10, position: 'absolute'}}
              onPress={openDrawer}
            />
          </View>
          <View style={styles.sliderContainer}>
            <IoniconsIcon
              name="location"
              color="#3C486B"
              size={30}
              style={{marginLeft: 15, marginTop: 10, position: 'absolute'}}
            />
            <Slider
              style={{
                width: 330,
                height: 40,
                alignSelf: 'center',
                marginTop: 10,
                marginLeft: 50,
              }}
              minimumValue={1}
              maximumValue={100}
              step={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              thumbTintColor="#394867"
              //onValueChange={handleRadiusChange}
              onSlidingComplete={handleRadiusChange}
            />
          </View>
          <View style={{flexDirection: 'row', marginBottom: 10}}>
            <TextInput
              onChangeText={text => setRadius(Number(text))}
              keyboardType="numeric"
              placeholder="km"
              placeholderTextColor="#aaa"
              style={styles.radiusInput}
            />
            <Text
              style={{
                marginLeft: 55,
                fontSize: 16,
                marginTop: 7,
                fontWeight: '500',
              }}>
              Search Radius of {radius} km
            </Text>
          </View>
          <View style={styles.nearYouHeader}>
            <Text style={{fontSize: 45, fontWeight: '600', color: '#212A3E'}}>
              Near You
            </Text>
          </View>

          <View style={styles.FlatList}>
            {vicinityBikes.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                numColumns={2}
                data={vicinityBikes}
                renderItem={({item}) =>
                  item !== undefined &&
                  locationData !== null && (
                    <SmallCard
                      key={item._id}
                      listing={item}
                      locationData={locationData}
                      navigation={navigation}
                    />
                  )
                }
                keyExtractor={item => item._id}
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'space-between',
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                }}
              />
            ) : (
              <Text>No Bikes in your Area</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <View style={{position: 'absolute', bottom: 16, right: 16}}>
        <FAB
          icon={<FontAwesomeIcon name="map" size={24} color="white" />} // Specify the map icon
          size="large" // Set the size to large for a circular FAB
          buttonStyle={{backgroundColor: '#394867'}} // Customize the FAB button color
          onPress={() => {
            navigation.navigate('Map', {vicinityBikes, radius});
          }}
        />
      </View>
    </View>
    </DrawerLayoutAndroid>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#F1F6F9',
  },
  headerContainer: {},

  greetingTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#3C486B',
    marginTop: 20,
  },

  searchContainer: {
    marginTop: 20,
  },
  searchBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#fff',
    marginRight: 100,
    marginLeft: 50,
    paddingLeft: 50,
    flexDirection: 'row',
    fontSize: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  sliderContainer: {
    flexDirection: 'row',
  },

  radiusInput: {
    marginLeft: 10,
    height: 40,
    width: 40,
    borderRadius: 10,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#9BA4B5',
  },

  nearYouHeader: {
    marginTop: 30,
    marginLeft: 20,
    marginBottom: 20,
  },

  container: {
    flexDirection: 'row',
    padding: 8,
  },
  card: {
    flex: 1,
    margin: 8,
    alignItems: 'center',
    elevation: 5,
  },
  categoryImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {width: 5, height: 5},
  },
  FlatList: {
    paddingHorizontal: 8,
  },
  SearchContainter: {
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
