import {
    Alert,
    Image,
    PermissionsAndroid,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    Text,
    FlatList,
    TextInput,
    Permissions,
    SafeAreaView,
  } from 'react-native';
import React, {useEffect, useState} from 'react';

import {addDoc, collection, getDocs} from 'firebase/firestore';
import {auth, db, storage} from '../config/Firebase';
import { InstantSearch } from 'react-instantsearch-hooks';
import { SearchBox } from '../components/SearchBox';
import { InfiniteHits } from '../components/InfiniteHits';
// import {index, searchClient} from '../config/Algolia';
import FontAwesomeIcon  from 'react-native-vector-icons/FontAwesome';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import algoliasearch from 'algoliasearch/lite';
import Geolocation from '@react-native-community/geolocation';
import SearchCard from '../components/SearchCard';
export const searchClient = algoliasearch('D4TZ2FURAO', '1278f3eb519f1a21759a95faba372b26')
export const index = searchClient.initIndex('listings');

export default function Search({navigation, route}) {
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    // const [locationData, setLocationData] = React.useState(null);

    const {location} = route.params || null;
    const {results} = route.params || null;
    console.log("results: "+results);
    console.log("location: "+location);
    useEffect(() => {
      if (results !== null || results !== undefined) {
        setSearchResults(results);
      }
    }, [results]);
    
    // function Hit({ hit }) {
    //   //console.log(hit.name);
    //   return (

    //     <Text>{[hit.bike.bikeType, hit.advertTitle]}</Text>
    //   );
    // }

    const renderSearchResults = () => {
      return (
        <View style={styles.resultContainer}>
          <FlatList
            scrollEnabled={false}

            data={searchResults}
            // renderItem={({item}) => (
            //   <View style={{marginTop:15}}>
            //     <SearchCard listing={item} navigation={navigation} locationData={location}/>
            //   </View>
            // )}

            renderItem={({item, index}) => (
              item !== undefined && 
              location !== null &&
              <View style={{marginTop:13, justifyContent:'center'}}>
                <SearchCard listing={item} navigation={navigation} locationData={location}/>
              </View>
            )}
          />
        </View>
      );
      
    }

    const handleSearchQuery = () => {
      console.log(searchQuery);
        index.search(searchQuery,{
          
          attributesToRetrieve : [
            'advertTitle', 
            'bike.bikeCondition',
            'bike.bikeType', 
            'bike.bikeBrand.id',
            'bike.bikeModel', 
            'bike.bikeNumberOfGears', 
            'description', 
            'price',
            'pos.coords',
            'images',
            'objectID',
            'likes',
            'views',
          ],
        }).then(({ hits }) => {
            console.log(hits);
            setSearchResults(hits);
          }
        ).catch(err => console.log(err));  
    }
    
    return(
       <SafeAreaView style={{flex:1}}>
        <View style={styles.searchContainter}>
          <TextInput
            value={searchQuery}
            style={styles.searchBox}
            placeholder="Search"
            clearButtonMode='while-editing'
            autoCapitalize='none'
            autoCorrect={false}
            onSubmitEditing={handleSearchQuery}
          
            onChangeText={(text) => setSearchQuery(text)}
          />
          <ScrollView style={{marginTop:10}}>
            
            {renderSearchResults()}
           
          </ScrollView>
          <FontAwesomeIcon
            name="search"
            color="#3C486B"
            size={18}
            style={{left: 40, top: 15, position: 'absolute' }}
            onPress={handleSearchQuery}
          />
          <IoniconsIcon
                name="options"
                color="#3C486B"
                size={30}
                style={{right: 20, top: 10, position: 'absolute'  }}
          />
        </View>
       </SafeAreaView>
    )
}

const styles = StyleSheet.create({
  resultContainer: {
    backgroundColor: '#F1F6F9',
  },

  searchContainter: {
    marginTop: 20,

  }, 
  searchBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#fff',
    marginRight: 60,
    marginLeft: 20,
    paddingLeft: 50,
    flexDirection: 'row',
    fontSize: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
})