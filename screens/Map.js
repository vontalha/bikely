import {
  Icon,
  IconRegistry,
  TopNavigation,
  TopNavigationAction,
} from '@ui-kitten/components';
import React, {useEffect, useState} from 'react';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import {Alert, StyleSheet} from 'react-native';
import MapView, {Circle, Marker} from 'react-native-maps';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';

const BackIcon = props => <Icon {...props} name="arrow-back" />;

const BackAction = ({navigation}) => (
  <TopNavigationAction icon={BackIcon} onPress={() => navigation.goBack()} />
);

export const TopNavigationSimpleUsageShowcase = ({navigation}) => (
  <TopNavigation
    accessoryLeft={() => <BackAction navigation={navigation} />}
    title="Bike map"
  />
);

export default function Map({navigation, route}) {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [vicinityBikes, setVicinityBikes] = useState(
    route.params.vicinityBikes,
  );

  const [searchRadius, setSearchRadius] = useState(route.params.radius);
  console.log(searchRadius);
  console.log(vicinityBikes);

  const setCurrentUserLocation = async () => {
    Geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const latitudeDelta = 0.02;
      const longitudeDelta = 0.02;

      setRegion({
        latitude: lat,
        longitude: lon,
        latitudeDelta: latitudeDelta,
        longitudeDelta: longitudeDelta,
      });
    });
  };

  useEffect(() => {
    request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(async result => {
      switch (result) {
        case RESULTS.UNAVAILABLE:
          console.log(
            'This feature is not available (on this device / in this context)',
          );
          navigation.goBack();
          break;

        case RESULTS.DENIED:
          console.log(
            'The permission has not been requested / is denied but requestable',
          );
          navigation.goBack();
          break;

        case RESULTS.LIMITED:
          console.log('The permission is limited: some actions are possible');
          await setCurrentUserLocation();
          break;

        case RESULTS.GRANTED:
          console.log('The permission is granted');
          await setCurrentUserLocation();
          break;

        case RESULTS.BLOCKED:
          console.log('The permission is denied and not requestable anymore');
          Alert.alert(
            'Missing permission',
            'To use the map you need to allow access to your location.',
            [{text: 'OK', onPress: () => navigation.goBack()}],
          );
          break;
      }
    });
  }, []);

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />

      <TopNavigationSimpleUsageShowcase navigation={navigation} />

      <MapView
        style={styles.map}
        showsUserLocation={true}
        region={region}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}>
        {vicinityBikes.map((listing, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: listing.location.latitude,
              longitude: listing.location.longitude,
            }}
            title={listing.title}
            description={`${listing.price}€`}
          />
        ))}

        <Circle
          center={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          radius={Number(searchRadius * 100)}
          strokeWidth={2}
          strokeColor={'rgba(255,0,0,0.5)'}
          fillColor={'rgba(255,0,0,0.1)'}
        />
      </MapView>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 2,
  },
});
