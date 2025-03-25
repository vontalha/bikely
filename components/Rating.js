import React, {useState} from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import emptyStar from '../assets/emptyStar.png';
import filledStar from '../assets/filledStar.png';

const StarRating = () => {
  const [rating, setRating] = useState(0);

  const handleRatingPress = selectedRating => {
    setRating(selectedRating);
  };

  const renderStars = () => {
    const stars = [];
    const totalStars = 5;

    for (let i = 1; i <= totalStars; i++) {
      const starIcon = i <= rating ? filledStar : emptyStar;

      stars.push(
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => handleRatingPress(i)}>
          <Image source={starIcon} style={styles.star} />
        </TouchableOpacity>,
      );
    }

    return stars;
  };

  return (
    <View style={styles.starRatingContainer}>
      <Text style={styles.ratingText}>Rating:</Text>
      <View style={styles.starsContainer}>{renderStars()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  starRatingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    width: 30,
    height: 30,
    marginHorizontal: 2,
  },
});

export default StarRating;
