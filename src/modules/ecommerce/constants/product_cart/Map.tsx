import React from 'react'
import { View, Image, StyleSheet, Dimensions } from 'react-native'
import MapView from '../../../../assets/sampleImages/map.png'

const { width } = Dimensions.get('window')

function Map() {
  return (
    <View style={styles.container}>
      <Image 
        source={MapView} 
        style={styles.mapImage}
        resizeMode="contain"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  mapImage: {
    width: width - 32,
    height: 200,
    resizeMode: 'contain',
  },
})

export default Map