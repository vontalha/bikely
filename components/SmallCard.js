import React, { useLayoutEffect } from 'react';
import { StyleSheet, View, ViewProps,useState, Image, ScrollView, Pressable, Dimensions, Alert, Modal, TouchableOpacity } from 'react-native';
import { Button, Card, Layout, Text, Icon } from '@ui-kitten/components';
import {getDistance} from 'geolib';
import {db, auth} from '../config/Firebase';
import { arrayRemove, arrayUnion, collection, doc, getDoc, increment, onSnapshot, updateDoc } from 'firebase/firestore';
import { LoginPrompt } from '../screens/Chat';
import {Login, Signup} from './Authentication';


const statusConditionMapping = {
    'New': 'success',
    'Used': 'warning',
    'Damaged': 'danger',
}

const calculateDistance =  (locationData, listing) => {
    console.log("dist_calc loc:"+locationData+ " listing:"+listing);
    const distance = getDistance(
    {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    },
    {
      latitude: listing.location.latitude,
      longitude: listing.location.longitude,
    }
  );
    return Math.ceil(distance / 1000);
}

const distanceColorMapping = (distance) => {
    switch (true) {
        case (distance <= 10):
            return '#00f59b';
        case (distance <= 30):
            return '#fee719';
        case (distance <= 50):
            return '#fc7b28';
        case (distance > 50):
            return '#FF0060';
    }
}

// const handleNoAuthPress = () => {
//     const [modalVisible, setModalVisible] = React.useState(false);
//     const [authenticated, setAuthenticated] = React.useState(false);
//     return (
//         <Modal
//         animationType="slide"
//         visible={modalVisible}
//         onRequestClose={() => {
//           setModalVisible(!modalVisible);
//         }}
//         presentationStyle="overFullScreen">
//         <Pressable onPress={() => setModalVisible(!modalVisible)}>
//           <Text style={styles.Close}>x</Text>
//         </Pressable>
//         <Login />
//         <Signup />
//       </Modal>
//     )
// }

export default function SmallCard({listing, locationData, navigation}) {
    const [isLiked, setIsLiked] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);

    //const [uri, setUri] = React.useState(null);
    console.log("SC listing images :"+(listing.images)[0]);
    const conditionColor = statusConditionMapping[listing.condition];
    console.log("SC conditionColor:"+ listing.condition);

    useLayoutEffect(() => {
        if(auth.currentUser !== null){
            const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), async snapshot => {
                const userData = snapshot.data();
                
                if(userData.favourites.includes(listing._id)){
                    setIsLiked(true);
                }
                else{
                    setIsLiked(false);
                }
            });
        
            return () => unsubscribe();
        }
    }, []);
    
    
    const handleLikepress = async () => {
        if(isLiked){
            setIsLiked(false);
            updateDoc(doc(db, 'users', auth.currentUser.uid), {
                favourites: arrayRemove(listing._id)
            },
            updateDoc(doc(db, 'listings', listing._id), {
                likes: increment(-1)
            })
            
            );
        } else{
            setIsLiked(true);
            updateDoc(doc(db, 'users', auth.currentUser.uid), {
                favourites: arrayUnion(listing._id)
            },
            updateDoc(doc(db, 'listings', listing._id), {
                likes: increment(1)
            })
            );
        }

    };

    const increaseViews = async () => {
        if(auth.currentUser !== null){
            updateDoc(doc(db, 'listings', listing._id), {
                        views: arrayUnion(auth.currentUser.uid)
                    });
        }
        
    };
    
    return (
        <>
            <Modal
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
                presentationStyle="overFullScreen">
                <Pressable onPress={() => setModalVisible(!modalVisible)}>
                <Text style={styles.Close}>x</Text>
                </Pressable>
                <Login />
                <Signup />
            </Modal>

            <Card 
                onPress={() => {
                    navigation.navigate('Listing', {listing: listing}),increaseViews();
                }}
                style={[
                        styles.card, 
                        {
                            height: Dimensions.get("screen").height / 100 * 24.5,
                            width: Dimensions.get("screen").width / 100 * 40,
                        }
                    ]}  
                status={statusConditionMapping[listing.condition]}>
                <View style={styles.topContainer}>
                    <View style={styles.heart}>
                        <Pressable onPress={auth.currentUser? handleLikepress: ()=>setModalVisible(true)}>
                            <Icon
                                name={isLiked? 'heart' : 'heart-outline'}
                                style={[styles.heart, { width: 25, height: 25 }]}
                                fill={isLiked? '#fb6376': '#EEEEEE'}
                            />
                        </Pressable>
                    </View>
                    
                        {(listing.images).length > 0 ? 
                            (<Image
                                key={listing._id}
                                source={{uri: (listing.images)[0]}}
                                style={styles.image}
                                resizeMode={'cover'}
                        />)
                        : (<Image
                                key={listing._id}
                                source={require("../assets/no-image.png")}
                                style={styles.image}
                                resizeMode={'cover'} 
                            />)
                        }    
                </View>
                <View style={styles.footerContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={{fontWeight:'900', color:'#F0F0F0'}} numberOfLines={2} ellipsizeMode='tail'>{listing.title}</Text>
                    </View>
                    <View style={styles.attributes}>
                        <View style={styles.priceContainer}>
                            <Text category='label'>{listing.price + " $"}</Text>
                        </View>
                        <View 
                            style={[
                                styles.distanceContainer, 
                                {backgroundColor: distanceColorMapping(calculateDistance(locationData,listing))}
                            ]}>
                            <Text category="label">{calculateDistance(locationData,listing)} km</Text>
                        </View>
                    </View>
                
                </View>
            </Card>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
            borderRadius: 10,
            marginBottom: 10,
            // height: 200,
            // width: '40%',
            marginHorizontal: 10,
            marginVertical: 5,
            backgroundColor: '#2C2E43',
        },

    topContainer: {
        position: 'relative',
        flexDirection: 'row',
        height: 120,
        flex: 1,        
    },
    heart: {
        position: 'absolute',
        top: 13,
        right: 20,
        zIndex: 1,
        marginHorizontal: -24,
        marginVertical: -16,
    }, 
    image: {
        flex: 1,
        // borderTopRightRadius: 10,
        // borderTopLeftRadius: 10,
        height: 105,
        width: '100%',
        marginHorizontal: -24,
        marginVertical: -16,
        resizeMode: 'cover',
    },

    footerContainer: {
        // // position: 'relative',
        // flexDirection: 'row',
        height: 60,
        // height: 60,
        marginTop: 95,
        marginHorizontal: -24,
        marginVertical: -16,
    },
    
    titleContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },

    attributes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: '#E8E8E8',
        marginRight: 10,
        marginLeft: 18,
        paddingVertical: 3,

    },
    distanceContainer: {
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginRight: 18,
        paddingVertical: 3,

    },

}); 