import React from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const MyOrdersScreen = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>

      <View style={styles.orderItem}>
        <Image
          style={styles.bikeImage}
          source={require('../assets/usedBike.jpg')}
        />
        <Text style={styles.modelName}>Dummy Bike Model 1</Text>
      </View>

      <View style={styles.orderItem}>
        <Image
          style={styles.bikeImage}
          source={require('../assets/usedBike.jpg')}
        />
        <Text style={styles.modelName}>Dummy Bike Model 2</Text>
      </View>

      <View style={styles.orderItem}>
        <Image
          style={styles.bikeImage}
          source={require('../assets/usedBike.jpg')}
        />
        <Text style={styles.modelName}>Dummy Bike Model 3</Text>
      </View>

      <View style={styles.orderItem}>
        <Image
          style={styles.bikeImage}
          source={require('../assets/usedBike.jpg')}
        />
        <Text style={styles.modelName}>Dummy Bike Model 4</Text>
      </View>

      {/* Add more order items here */}

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

export default MyOrdersScreen;
