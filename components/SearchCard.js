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
const conditionColorMapping = {
    'New': '#00f59b',
    'Used': '#fee719',
    'Damaged': '#FF0060',
}

const calculateDistance =  (locationData, listing) => {
    console.log("dist_calc loc:"+locationData+ " listing:"+listing);
    const distance = getDistance(
    {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    },
    {
      latitude: listing.pos.coords.latitude,
      longitude: listing.pos.coords.longitude,
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


export default function SearchCard({listing, locationData, navigation}) {
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
                
                if(userData.favourites.includes(listing.objectID)){
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
                favourites: arrayRemove(listing.objectID)
            },
            updateDoc(doc(db, 'listings', listing.objectID), {
                likes: increment(-1)
            })
            
            );
        } else{
            setIsLiked(true);
            updateDoc(doc(db, 'users', auth.currentUser.uid), {
                favourites: arrayUnion(listing.objectID)
            },
            updateDoc(doc(db, 'listings', listing.objectID), {
                likes: increment(1)
            })
            );
        }
    };

    const increaseViews = async () => {
        if(auth.currentUser !== null){
            updateDoc(doc(db, 'listings', listing.objectID), {
                        views: arrayUnion(auth.currentUser.uid)
                    });
        }
    };

    const handleCardPress = () => {
        increaseViews();
        const listingData = {
            _id: listing.objectID,
            title: listing.advertTitle,
            images: listing.images,
            likes: listing.likes,
            views: listing.views.length,
            price: listing.price,
            condition: listing.bike.bikeCondition,
            brand: listing.bike.bikeBrand.id,
            model: listing.bike.bikeModel,
            gears: listing.bike.bikeNumberOfGears,
            description: listing.description,
            type: listing.bike.bikeType,
        }
        navigation.navigate('Listing', {listing: listingData});
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
            <View style={styles.cardContainer}>
                <Card 
                    onPress={handleCardPress}
                    style={[
                            styles.card, 
                            {
                                height: Dimensions.get("screen").height / 100 * 35,
                                width: Dimensions.get("screen").width / 100 * 90,
                                alignSelf: 'center',
                            }
                        ]}  
                    status={statusConditionMapping[listing.bike.bikeCondition]}>
                    <View style={styles.topContainer}>
                        {(listing.images).length > 0 ? 
                                (<Image
                                    key={listing.objectID}
                                    source={{uri: (listing.images)[0]}}
                                    style={styles.image}
                                    resizeMode={'cover'}
                            />)
                            : (<Image
                                    key={listing.objectID}
                                    source={require("../assets/no-image.png")}
                                    style={styles.image}
                                    resizeMode={'cover'} 
                                />)
                        }    
                    </View>
                    <View style={styles.footerContainer}>
                        <View style={styles.attributes}>
                            <View 
                                style={[
                                    styles.distanceContainer, 
                                    {backgroundColor: distanceColorMapping(calculateDistance(locationData,listing))}
                                ]}>
                                <Text category="label">{calculateDistance(locationData,listing)} km</Text>
                            </View>
                            <View style={[styles.bikeAttributesContainer,
                                {backgroundColor: conditionColorMapping[listing.bike.bikeCondition]}
                                ]}>
                                <Text category='label'>{listing.bike.bikeCondition}</Text>
                            </View>
                            <View style={styles.bikeAttributesContainer}>
                                <Text category='label'>{listing.bike.bikeType}</Text>

                            </View>
                            <View style={styles.bikeAttributesContainer}>
                                <Text category='label'>{listing.bike.bikeBrand.id}</Text>
                            </View>
                        </View>

                        <View style={styles.titleContainer}>
                            <Text style={{fontWeight:'900', color:'#F0F0F0', fontSize:20, marginTop:5, marginLeft:15}} numberOfLines={2} ellipsizeMode='tail'>{listing.advertTitle}</Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={{fontWeight:'900', color:'#F0F0F0', fontSize:27, marginLeft:15}}>{listing.price + " $"}</Text>
                        </View>
                        <View style={styles.heart}>
                            <Pressable onPress={auth.currentUser? handleLikepress: ()=>setModalVisible(true)}>
                                <Icon
                                    name={isLiked? 'heart' : 'heart-outline'}
                                    style={[styles.heart, { width: 33, height: 33 }]}
                                    fill={isLiked? '#fb6376': '#EEEEEE'}
                                />
                            </Pressable>
                        </View>
                    </View>
                </Card>
            </View>
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
        flex: 1,
        },

    topContainer: {
        position: 'relative',
        flexDirection: 'row',
        height: 120,
        flex: 1,        
    },

    image: {
        flex: 1,
        // borderTopRightRadius: 10,
        // borderTopLeftRadius: 10,
        height: 140,
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
        marginTop: 135,
        marginHorizontal: -24,
        marginVertical: -16,
    },
    
    
    attributes: {
        flexDirection: 'row',
        marginHorizontal: 10,
        marginTop: 5,
        marginLeft: 15,
        
    },
    bikeAttributesContainer: {
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: '#E8E8E8',
        marginLeft: 18,
        paddingVertical: 3,

    },
    distanceContainer: {
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 3,

    },

    titleContainer: {
            marginVertical: 10,
            marginTop: 5,
    },
    priceContainer: {},

    heart: {
        position: 'absolute',
        bottom: 2,
        right: 43,
        zIndex: 1,
        marginHorizontal: -24,
        marginVertical: -16,
    }, 

}); 