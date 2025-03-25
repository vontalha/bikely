import {StyleSheet, TouchableOpacity} from 'react-native';
import React, {useLayoutEffect, useEffect} from 'react';
import {Avatar, ListItem} from 'react-native-elements';
import {doc, getDoc, onSnapshot} from 'firebase/firestore';
import {auth, db} from '../config/Firebase';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function CustomListItem({chatId}) {
  const [chatPartner, setChatPartner] = React.useState('');
  const [RecentText, setRecentText] = React.useState('');

  useLayoutEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'chats', chatId), async snapshot => {
      console.log(chatId);

      const chatData = snapshot.data();
      console.log(chatData);

      if (chatData !== undefined) {
        const latestMessage = await chatData.messages[
          chatData.messages.length - 1
        ];

        if (latestMessage === undefined) {
          setRecentText('');
        } else if (latestMessage.image) {
          setRecentText(<Icon name="camera" size={15} />);
        } else if (latestMessage.location) {
          setRecentText(<Icon name="map-marker" size={15} />);
        } else {
          setRecentText(latestMessage.text);
        }
        const chatPartner = chatData.participants.filter(
          user => user !== auth.currentUser.uid,
        )[0];

        const userDocRef = doc(db, 'users', chatPartner);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        console.log(userData.userName);
        setChatPartner(userData.userName);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  return (
    <ListItem>
      <Avatar
        rounded
        source={{
          uri: 'https://cencup.com/wp-content/uploads/2019/07/avatar-placeholder.png',
        }}
      />
      <ListItem.Content>
        <ListItem.Title style={{fontWeight: '800'}}>
          {chatPartner}
        </ListItem.Title>
        <ListItem.Subtitle
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{padding: 7}}>
          {RecentText}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );
}

const styles = StyleSheet.create({});
