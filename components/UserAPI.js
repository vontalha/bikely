import {doc, getDoc} from 'firebase/firestore';
import {db} from '../config/Firebase';

export const getUserData = async userId => {
  try {
    const docRef = doc(db, 'Profile', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log('dref:', userData);
      return userData;
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
