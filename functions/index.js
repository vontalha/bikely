
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();


exports.acceptedOffer = functions
  .firestore.document('users/{userId}')
  .onUpdate(async (change, context) => {

  functions.logger.log('triggered_by:', context.auth);

  const previousValue = change.before.data();
  const newValue = change.after.data();

  if(newValue.offers.length > previousValue.offers.length){

    const fcmToken = newValue.fcmToken;
    const offer = newValue.offers[newValue.offers.length - 1];

    const bidderDocRef = admin.firestore().collection('users').doc(offer.bidderId);
    const bidderDocSnapshot = await bidderDocRef.get();
    const bidderName = bidderDocSnapshot.data().userName;

    const delayInMilliseconds = 1000 * 60 * 1; //1 minute, normally 3 days

    setTimeout(async () => {
      const message = {
        token: fcmToken,
        notification: {
          title: 'This is your Chance to rate, ' + bidderName, // change message to u can now rate a user
          body: 'Please inform us and other users about your trade experience, by rating ' + bidderName + '.',
        },
        data: {
          type: 'acceptedOffer',
          bidderId: offer.bidderId,
          bidderName: bidderName,
        },
      };
      const userDocRef = admin.firestore().collection('users').doc(newValue.uid);
      const notifObj = {
        type: 'acceptedOffer',
        bidderId: offer.bidderId,
        timestamp: admin.firestore.Timestamp.now()
      }
      await userDocRef.update({
        notifications: admin.firestore.FieldValue.arrayUnion(notifObj)
      });

      const response = await admin.messaging().send(message);
      functions.logger.log('Successfully sent message:', response);

    }, delayInMilliseconds);
  }
});

exports.trackLikes = functions
  .firestore.document('listings/{listingId}')
  .onUpdate(async (change, context) => {
    const previousValue = change.before.data();
    const newValue = change.after.data();

    if(newValue.likes === 2 && previousValue.likes === 1){

      const userDocRef = admin.firestore().collection('users').doc(newValue.userID)
      const userDocSnapshot = await userDocRef.get();

      const fcmToken = userDocSnapshot.data().fcmToken;

      functions.logger.log('fcmToken:', fcmToken);

      const message = {
        token: fcmToken,
        notification: {
          title: 'Your listing is popular',
          body: 'Your Listing, '+ newValue.advertTitle +' is gaining traction. Check it out!',
        },
        data: {
          type: 'trackLikes',
          listingId: context.params.listingId
        },
      };
      const notifObj = {
        type: 'trackLikes',
        listingId: context.params.listingId,
        timestamp: admin.firestore.Timestamp.now()
      }
      await userDocRef.update({
        notifications: admin.firestore.FieldValue.arrayUnion(notifObj)
      });
      const response = await admin.messaging().send(message);
      functions.logger.log('Successfully sent message:', response);
    }
});

exports.trackOffers = functions
  .firestore.document('listings/{listingId}')
  .onUpdate(async (change, context) => {
    const previousValue = change.before.data();
    const newValue = change.after.data();

    if(newValue.offer.currentOffers.length > previousValue.offer.currentOffers.length){

      const userDocRef = admin.firestore().collection('users').doc(newValue.userID);
      const userDocSnapshot = await userDocRef.get();

      const fcmToken = userDocSnapshot.data().fcmToken;
      const offer = newValue.offer.currentOffers[newValue.offer.currentOffers.length - 1];

      const chatId = newValue.userID > offer.bidderId ? 
        newValue.userID + offer.bidderId : 
        offer.bidderId + newValue.userID;


      const message = {
        token: fcmToken,
        notification: {
          title: 'New Offer',
          body: 'You received a new offer for your listing ' + newValue.advertTitle + '. Check it out!',
        },
        data: {
          type: 'newOffer',
          bidderId: offer.bidderId,
          listingName: newValue.advertTitle,
        },
      };
      const notifObj = {
        type: 'newOffer',
        bidderId: offer.bidderId,
        chatId: chatId,
        timestamp: admin.firestore.Timestamp.now()
      }
      await userDocRef.update({
        notifications: admin.firestore.FieldValue.arrayUnion(notifObj)
      });

      const response = await admin.messaging().send(message);
      functions.logger.log('Successfully sent message:', response);
  }
});

exports.newChat = functions
  .firestore.document('chats/{chatId}')
  .onUpdate(async (change, context) => {
    const oldValue = change.before.data();
    const newValue = change.after.data();

    if(newValue.messages.length === 1 && oldValue.messages.length === 0){
      const initiatorMessage = newValue.messages[0];
      const senderId = initiatorMessage.user._id;

      if(!('offer' in initiatorMessage)){

        let receiverId = ''

        if (newValue.participants[0] === senderId) {
          receiverId = newValue.participants[1];
        } else receiverId = newValue.participants[0];

        const userCollectionRef = admin.firestore().collection('users');
        const receiverDocRef = userCollectionRef.doc(receiverId);
        const receiverDocSnapshot = await receiverDocRef.get();

        const senderDocRef = userCollectionRef.doc(senderId);
        const senderDocSnapshot = await senderDocRef.get();
        const senderDocData = senderDocSnapshot.data();

        const fcmToken = receiverDocSnapshot.data().fcmToken;

        const message = {
          token: fcmToken,
          notification: {
            title: 'New Message',
            body: senderDocData.userName + ', began a new chat with you. Check it out!',
          },
          data: {
            type: 'newChat',
            senderName: senderDocData.userName,
          },
        };
          const notifObj = {
            type: 'newChat',
            chatId: context.params.chatId,
            timestamp: admin.firestore.Timestamp.now()
          }
          await receiverDocRef.update({
            notifications: admin.firestore.FieldValue.arrayUnion(notifObj)
          });

        const response = await admin.messaging().send(message);
        functions.logger.log('Successfully sent message:', response);
      }
    }
  });

exports.newMessage = functions
  .firestore.document('chats/{chatId}')
  .onUpdate(async (change, context) => {
    const oldValue = change.before.data();
    const newValue = change.after.data();

    if(newValue.messages.length > oldValue.messages.length && 
        newValue.messages.length > 1){

      const newMessage = newValue.messages[newValue.messages.length - 1];
      const senderId = newMessage.user._id;

      if(!('offer' in newMessage)){

        let receiverId = ''

        if (newValue.participants[0] === senderId) {
          receiverId = newValue.participants[1];
        } else receiverId = newValue.participants[0];

        const userCollectionRef = admin.firestore().collection('users');
        const receiverDocRef = userCollectionRef.doc(receiverId);
        const receiverDocSnapshot = await receiverDocRef.get();

        const senderDocRef = userCollectionRef.doc(senderId);
        const senderDocSnapshot = await senderDocRef.get();
        const senderDocData = senderDocSnapshot.data();

        const fcmToken = receiverDocSnapshot.data().fcmToken;

        const message = {
          token: fcmToken,
          notification: {
            title: 'New Message!',
            body: senderDocData.userName + ': ' + newMessage.text,
          },
          data: {
            type: 'newMessage',
            senderName: senderDocData.userName,
          },
        };
         
        const response = await admin.messaging().send(message);
        functions.logger.log('Successfully sent message:', response);
      }
    }
  });
