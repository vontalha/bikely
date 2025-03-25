import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import {
  Button,
  Icon,
  IconRegistry,
  IndexPath,
  Input,
  Layout,
  Select,
  SelectItem,
  Text,
  Toggle,
} from '@ui-kitten/components';
import Geolocation from '@react-native-community/geolocation';
import {addDoc, collection, getDocs} from 'firebase/firestore';
import {auth, db, storage} from '../config/Firebase';
import moment from 'moment';
import RequestLocationPermission from '../components/Location';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {getDownloadURL, ref, uploadBytesResumable} from 'firebase/storage';
import {onAuthStateChanged} from 'firebase/auth';

const renderOption = title => <SelectItem key={title} title={title} />;

function getSelectValue(selectedIndex, options) {
  return options[selectedIndex.row];
}

export default function Sell() {
  const [advertTitle, setAdvertTitle] = useState('');
  const [bikeTypes, setBikeTypes] = useState([]);
  const [bikeBrands, setBikeBrands] = useState([]);
  const [currentBrandModels, setCurrentBrandModels] = useState([]);
  const [bikeConditions, setBikeConditions] = useState([]);
  const [bikeNumberOfGears, setBikeNumberOfGears] = useState('');
  const [bikePrice, setBikePrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageResults, setImageResults] = useState([]);
  const [minimumOffer, setMinimumOffer] = useState('');
  const [toggleChecked, setToggleChecked] = useState(false);

  const [selectedBikeTypeIndex, setSelectedBikeTypeIndex] = useState(
    new IndexPath(0),
  );
  const [selectedBikeBrandIndex, setSelectedBikeBrandIndex] = useState(
    new IndexPath(0),
  );
  const [selectedBikeModelIndex, setSelectedBikeModelIndex] = useState(
    new IndexPath(0),
  );
  const [selectedBikeConditionIndex, setSelectedBikeConditionIndex] = useState(
    new IndexPath(0),
  );

  const [selectedBikeType, setSelectedBikeType] = useState('');
  const [selectedBikeBrand, setSelectedBikeBrand] = useState('');
  const [selectedBikeModel, setSelectedBikeModel] = useState('');
  const [selectedBikeCondition, setSelectedBikeCondition] = useState('');

  const takePicture = async () => {
    const options = {mediaType: 'photo', cameraType: 'back'};

    let result = await launchCamera(options);
    if (!result.didCancel) {
      setImageResults([...imageResults, result]);
    }
  };

  const selectPicture = async () => {
    const options = {mediaType: 'photo'};

    let result = await launchImageLibrary(options);
    if (!result.didCancel) {
      setImageResults([...imageResults, result]);
    }
  };

  const uploadMediaToFirestore = async (res, type) => {
    const uri = res.assets[0].uri;
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
    const fileRef = ref(storage, filename);
    const img = await fetch(uploadUri);
    const bytes = await img.blob();
    let metadata;

    if (type === 'video') {
      metadata = {
        contentType: 'video/mp4',
      };
    } else {
      metadata = {
        contentType: 'image/jpeg',
      };
    }

    const uploadT = uploadBytesResumable(fileRef, bytes, metadata);

    return new Promise((resolve, reject) => {
      uploadT.on(
        'state_changed',
        snapshot => {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        () => {
          // Handle unsuccessful uploads
          reject();
        },
        () => {
          // Handle successful uploads on complete
          // For instance, get the download URL: https://firebasestorage.googleapis.com/...
          getDownloadURL(uploadT.snapshot.ref).then(downloadURL => {
            console.log('File available at', downloadURL);
            resolve(downloadURL);
          });
        },
      );
    });
  };

  const checkInputs = () => {
    return (
      advertTitle.length > 0 &&
      selectedBikeType.length > 0 &&
      selectedBikeBrand.length > 0 &&
      selectedBikeModel.length > 0 &&
      selectedBikeCondition.length > 0 &&
      bikeNumberOfGears.length > 0 &&
      bikePrice.length > 0 &&
      description.length > 0 &&
      (!toggleChecked || minimumOffer.length > 0)
    );
  };

  const resetInputs = () => {
    setImageResults([]);
    setAdvertTitle('');
    setSelectedBikeType('');
    setSelectedBikeBrand('');
    setSelectedBikeModel('');
    setSelectedBikeCondition('');
    setBikeNumberOfGears('');
    setBikePrice('');
    setMinimumOffer('');
    setToggleChecked(false);
    setDescription('');
  };

  function addBike() {
    if (!checkInputs()) {
      Alert.alert('Missing inputs!', 'Please fill out every input field!', [
        {text: 'OK', onPress: () => console.log('OK Pressed')},
      ]);

      return;
    }

    RequestLocationPermission().then(() => {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(response => {
        if (response === true) {
          Geolocation.getCurrentPosition(async position => {
            const promises = imageResults.map(async imageRes => {
              return await uploadMediaToFirestore(imageRes, 'image');
            });

            Promise.all(promises).then(async downloadURLs => {
              const images = downloadURLs.map(downloadURL => downloadURL);

              let date = moment().format('MMMM Do YYYY, h:mm:ss a');

              let bike = {
                bikeType: getSelectValue(selectedBikeTypeIndex, bikeTypes),
                bikeBrand: getSelectValue(selectedBikeBrandIndex, bikeBrands),
                bikeModel: getSelectValue(
                  selectedBikeModelIndex,
                  currentBrandModels,
                ),
                bikeCondition: getSelectValue(
                  selectedBikeConditionIndex,
                  bikeConditions,
                ),
                bikeNumberOfGears: bikeNumberOfGears,
              };

              const numericOffer = Number(minimumOffer);

              await addDoc(collection(db, 'listings'), {
                advertTitle: advertTitle,
                bike,
                price: bikePrice,
                description: description,
                images: images,
                date: date,
                pos: position,
                views: [],
                likes: 0,
                userID: auth.currentUser.uid,
                offer: {
                  accepted: toggleChecked,
                  currentOffers: [],
                  minimumOffer: numericOffer,
                },
              })
                .then(() => {
                  resetInputs();
                  ToastAndroid.show(
                    'Bike added successfully!',
                    ToastAndroid.LONG,
                  );
                })
                .catch(error => {
                  console.error('Error adding document: ', error);
                  ToastAndroid.show(
                    'Failed to add bike advert!',
                    ToastAndroid.LONG,
                  );
                });
            });
          });
        } else {
          Alert.alert(
            'Missing permission',
            'Please allow the app to use your location!',
            [{text: 'OK', onPress: () => console.log('OK Pressed')}],
          );
        }
      });
    });
  }

  const loadData = async () => {
    const newBikeTypes = [];
    const newBikeBrands = [];
    const newBikeCondition = [];

    const querySnapshotBikeTypes = await getDocs(collection(db, 'bikeTypes'));
    querySnapshotBikeTypes.forEach(doc => {
      newBikeTypes.push(doc.id);
    });

    const querySnapshotBikeBrands = await getDocs(collection(db, 'bikeBrands'));
    for (const doc of querySnapshotBikeBrands.docs) {
      const bikeBrand = {
        id: '',
        models: [],
      };

      bikeBrand.id = doc.id;

      const querySnapshotBikeModels = await getDocs(
        collection(db, 'bikeBrands/' + doc.id + '/models'),
      );

      for (const modelDoc of querySnapshotBikeModels.docs) {
        bikeBrand.models.push(modelDoc.id);
      }

      newBikeBrands.push(bikeBrand);
    }

    const querySnapshotBikeCondition = await getDocs(
      collection(db, 'bikeConditions'),
    );
    querySnapshotBikeCondition.forEach(doc => {
      newBikeCondition.push(doc.id);
    });

    setBikeTypes(newBikeTypes);
    setBikeBrands(newBikeBrands);
    setBikeConditions(newBikeCondition);
  };

  useEffect(() => {
    loadData().then();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        // User is signed in
        // Perform actions for signed-in user
        console.log('User is signed in:', user);
      } else {
        // User is signed out
        // Perform actions for signed-out user
        console.log('User is signed out');
        resetInputs();
      }
    });

    // Clean up the event listener when the component is unmounted
    return () => unsubscribe();
  }, []);

  const CameraIcon = <Icon name="camera-outline" />;
  const FolderIcon = <Icon name="folder-outline" />;

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />

      <ScrollView>
        <Layout style={styles.container} level="2">
          <View style={styles.row}>
            <Text style={styles.text} category="h5">
              SELL YOUR BIKE!
            </Text>
          </View>

          <View style={styles.section}>
            <Layout style={styles.container} level="2">
              <ScrollView horizontal style={styles.imageContainer}>
                {imageResults.map((image, index) => {
                  const source = {uri: image.assets[0].uri};

                  return (
                    <Image
                      key={index}
                      source={source}
                      style={styles.image}
                      resizeMode={'cover'}
                    />
                  );
                })}
              </ScrollView>
            </Layout>
            <View style={styles.pickerView}>
              <Layout level="2">
                <Button
                  style={styles.pickerButtonContainer}
                  appearance="ghost"
                  accessoryLeft={CameraIcon}
                  onPress={takePicture}
                />
              </Layout>
              <Layout level="2">
                <Button
                  style={styles.pickerButtonContainer}
                  appearance="ghost"
                  accessoryLeft={FolderIcon}
                  onPress={selectPicture}
                />
              </Layout>
            </View>
          </View>

          <View style={styles.section}>
            <Input
              style={styles.input}
              label={'ADVERT TITLE'}
              placeholder="Advert title"
              value={advertTitle}
              maxLength={40}
              onChangeText={nextValue => setAdvertTitle(nextValue)}
            />
          </View>

          <View style={styles.section}>
            <Select
              style={styles.input}
              label={'BIKE TYPE'}
              placeholder="Select your bike type"
              value={selectedBikeType}
              onSelect={index => {
                setSelectedBikeTypeIndex(index);
                setSelectedBikeType(getSelectValue(index, bikeTypes));
              }}>
              {bikeTypes.map(renderOption)}
            </Select>
          </View>

          <View style={styles.section}>
            <Select
              style={styles.input}
              label={'BIKE BRAND'}
              placeholder="Select your bike brand"
              value={selectedBikeBrand}
              onSelect={index => {
                setSelectedBikeBrandIndex(index);

                const selectedValue = getSelectValue(index, bikeBrands).id;
                const bikeModels = bikeBrands.find(
                  item => item.id === selectedValue,
                ).models;

                setCurrentBrandModels(bikeModels);
                setSelectedBikeBrand(selectedValue);
              }}>
              {bikeBrands.map(bikeBrand => renderOption(bikeBrand.id))}
            </Select>
          </View>

          <View style={styles.section}>
            <Select
              style={styles.input}
              label={'BIKE MODEL'}
              placeholder="Select your bike model"
              value={selectedBikeModel}
              onSelect={index => {
                setSelectedBikeModelIndex(index);
                setSelectedBikeModel(getSelectValue(index, currentBrandModels));
              }}>
              {currentBrandModels.map(renderOption)}
            </Select>
          </View>

          <View style={styles.section}>
            <Select
              style={styles.input}
              label={'BIKE CONDITION'}
              placeholder="Select your bike's condition"
              value={selectedBikeCondition}
              onSelect={index => {
                setSelectedBikeConditionIndex(index);
                setSelectedBikeCondition(getSelectValue(index, bikeConditions));
              }}>
              {bikeConditions.map(renderOption)}
            </Select>
          </View>

          <View style={styles.section}>
            <Input
              style={styles.input}
              label={'NUMBER OF GEARS'}
              placeholder="Number of gears"
              value={bikeNumberOfGears}
              maxLength={2}
              onChangeText={nextValue => setBikeNumberOfGears(nextValue)}
            />
          </View>

          <View style={styles.section}>
            <Input
              style={styles.input}
              label={'BIKE PRICE'}
              placeholder="Price"
              value={bikePrice}
              maxLength={6}
              onChangeText={nextValue => setBikePrice(nextValue)}
            />
          </View>

          <View style={styles.minimumOfferContainer}>
            <Input
              style={styles.minimumOffer}
              label={'MINIMUM OFFER'}
              placeholder="$"
              value={minimumOffer.toString()}
              onChange={event => {
                setMinimumOffer(event.nativeEvent.text);
              }}
              keyboardType="numeric"
              disabled={!toggleChecked}
            />
            <Toggle
              style={styles.toggle}
              checked={toggleChecked}
              onChange={nextChecked => setToggleChecked(nextChecked)}>
              Accept Offers
            </Toggle>
          </View>

          <View style={styles.section}>
            <Input
              style={styles.inputMultiLine}
              label={'DESCRIPTION'}
              multiline={true}
              placeholder="Description"
              value={description}
              maxLength={1000}
              onChangeText={nextValue => setDescription(nextValue)}
            />
          </View>

          <Layout style={styles.buttonContainer} level="2">
            <Button appearance="filled" onPress={addBike}>
              ADD BIKE
            </Button>
          </Layout>
        </Layout>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 20,
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    margin: 20,
  },
  pickerButtonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    margin: 4,
  },
  pickerView: {
    flexDirection: 'row',
    alignSelf: 'center',
    margin: 8,
  },
  text: {
    margin: 4,
    marginHorizontal: 8,
  },
  caption: {
    marginHorizontal: 20,
  },
  input: {
    marginHorizontal: 20,
    marginVertical: 8,
  },
  inputMultiLine: {
    marginHorizontal: 20,
    marginVertical: 8,
    minHeight: 64,
  },
  image: {
    marginHorizontal: 4,
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  imageContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
  },
  minimumOffer: {
    marginVertical: 8,
    marginRight: 75,
  },
  minimumOfferContainer: {
    marginHorizontal: 20,
    marginVertical: 8,
    flexDirection: 'row',
  },
  toggle: {
    marginHorizontal: 20,
    marginVertical: 8,
    marginTop: 25,
  },
});
