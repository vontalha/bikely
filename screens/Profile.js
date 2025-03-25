import React, {useEffect, useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import userProfile from '../assets/userProfile.png';
import homePic from '../assets/Home.png';
import orders from '../assets/order.png';
import listings from '../assets/Listings.png';
import accpic from '../assets/myacc.png';
import StarRating from '../components/Rating';
import {useNavigation} from '@react-navigation/native';

import {doc, onSnapshot} from 'firebase/firestore';
import {auth, db} from '../config/Firebase';
import {getUserData} from '../components/UserAPI';
import { Logout } from '../components/Authentication';


const Profile = ({route, navigation}) => {
  // const [user, setUser] = useState(null);

  // const uid_ = auth.currentUser.uid;

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const userData = await getUserData(uid_);
  //       setUser(userData);
  //     } catch (error) {
  //       console.error('Error retrieving user data:', error);
  //       setUser(null);
  //     }
  //   };

  //   const unsubscribe = onSnapshot(doc(db, 'Profile', uid_), doc => {
  //     if (doc.exists()) {
  //       fetchUserData();
  //     } else {
  //       setUser(null);
  //     }
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, []);

  // useEffect(async () => {
  //   try {
  //     const userData = await getUserData(uid_);
  //     setUser(userData);
  //   } catch (error) {
  //     console.error('Error retrieving user data:', error);
  //     setUser(null);
  //   }
  // }, []);

  // const displayName = user ? user.displayName : 'Loading...';

  // const navigation = useNavigation();
  // const handleHomePress = () => {
  //   navigation.navigate('Home');
  // };

  // const handleAccountPress = () => {
  //   navigation.navigate('MyAccount', {user: user});
  // };

  // const handleOrdersPress = () => {
  //   navigation.navigate('MyOrders');
  // };

  // const handleListingsPress = () => {
  //   if (user)
  //   navigation.navigate('MyListings');
  // };

  // return (
  //   <View style={styles.container}>
  //     <View style={styles.header}>
  //       <View style={styles.headerContent}>
  //         <Image style={styles.avatar} source={userProfile} />

  //         <Text style={styles.name}>{user && user.username}</Text>
  //         <Text style={styles.userInfo}>{user && user.email}</Text>
  //         <StarRating />
  //       </View>
  //     </View>

  //     <View style={styles.body}>
  //       <TouchableOpacity onPress={handleHomePress} style={styles.item}>
  //         <View style={styles.iconContent}>
  //           <Image style={styles.icon} source={homePic} />
  //         </View>
  //         <View style={styles.infoContent}>
  //           <Text style={styles.text}>Home</Text>
  //         </View>
  //       </TouchableOpacity>

  //       <TouchableOpacity onPress={handleAccountPress} style={styles.item}>
  //         <View style={styles.iconContent}>
  //           <Image style={styles.icon} source={accpic} />
  //         </View>
  //         <View style={styles.infoContent}>
  //           <Text style={styles.text}>My Account</Text>
  //         </View>
  //       </TouchableOpacity>

  //       <TouchableOpacity onPress={handleOrdersPress} style={styles.item}>
  //         <View style={styles.item}>
  //           <View style={styles.iconContent}>
  //             <Image style={styles.icon} source={orders} />
  //           </View>
  //           <View style={styles.infoContent}>
  //             <Text style={styles.text}>My Orders</Text>
  //           </View>
  //         </View>
  //       </TouchableOpacity>

  //       <TouchableOpacity onPress={handleListingsPress} style={styles.item}>
  //         <View style={styles.item}>
  //           <View style={styles.iconContent}>
  //             <Image style={styles.icon} source={listings} />
  //           </View>
  //           <View style={styles.infoContent}>
  //             <Text style={styles.text}>My Listings</Text>
  //           </View>
  //         </View>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );
  return (
    <View>
      <Logout />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#778899',
  },
  header: {
    backgroundColor: '#DCDCDC',
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 63,
    borderWidth: 4,
    borderColor: 'white',
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    color: '#000000',
    fontWeight: '600',
  },
  userInfo: {
    fontSize: 16,
    color: '#778899',
    fontWeight: '600',
  },
  body: {
    flex: 1,
    backgroundColor: '#778899',
    padding: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContent: {
    marginRight: 20,
  },
  icon: {
    width: 30,
    height: 30,
  },
  infoContent: {
    flex: 1,
  },
  text: {
    fontSize: 18,
    color: '#DCDCDC',
  },
});

export default Profile;
