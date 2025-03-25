import {PermissionsAndroid} from 'react-native';

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

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
  }
};

export default RequestLocationPermission;
