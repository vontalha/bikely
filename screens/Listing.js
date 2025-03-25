import { StyleSheet, View, Image, ScrollView,Button, Pressable, Modal} from 'react-native'
import React, {useEffect, useLayoutEffect} from 'react'
import {
    Card,
    Icon,
    StyleService,
    useStyleSheet,
    Text,
    Input,
  } from '@ui-kitten/components';
import {auth, db} from '../config/Firebase';
import {initiateChat} from './Chat';
import {setDoc, getDoc, doc, updateDoc, arrayUnion, query, queryEqual, QuerySnapshot, increment, arrayRemove, onSnapshot, collection } from 'firebase/firestore';
import { Alert } from 'react-native';
import { Login, Signup } from '../components/Authentication';
import * as uuid from 'uuid';
import StarRating from '../components/StarRating';


export const deleteListing = async (listingId) => {};


export default function Listing({route,navigation}) {

    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalVisibleAuth, setModalVisibleAuth] = React.useState(false);
    const [offer, setOffer] = React.useState('');
    const [offerError, setOfferError] = React.useState(false);
    const [allowedToBid, setAllowedToBid] = React.useState(false);
    const [acceptsOffers, setAcceptsOffers] = React.useState(false);
    const [isLiked, setIsLiked] = React.useState(false);
    const [likeAmount, setLikeAmount] = React.useState(0);
    const [viewAmount, setViewAmount] = React.useState(0);
    const [rating, setRating] = React.useState(0);
    const {listing} = route.params;
    console.log(listing)
    if(auth.currentUser !== null){
        useLayoutEffect(() => {
    
            const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), async snapshot => {
                const userData = snapshot.data();
                if(userData.favourites.includes(listing._id)){
                    setIsLiked(true);
                }
                else setIsLiked(false);

                const currentTimestamp = Date.now()
                const bids = userData.bids  
                const matchingBids = bids.filter(bid => bid.listingId === listing._id)
                console.log(matchingBids, currentTimestamp)

                if (matchingBids.length > 0) {
                    matchingBids.forEach(bid => {
                        //check if the timestamp of the bids inside matchingbids is 3 days older than the current bid
                        //259200000 = 3 days //(10*60*1000) = 10 minutes
                        console.log(bid.timestamp + 259200000, currentTimestamp)
                        if (bid.timestamp + 259200000 >= currentTimestamp) {
                            setAllowedToBid(false)
                        } else setAllowedToBid(true)
        
                    })
                } else setAllowedToBid(true)

            });

            return () => unsubscribe()
        
        }, [allowedToBid, isLiked]);
    }

    // useLayoutEffect(() => {
    //     fetchListing(listingId)
    // }, [listingId]);

    // const fetchListing = async (listingId) => {
    //     const listingDocRef = doc(db, 'listings', listingId)
    //     const listingDocSnapshot = await getDoc(listingDocRef)
    //     const listingData = listingDocSnapshot.data()
    //     const listingReformat = {
    //         _id: listingData.id,
    //         title: listingData.advertTitle,
    //         userId: listingData.userID,
    //         location: {
    //             latitude: listingData.pos.coords.latitude,
    //             longitude: listingData.pos.coords.longitude,
    //         },
    //         condition: listingData.bike.bikeCondition,
    //         price: listingData.price,
    //         views: listingData.views.length,
    //         likes: listingData.likes,
    //         brand: listingData.bike.bikeBrand,
    //         model: listingData.bike.bikeModel,
    //         type: listingData.bike.bikeType,
    //         gears: listingData.bike.bikeNumberOfGears,
    //         description: listingData.description,
    //         images: listingData.images,
    //     }
    //     console.log('listingReformat'+ listingReformat.views)
    //     setListing(listingReformat)
    // }

    

    useEffect(() => {
        const fetchViews = async (listingId) => {
            const listingDocRef = doc(db, 'listings', listingId)
            const profileCollectionRef = collection(db, 'Profile')
            const sellerDocRef = doc(profileCollectionRef, listing.userId)
            const listingDocSnapshot = await getDoc(listingDocRef)
            const sellerDocSnapshot = await getDoc(sellerDocRef)
            const views = listingDocSnapshot.data().views
            const likes = listingDocSnapshot.data().likes
            const rating = sellerDocSnapshot.data().Stars
            setRating(rating)
            setViewAmount(views.length)
            setLikeAmount(likes)
        }
        fetchViews(listing._id)
    }, []);

    const handleLikepress = async () => {
        if(isLiked){
            setIsLiked(false);
            updateDoc(doc(db, 'users', auth.currentUser.uid), {
                favourites: arrayRemove(listing._id)
            }),
            updateDoc(doc(db, 'listings', listing._id), {
                likes: increment(-1)
            }) 
            setLikeAmount(listing.likes - 1)
            
            
        } else{
            setIsLiked(true);
            updateDoc(doc(db, 'users', auth.currentUser.uid), {
                favourites: arrayUnion(listing._id)
            }),
            updateDoc(doc(db, 'listings', listing._id), {
                likes: increment(1)
            }) 
            setLikeAmount(listing.likes + 1)
            
        }
    
    };

    
    const initiateOfferChat = async (navigation, user1, user2, offer) => {
        const chatId = user1 > user2 ? user1 + user2 : user2 + user1;
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDocSnapshot = await getDoc(chatDocRef);
        const updatedUserChats = async user => {
          //add new chat to user chats array in case there is no chat yet
          const userDocRef = doc(db, 'users', user);
          await updateDoc(userDocRef, {
            chats: arrayUnion(chatId),
          });
        };
        if (!chatDocSnapshot.exists()) {
          await updatedUserChats(user1);
          await updatedUserChats(user2);
          await setDoc(chatDocRef, {messages: [], participants: [user1, user2]});
        }
      
        navigation.navigate('ChatUser', {chatId: chatId, offer: offer});
      };


    const handleOfferPress = (offer) => {
        const numericOffer = Number(offer)
        const newId = uuid.v4()
        const userBid = {
            sellerId: listing.userId,
            offerId: newId,
            listingId: listing._id,
            bid: numericOffer,
            timestamp: Date.now(),
        }

        updateDoc(doc(db, 'users', auth.currentUser.uid), {
            bids: arrayUnion(userBid),
        })

        const offerObject = {
            offerId: newId,
            bidderId: auth.currentUser.uid,
            sellerId: listing.userId,
            listingId: listing._id,
            bid: numericOffer,
            timestamp: Date.now(),
            listingTitle: listing.title,
            accepted: false,
        }
        updateDoc(doc(db, 'listings', listing._id), {
            'offer.currentOffers': arrayUnion(offerObject),
            
        })

        initiateOfferChat(navigation, auth.currentUser.uid, listing.userId, offerObject)
        setModalVisible(false) 
        setAllowedToBid(false)
    };


    useEffect(() => {
        const validateAcceptsOffer = async (listingId) => {
            const listingDocRef = doc(db, 'listings', listingId)
            const listingDocSnapshot = await getDoc(listingDocRef)
            const offersAccepted = listingDocSnapshot.data().offer.accepted 
            setAcceptsOffers(offersAccepted)
        }

        validateAcceptsOffer(listing._id)
    }, []);
    


    // const checkTimestamp = async (userBid) => {
    //     const querySnapshot =  await getDoc(doc(db, 'users', auth.currentUser.uid))
    //     const bids = querySnapshot.data().bids    
    //     const matchingBids = bids.filter(bid => bid.listingId === userBid.listingId)
    //     console.log(matchingBids)
    //     if (matchingBids.length > 0) {
    //         matchingBids.forEach(bid => {
    //             //check if the timestamp of the bids inside matchingbids is 3 days older than the current bid
    //             //259200000 = 3 days //(10*60*1000) = 10 minutes
    //             if (bid.timestamp + 259200000 <= userBid.timestamp) {
    //                 return true
    //             } else return false

    //         })
    //     } else return false
    // }


    return (
        <>
         <Modal
            animationType="slide"
            visible={modalVisibleAuth}
            onRequestClose={() => {
                setModalVisible(!modalVisibleAuth);
            }}
            presentationStyle="overFullScreen">
            <Pressable onPress={() => setModalVisibleAuth(!modalVisibleAuth)}>
                <Text style={styles.Close}>x</Text>
            </Pressable>
            <Login />
            <Signup />
        </Modal>

        <Modal
            animationType="slide"
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(!modalVisible);
            }}
            presentationStyle="overFullScreen"
        >
            <Pressable onPress={() => setModalVisible(!modalVisible)}>
                <Text style={styles.Close}>x</Text>
            </Pressable>
            <Text>Place your offer!</Text>
            <Input
                value={offer}
                placeholder="Enter your offer"
                keyboardType="numeric"
                onChangeText={(offer) => {
                    const numericOffer = Number(offer)
                    if (numericOffer >= listing.offer.minimumOffer) {
                        setOffer(offer)
                        setOfferError(false)
                    } else {
                        setOffer(offer)
                        setOfferError(true)
                    }
                }} 
                style={{
                    borderRadius: 5, 
                    height: 40, 
                    borderColor: offerError ? '#FF0060' : 'gray', 
                    borderWidth: 1, 
                    borderRadius: 5}}
            />
            {offerError && <Text style={{color:'#FF0060'}}>
                The Seller requests a minimum offer price of {listing.offer.minimumOffer}€
            </Text>}
            <Button
                title="Place Offer"
                onPress={() => {
                    handleOfferPress(offer) 
                    }}
                style={{borderRadius: 5, height: 40, borderColor: 'gray', borderWidth: 1, borderRadius: 5, }}
                disabled={offerError}
            />

        </Modal>
        <ScrollView style={{ flex: 1 }}>
        <View style={styles.container}>
            <ScrollView horizontal style={styles.imageContainer}>
                {listing.images && listing.images.length? 
                    (listing.images.map((image, index) => {
                        return (
                        <Image
                            key={index}
                            src={image}
                            style={styles.image}
                            resizeMode={'center'}
                        />)
                        })) : 
                    (<Image
                        key={listing._id}
                        source={require("../assets/no-image.png")}
                        style={{marginHorizontal: 80, width: 200, height: 200, borderRadius: 10}}
                        resizeMode={'cover'} 
                    />)
                }
            </ScrollView>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{listing.title}</Text>
            </View>
            <View style={styles.iconPriceContainer}>
            <View style={styles.priceContainer}>
                <Text style={[styles.label,{fontSize: 18,color: '#990000'}]}>Price:</Text>
                <Text style={[styles.value,{marginBottom: 5, fontSize: 20,color: '#990000'}]}>{listing.price + " $"}</Text>
            </View>
            <View style={styles.iconContainer}>
                    <View style={styles.iconWrapper}>
                        <Pressable onPress={auth.currentUser? handleLikepress: ()=>setModalVisibleAuth(true)}>
                        <Icon
                            name={isLiked? 'heart' : 'heart-outline'}
                            style={[styles.heart, { width: 30, height: 30 }]}
                            fill={isLiked? '#fb6376': '#333333'}
                        />
                        </Pressable>
                        <Text style={styles.iconLabel}>{likeAmount}</Text>
                    </View>
                    <View style={styles.iconWrapper}>
                        <Icon
                            name={'eye'}
                            style={[styles.eye, { width: 30, height: 30 }]}
                            fill={'black'}
                        />
                        <Text style={styles.iconLabel}>{viewAmount}</Text>
                    </View>
                </View>
            
        </View>
        <View style={styles.detailsContainer}>
            <View style={styles.row}>
            <View style={styles.detailItem}>
                <Text style={styles.label}>Type:</Text>
                <Text style={styles.value}>{listing.type}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>Condition:</Text>
                <Text style={styles.value}>{listing.condition}</Text>
            </View>
            </View>
            <View style={styles.row}>
            <View style={styles.detailItem}>
                <Text style={styles.label}>Model:</Text>
                <Text style={styles.value}>{listing.model}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>Gears:</Text>
                <Text style={styles.value}>{listing.gears}</Text>
            </View>
            </View>
            <View style={styles.row}>
                <View style={styles.detailItem}>
                    <Text style={styles.label}>User Rating:</Text>
                    <StarRating rating={rating}/>
                </View>
            </View>
            
        </View>
        <View>
        <View style={styles.descriptionContainer}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{listing.description}</Text>
        </View>
      </View>
        <View>
        {auth.currentUser && 
            <Button 
                title="Contact Seller" 
                onPress={() => 
                    initiateChat(navigation, auth.currentUser.uid, listing.userId)
                }
            /> 
        }
        </View>
            <View style={{marginTop: 10}}>
            {auth.currentUser && acceptsOffers &&
                <Button 
                    title="Make an Offer"
                    onPress={() => {
                        if (allowedToBid) {
                            setModalVisible(true)
                        } else {
                            Alert.alert('You have already placed an offer on this listing.', 
                                        'You can only place one offer every 3 days.')
                        }
                    }}
                />
            }
            </View>
        </View>
        </ScrollView>
        </>
    );
}
const styles = StyleSheet.create({
    imageContainer: {
        marginVertical: 10,
        flexDirection: 'row',
    },    
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: '#FFFFFF',
    },
    image: {
        marginHorizontal: 4,
        width: 200,
        height: 200,
        borderRadius: 10,
      },
    
    detailsContainer: {
        backgroundColor: '#E8E8E8',
        borderRadius: 10,
        padding: 16,
    },
    descriptionContainer: {
        backgroundColor: '#E8E8E8',
        borderRadius: 10,
        padding: 16,
        marginTop: 10,
        marginBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    titleContainer: {
        backgroundColor: '#E8E8E8',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
      },
    description: {
        fontSize: 16,
        marginBottom: 8,
    },
    price: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#FF0000',
        marginBottom: 8,
    },
    brand: {
        fontSize: 16,
        marginBottom: 8,
    },
    type: {
        fontSize: 16,
        marginBottom: 8,
    },
    gears: {
        fontSize: 16,
        marginBottom: 8,
      },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flex: 1,
        marginRight: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    value: {
    fontSize: 16,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrapper: {
        marginLeft: 16,
        alignItems: 'center',
        marginRight: 16,
    },
    iconLabel: {
        marginTop: 4,
        marginRight: 16,
    },
    iconPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: '#E8E8E8',
        borderRadius: 10,
        padding: 10,
      },
      
      priceContainer: {
        borderRadius: 10,
        flex: 1,
        marginLeft: 20,
      },
       
      iconLabel: {
        marginTop: 4,
      },
});

