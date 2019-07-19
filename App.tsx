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

const DEFAULT_REPO = "AnandChowdhary/finding-anand";
const DEFAULT_FILE = "location.yml";

export default class App extends React.Component<
  {},
  {
    token: string;
    newToken: string;
    file: string;
    repo: string;
    newRepository: string;
    newFile: string;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      token: "",
      newToken: "",
      file: DEFAULT_FILE,
      repo: DEFAULT_REPO,
      newRepository: "",
      newFile: ""
    };
  }
  async componentDidMount() {
    const token = await AsyncStorage.getItem("token");
    const repo = await AsyncStorage.getItem("repo");
    const file = await AsyncStorage.getItem("file");
    this.setState({
      token,
      repo: repo || DEFAULT_REPO,
      file: file || DEFAULT_FILE,
      newFile: file || DEFAULT_FILE,
      newToken: token,
      newRepository: repo || DEFAULT_REPO
    });
  }
  async track() {
    if (!this.state.token) alert("We couldn't find a GitHub token!");
    if (!this.state.repo) alert("We couldn't find a GitHub repository!");
    if (!this.state.file) alert("We couldn't find a GitHub file!");
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
      `https://api.github.com/repos/${this.state.repo}/contents/${this.state.file}`,
      {
        headers: {
          "User-Agent": "FindingAnand",
          Authorization: `token ${this.state.token}`
        }
      }
    )).json()) as GitHubContents;
    await fetch(
      `https://api.github.com/repos/${this.state.repo}/contents/${this.state.file}`,
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
    this.setState({
      token: this.state.newToken,
      repo: this.state.newRepository,
      file: this.state.newFile
    });
    AsyncStorage.setItem("token", this.state.newToken);
    AsyncStorage.setItem("file", this.state.newFile);
    AsyncStorage.setItem("repo", this.state.newRepository);
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
              title="Edit settings"
              onPress={() =>
                this.setState({ newToken: this.state.token || "", token: "" })
              }
            />
          </View>
        ) : (
          <View>
            <Text style={{ marginBottom: "5%" }}>
              Update your settings below
            </Text>
            <TextInput
              accessibilityLabel="Token"
              placeholder="Token"
              style={styles.input}
              onChangeText={newToken => this.setState({ newToken })}
              value={this.state.newToken}
            />
            <TextInput
              accessibilityLabel="Repository"
              placeholder="Repository"
              style={styles.input}
              onChangeText={newRepository => this.setState({ newRepository })}
              value={this.state.newRepository}
            />
            <TextInput
              accessibilityLabel="File"
              placeholder="File"
              style={styles.input}
              onChangeText={newFile => this.setState({ newFile })}
              value={this.state.newFile}
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
  },
  input: {
    height: 40,
    borderRadius: 2,
    padding: "2% 5%",
    marginBottom: "5%",
    borderColor: "#eee",
    borderWidth: 0.5
  }
});
