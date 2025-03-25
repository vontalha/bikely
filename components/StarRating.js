import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from '@ui-kitten/components';


export default function StarRating ({rating}) {
    const renderStars = () => {
        const stars = [];
        const maxStars = 5;
    
        for (let i = 1; i <= maxStars; i++) {
          const starIcon = i <= rating ? 'star' : 'star-outline';
          const starColor = i <= rating ? '#FFD700' : '#CCCCCC';
    
          stars.push(
            <Icon
              key={i}
              name={starIcon}
              style={[styles.star, { color: starColor }]}
            />
          );
        }
    
        return stars;
      };
    
      return <View style={styles.container}>{renderStars()}</View>;
};

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
    },
    star: {
      width: 20,
      height: 20,
      marginRight: 2,
    },
});
