import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import VideoPlayer from "./components/VideoPlayer";
import VideoPlayList from "./components/VideoPlayList";

export default function App() {
  return <VideoPlayList />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
