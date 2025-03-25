import React, {useEffect, useState, useLayoutEffect, PermissionsAndroid,} from 'react';
import {View, Text, FlatList, Button, Image, StyleSheet, ScrollView} from 'react-native';
import {auth, db} from '../config/Firebase';
import {collection, doc, getDocs, getDoc} from 'firebase/firestore';
import BikeCardMedium from '../components/BikeCardMedium';

const FavoritenScreen = ({navigation}) => {
  const [favoriten, setFavoriten] = useState([]);
  const [locationData, setLocationData] = React.useState(null);

function extend(obj, src) {
  for (var key in src) {
      if (src.hasOwnProperty(key)) obj[key] = src[key];
  }
  return obj;
}

useLayoutEffect(() => {
  const loadFavorites = async () => {
    const favoritenData = [];
    if (auth.currentUser != null) {
      const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));

      const favoritenIDs = userSnap.data().favourites;

      const querySnapshot = await getDocs(collection(db, 'listings'));
      querySnapshot.forEach(doc => {
        if (favoritenIDs.includes(doc.id)) {

          favoritenData.push(extend(doc.data(),{_id: doc.id}));
        }
      });
    }
    setFavoriten(favoritenData);
  };

  loadFavorites();
}, [setFavoriten]);

  
  return (
    <ScrollView style={styles.scrollView}>
      <Text>Favoriten</Text>
      {auth.currentUser != null ? (
        favoriten.map(favorite => <BikeCardMedium key={favorite._id} listing={favorite} navigation={navigation} />)
      ) : (
        <View>
          <Text>Your saved bikes live here.</Text>
          <Text>
            Once you start saving bikes you like, they will appear here.
          </Text>
          <Button
            title="Discover Bikes"
            onPress={() => navigation.navigate('Home')}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
});

export default FavoritenScreen;
