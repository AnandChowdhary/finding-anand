import React from "react";
import {
  AsyncStorage,
  StyleSheet,
  Text,
  Button,
  View,
  TextInput
} from "react-native";
import { encode as btoa } from "base-64";
import * as Location from "expo-location";
import * as Permissions from "expo-permissions";
import * as Constants from "expo-constants";

interface NominatimResult {
  place_id: number;
  licence: string;
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
interface GitHubContents {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  type: "file" | "dir" | "symlink" | "submodule";
  content: string;
  encoding: string;
}

export default class App extends React.Component<
  {},
  { token: string; newToken: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { token: "", newToken: "" };
  }
  async componentDidMount() {
    const token = await AsyncStorage.getItem("token");
    this.setState({ token });
  }
  async track() {
    if (!this.state.token) alert("We couldn't find a GitHub token!");
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
      license: reverseGeocoding.licence,
      longitude: reverseGeocoding.lon,
      ...reverseGeocoding.address,
      deviceId: Constants.default.deviceId,
      deviceName: Constants.default.deviceName,
      deviceYearClass: Constants.default.deviceYearClass,
      systemVersion: Constants.default.systemVersion
    };
    let saveContent = "";
    Object.keys(answer).forEach(key => {
      saveContent += `${key}: ${
        typeof answer[key] === "string"
          ? answer[key].replace("’", "'")
          : answer[key]
      }\n`;
    });
    const currentContents = (await (await fetch(
      `https://api.github.com/repos/AnandChowdhary/finding-anand/contents/location.yml`,
      {
        headers: {
          "User-Agent": "FindingAnand",
          Authorization: `token ${this.state.token}`
        }
      }
    )).json()) as GitHubContents;
    await fetch(
      `https://api.github.com/repos/AnandChowdhary/finding-anand/contents/location.yml`,
      {
        method: "PUT",
        headers: {
          "User-Agent": "FindingAnand",
          Authorization: `token ${this.state.token}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `📍 ${reverseGeocoding.display_name}`,
          content: btoa(saveContent),
          sha: currentContents.sha
        })
      }
    );
    alert("Done!");
  }
  async save() {
    this.setState({ token: this.state.newToken });
    AsyncStorage.setItem("token", this.state.newToken);
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Finding Anand</Text>
        <Text style={styles.text}>Track your current location</Text>
        {!!this.state.token ? (
          <View>
            <Button title="Track" onPress={() => this.track()} />
            <Button
              title="Edit token"
              onPress={() =>
                this.setState({ newToken: this.state.token || "", token: "" })
              }
            />
          </View>
        ) : (
          <View>
            <Text>No token found!</Text>
            <TextInput
              style={{ height: 40, borderColor: "gray", borderWidth: 1 }}
              onChangeText={newToken => this.setState({ newToken })}
              value={this.state.newToken}
            />
            <Button title="Save" onPress={() => this.save()} />
          </View>
        )}
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
