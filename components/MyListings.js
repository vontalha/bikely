import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {auth} from '../config/Firebase';

const MyListingsScreen = () => {
  const [listings, setListings] = useState([]);
  const uid = auth.currentUser.uid;
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.navigate('Profile');
  };

  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'listings'), where('userID', '==', uid));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const data = [];
      querySnapshot.forEach(doc => {
        data.push(doc.data());
      });
      setListings(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Listings</Text>

      {listings.map((listings, index) => (
        <View key={index} style={styles.orderItem}>
          <Image style={styles.bikeImage} source={{uri: listings.images[0]}} />
          <Text style={styles.modelName}>{listings.advertTitle}</Text>
        </View>
      ))}

      <View style={styles.goBackContainer}>
        <TouchableOpacity style={styles.goBackButton} onPress={handleGoBack}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#778899',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bikeImage: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  modelName: {
    fontSize: 18,
  },
  goBackContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  goBackButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  goBackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyListingsScreen;
