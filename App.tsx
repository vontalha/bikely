import {ActivityIndicator, StyleSheet, View, Alert, ToastAndroid} from 'react-native';
import React, {useEffect, useState} from 'react';
import Home from './screens/Home';
import {Chat, ChatList, LoginPrompt} from './screens/Chat';
import Profile from './screens/Profile';
import Favorites from './screens/Favorites';
import Sell from './screens/Sell';
import Listing from './screens/Listing';
import Search from './screens/Search';
import SubmitRating from './screens/SubmitRating';
import {auth, db} from './config/Firebase';
import {onAuthStateChanged, User} from 'firebase/auth';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import * as eva from '@eva-design/eva';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import {
  ApplicationProvider,
  BottomNavigation,
  BottomNavigationTab,
  Icon,
  IconElement,
  IconRegistry,
} from '@ui-kitten/components';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {
  StackNavigationProp,
  createStackNavigator,
} from '@react-navigation/stack';
import Notifications from './screens/Notifications';
import {ActionSheetProvider} from '@expo/react-native-action-sheet';
import Map from './screens/Map';
import {enableLatestRenderer} from 'react-native-maps';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

enableLatestRenderer();

const Stack = createStackNavigator();
const ChatTab = createMaterialTopTabNavigator();

const HomeIcon = (props: any): IconElement => (
  <Icon {...props} name="home-outline" />
);

const FavoritesIcon = (props: any): IconElement => (
  <Icon {...props} name="heart-outline" />
);

const SellIcon = (props: any): IconElement => (
  <Icon {...props} name="plus-circle-outline" />
);

const ChatIcon = (props: any): IconElement => (
  <Icon {...props} name="message-circle-outline" />
);

const ProfileIcon = (props: any): IconElement => (
  <Icon {...props} name="person-outline" />
);

const {Navigator, Screen} = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Listing"
        component={Listing}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="Home"
        component={Home}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Search"
        component={Search}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Map" component={Map} options={{headerShown: false}} />
    </Stack.Navigator>
  );
};

const FavoritesStack = () => {
  return (
    <Stack.Navigator initialRouteName="FavoritesScreen">
      <Stack.Screen
        name="FavoritesScreen"
        component={Favorites}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Listing"
        component={Listing}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const ChatListStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatList"
        component={ChatList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ChatUser"
        component={Chat}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Listing"
        component={Listing}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const NotificationsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="NotificationsList"
        component={Notifications}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Listing"
        component={Listing}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const ChatNavigator = () => {
  return (
    <ChatTab.Navigator initialRouteName="ChatList">
      <ChatTab.Screen name="Chats" component={ChatListStack} />
      <ChatTab.Screen name="Notifications" component={NotificationsStack} />
    </ChatTab.Navigator>
  );
};

// @ts-ignore
const BottomTabBar = ({navigation, state}) => (
  <BottomNavigation
    selectedIndex={state.index}
    onSelect={index => navigation.navigate(state.routeNames[index])}>
    <BottomNavigationTab icon={HomeIcon}/>
    <BottomNavigationTab icon={FavoritesIcon}/>
    <BottomNavigationTab icon={SellIcon}/>
    <BottomNavigationTab icon={ChatIcon}/>
    <BottomNavigationTab icon={ProfileIcon}/>
  </BottomNavigation>
);

const TabNavigator = () => (
  <Navigator screenOptions={{headerShown: false}} tabBar={BottomTabBar}>
    <Screen name="HomeStack" component={HomeStack} />
    <Screen name="Favorites" component={FavoritesStack} />
    <Screen name="Sell" component={Sell} />
    <Screen
      name="Chat"
      component={auth.currentUser ? ChatNavigator : LoginPrompt}
    />
    <Screen name="ProfileStack" component={ProfileStack} />
  </Navigator>
);

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const onMessageReceived = async (remoteMessage: any) => {
    const {type} = remoteMessage.data;
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    switch (type) {
      case 'acceptedOffer':
        const {bidderName} = remoteMessage.data;
        notifee.displayNotification({
          title: 'This is your Chance to rate, ' + bidderName,
          body: 'Please inform us and other users about your trade experience, by rating ' + bidderName + '.',
          android: {
            channelId: channelId,
          },
        });
        break;

      case 'trackLikes':
        notifee.displayNotification({
          title: 'Your Listing is popular!',
          body: 'Your listing has been liked by many users. Check it out!',
          android: {
            channelId: channelId,
          },
        });
        break;

      case 'newOffer':
        const {listingName} = remoteMessage.data;
        notifee.displayNotification({
          title: 'You received a new offer!',
          body: 'You receaved a new offer for your listing: ' + listingName + '.',
          android: {
            channelId: channelId,
          },
        });
        break;

      case 'newChat':
        const {senderName} = remoteMessage.data;
        ToastAndroid.show(senderName + ', began a new Chat with you' + '.', ToastAndroid.SHORT);
        break;
    }
  }

  useEffect(() => {
    messaging().onMessage(onMessageReceived);
  }, []);


  useEffect(() => {
    onAuthStateChanged(auth, (user: any) => {
      if (user) {
        setAuthenticated(true);
        setCurrentUser(user);
      } else {
        setAuthenticated(false);
      }

      if (initializing) {
        setInitializing(false);
      }
    });
  }, [initializing]);

  if (initializing) {
    return (
      <View>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={eva.light}>
        <ActionSheetProvider>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
        </ActionSheetProvider>
      </ApplicationProvider>
    </>
  );
};

StyleSheet.create({});

export default App;
