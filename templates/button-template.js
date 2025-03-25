import React from 'react';
import {styles} from '../App';
import {Pressable, Text} from 'react-native';

export default function Button(props) {
  const {onPress, title = 'Title'} = props;
  return (
    <Pressable style={styles.buttonStyle} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}
