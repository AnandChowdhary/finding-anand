import React from "react";
import {
  AsyncStorage,
  StyleSheet,
  Text,
  Button,
  View,
  TextInput
} from "react-native";
import * as Location from "expo-location";
import * as Permissions from "expo-permissions";

interface NominatimResult {
  place_id: number;
  license: string;
  lat: number;
  lon: number;
  display_name: string;
  address: {
    road: string;
    locality: string;
    state_district: string;
    state: string;
    postcode: string;
    country: string;
    country_code: string;
  };
}
const track = async () => {
  const { status } = await Permissions.askAsync(Permissions.LOCATION);
  if (status !== "granted") alert("We couldn't get location permission!");
  const location = await Location.getCurrentPositionAsync();
  const reverseGeocoding = (await (await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${location.coords.latitude}&lon=${location.coords.longitude}&format=json`
  )).json()) as NominatimResult;
  const answer = {
    altitude: location.coords.altitude,
    accuracy: location.coords.accuracy,
    heading: location.coords.heading,
    speed: location.coords.speed,
    latitude: reverseGeocoding.lat,
    license: reverseGeocoding.license,
    longitude: reverseGeocoding.lon,
    ...reverseGeocoding.address
  };
};

export default class App extends React.Component<{}, { token: string }> {
  constructor(props: any) {
    super(props);
    this.state = { token: "" };
  }
  async componentDidMount() {
    const token = await AsyncStorage.getItem("token");
    this.setState({ token });
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Finding Anand</Text>
        <Text style={styles.text}>Track your current location</Text>
        {!!this.state.token ? (
          <View>
            <Button title="Track" onPress={() => track()} />
          </View>
        ) : (
          <View>
            <Text>No token found!</Text>
          </View>
        )}
        <TextInput
          editable={true}
          onChangeText={text => console.log(text)}
          value=""
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  heading: {
    fontSize: 20,
    marginBottom: "10%"
  },
  text: {
    marginBottom: "10%"
  }
});
