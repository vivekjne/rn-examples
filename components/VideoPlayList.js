import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  SafeAreaView,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Asset } from "expo-asset";
import { Audio, Video } from "expo-av";
import * as Font from "expo-font";
import { useCallbackRef } from "use-callback-ref";

import { MaterialIcons } from "@expo/vector-icons";
import { PLAYLIST } from "./playlist";
import {
  ICON_PLAY_BUTTON,
  ICON_BACK_BUTTON,
  ICON_FORWARD_BUTTON,
  ICON_PAUSE_BUTTON,
  ICON_STOP_BUTTON,
  ICON_MUTED_BUTTON,
  ICON_UNMUTED_BUTTON,
  ICON_THROUGH_EARPIECE,
  ICON_THROUGH_SPEAKER,
  ICON_THUMB_1,
  ICON_THUMB_2,
  ICON_TRACK_1,
} from "./icons";

const LOOPING_TYPE_ALL = 0;
const LOOPING_TYPE_ONE = 1;
const LOOPING_TYPE_ICONS = { 0: "repeat", 1: "repeat-one" };

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const BACKGROUND_COLOR = "#FFF8ED";
const DISABLED_OPACITY = 0.5;
const FONT_SIZE = 14;
const VIDEO_CONTAINER_HEIGHT = (DEVICE_HEIGHT * 2.0) / 5.0 - FONT_SIZE * 2;
const LOADING_STRING = "... loading ...";
const BUFFERING_STRING = "...buffering...";
const RATE_SCALE = 3.0;

export default function VideoPlayList() {
  const index = React.useRef(0);
  const isSeeking = React.useRef(false);
  const shouldPlayAtEndOfSeek = React.useRef(false);

  const playbackInstance = React.useRef(null);

  const [, forceUpdate] = React.useState();
  const _video = useCallbackRef(null, () => forceUpdate());

  const [fontLoaded, setFontLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showVideo, setShowVideo] = React.useState(false);
  const [throughEarpiece, setThroughEarPiece] = React.useState(false);
  const [poster, setPoster] = React.useState(false);

  const [playbackInstanceName, setPlaybackInstanceName] =
    React.useState(LOADING_STRING);
  const [playbackStatus, setPlaybackStatus] = React.useState({
    playbackInstancePosition: null,
    playbackInstanceDuration: null,
    shouldPlay: false,
    isPlaying: false,
    isBuffering: false,
    rate: 1.0,
    muted: false,
    volume: 1.0,
    loopingType: LOOPING_TYPE_ALL,
    shouldCorrectPitch: true,
  });
  const [videoDimensions, setVideoDimensions] = React.useState({
    videoWidth: DEVICE_WIDTH,
    videoHeight: VIDEO_CONTAINER_HEIGHT,
  });
  const [useNativeControls, setUseNativeControls] = React.useState(false);

  React.useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });

    (async () => {
      await Font.loadAsync({
        ...MaterialIcons.font,
        "cutive-mono-regular": require("../assets/fonts/CutiveMono-Regular.ttf"),
      });
      setFontLoaded(true);
    })();
  }, []);

  const _onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackStatus(() => ({
        playbackInstancePosition: status.positionMillis,
        playbackInstanceDuration: status.durationMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        isBuffering: status.isBuffering,
        rate: status.rate,
        muted: status.isMuted,
        volume: status.volume,
        loopingType: status.isLooping ? LOOPING_TYPE_ONE : LOOPING_TYPE_ALL,
        shouldCorrectPitch: status.shouldCorrectPitch,
      }));

      if (status.didJustFinish && !status.isLooping) {
        _advanceIndex(true);
        _updatePlaybackInstanceForIndex(true);
      }
    } else {
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  function _advanceIndex(forward) {
    index.current =
      (index.current + (forward ? 1 : PLAYLIST.length - 1)) % PLAYLIST.length;
  }

  function _updatePlaybackInstanceForIndex(playing) {
    console.log("UPDATE PLAYBACK INSTANCE");
    _updateScreenForLoading(true);

    setVideoDimensions({
      videoWidth: DEVICE_WIDTH,
      videoHeight: VIDEO_CONTAINER_HEIGHT,
    });

    _loadNewPlaybackInstance(playing);
  }

  function _updateScreenForLoading(isLoading) {
    console.log("UPDATE SCREEN LOADING");
    if (isLoading) {
      setPlaybackStatus((previousState) => ({
        ...previousState,
        playbackInstanceDuration: null,
        playbackInstancePosition: null,
        isPlaying: false,
      }));
      setIsLoading(true);
      setShowVideo(false);
    } else {
      setPlaybackInstanceName(PLAYLIST[index.current].name);
      setShowVideo(PLAYLIST[index.current].isVideo);
      setIsLoading(false);
    }
  }

  async function _loadNewPlaybackInstance(playing) {
    if (playbackInstance.current != null) {
      await playbackInstance.current.unloadAsync();
      playbackInstance.current = null;
    }

    const source = { uri: PLAYLIST[index.current].uri };
    const initialStatus = {
      shouldPlay: playing,
      rate: playbackStatus.rate,
      shouldCorrectPitch: playbackStatus.shouldCorrectPitch,
      volume: playbackStatus.volume,
      isMuted: playbackStatus.muted,
      isLooping: playbackStatus.loopingType === LOOPING_TYPE_ONE,
    };

    if (PLAYLIST[index.current].isVideo) {
      console.log(_onPlaybackStatusUpdate);
      await _video.current.loadAsync(source, initialStatus);

      playbackInstance.current = _video.current;
      const status = await _video.current.getStatusAsync();
    } else {
      const { sound, status } = await Audio.Sound.createAsync(
        source,
        initialStatus,
        _onPlaybackStatusUpdate
      );
      playbackInstance.current = sound;
    }
    _updateScreenForLoading(false);
  }

  // function _mountVideo(component) {
  //   _video = component;
  // }

  React.useEffect(() => {
    if (_video.current) {
      _loadNewPlaybackInstance(false);
    }
  }, [_video?.current]);

  function _onloadStart() {
    console.log(`ON LOAD START`);
  }

  const _onLoad = (status) => {
    console.log(`ON LOAD : ${JSON.stringify(status)}`);
  };

  const _onError = (error) => {
    console.log(`ON ERROR : ${error}`);
  };

  const _onFullScreenUpdate = (event) => {
    console.log(
      `FULLSCREEN UPDATE : ${JSON.stringify(event.fullscreenUpdate)}`
    );
  };

  const _onReadyForDisplay = (event) => {
    console.log("EVENT=", event);
    // console.log(event)
    const widestHeight =
      (DEVICE_WIDTH * event.naturalSize.height) / event.naturalSize.width;

    if (widestHeight > VIDEO_CONTAINER_HEIGHT) {
      setVideoDimensions((prevState) => ({
        ...prevState,
        videoWidth:
          (VIDEO_CONTAINER_HEIGHT * event.naturalSize.width) /
          event.naturalSize.height,
        videoHeight: VIDEO_CONTAINER_HEIGHT,
      }));
    } else {
      setVideoDimensions((prevState) => ({
        ...prevState,
        videoWidth: DEVICE_WIDTH,
        videoHeight:
          (DEVICE_WIDTH * event.naturalSize.height) / event.naturalSize.width,
      }));
    }
  };

  const _getTimestamp = () => {
    if (
      playbackInstance.current != null &&
      playbackStatus.playbackInstancePosition != null &&
      playbackStatus.playbackInstanceDuration != null
    ) {
      return `${_getMMSSFromMillis(
        playbackStatus.playbackInstancePosition
      )} / ${_getMMSSFromMillis(playbackStatus.playbackInstanceDuration)}`;
    }
    return "";
  };

  const _getMMSSFromMillis = (milliseconds) => {
    const totalSeconds = milliseconds / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = (number) => {
      return number.toString().padStart(2, "0");
    };

    return padWithZero(minutes) + ":" + padWithZero(seconds);
  };

  const _onVolumeSliderValueChange = (value) => {
    if (playbackInstance.current != null) {
      playbackInstance.current.setVolumeAsync(value);
    }
  };

  const _getSeekSliderPosition = () => {
    if (
      playbackInstance.current != null &&
      playbackStatus.playbackInstancePosition != null &&
      playbackStatus.playbackInstanceDuration != null
    ) {
      return (
        playbackStatus.playbackInstancePosition /
        playbackStatus.playbackInstanceDuration
      );
    }
    return 0;
  };

  const _onSeekSliderValueChange = (value) => {
    if (playbackInstance.current != null && !isSeeking.current) {
      isSeeking.current = true;
      shouldPlayAtEndOfSeek.current = playbackStatus.shouldPlay;
      playbackInstance.current.pauseAsync();
    }
  };

  const _onSeekSliderSlidingComplete = async (value) => {
    if (playbackInstance.current != null) {
      isSeeking.current = false;
      const seekPosition = value * playbackStatus.playbackInstanceDuration;
      if (shouldPlayAtEndOfSeek.current) {
        playbackInstance.current.playFromPositionAsync(seekPosition);
      } else {
        playbackInstance.current.setPositionAsync(seekPosition);
      }
    }
  };

  const _onBackPressed = () => {
    if (playbackInstance.current != null) {
      _advanceIndex(false);
      _updatePlaybackInstanceForIndex(playbackStatus.shouldPlay);
    }
  };

  const _onPlayPausePressed = () => {
    if (playbackInstance.current != null) {
      if (playbackStatus.isPlaying) {
        playbackInstance.current.pauseAsync();
      } else {
        playbackInstance.current.playAsync();
      }
    }
  };

  const _onStopPressed = () => {
    if (playbackInstance.current != null) {
      playbackInstance.current.stopAsync();
    }
  };

  const _onForwardPressed = () => {
    if (playbackInstance.current != null) {
      _advanceIndex(true);
      _updatePlaybackInstanceForIndex(playbackStatus.shouldPlay);
    }
  };

  const _onMutePressed = () => {
    if (playbackInstance.current != null) {
      playbackInstance.current.setIsMutedAsync(!playbackStatus.muted);
    }
  };

  const _onLoopPressed = () => {
    if (playbackInstance.current != null) {
      playbackInstance.current.setIsLoopingAsync(
        playbackStatus.loopingType !== LOOPING_TYPE_ONE
      );
    }
  };

  const _trySetRate = async (rate, shouldCorrectPitch) => {
    if (playbackInstance.current != null) {
      try {
        await playbackInstance.current.setRateAsync(rate, shouldCorrectPitch);
      } catch (error) {
        console.log("RATE CHANGE ERROR", error);
        // Rate changing could not be performed, possibly because the client's Android API is too old.
      }
    }
  };

  const _onRateSliderSlidingComplete = async (value) => {
    _trySetRate(value * RATE_SCALE, playbackStatus.shouldCorrectPitch);
  };

  const _onPitchCorrectionPressed = async (value) => {
    _trySetRate(playbackStatus.rate, !playbackStatus.shouldCorrectPitch);
  };

  const _onSpeakerPressed = () => {
    setThroughEarPiece((prevState) => !prevState);
  };

  React.useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: throughEarpiece,
    });
  }, [throughEarpiece]);

  const _onPosterPressed = () => {
    setPoster((prevState) => !prevState);
  };

  const _onFullscreenPressed = () => {
    try {
      _video.current.presentFullscreenPlayer();
    } catch (error) {
      console.log(error.toString());
    }
  };

  const _onUseNativeControlsPressed = () => {
    setUseNativeControls((prevState) => !prevState);
  };

  console.log("isloading and showVideo", isLoading, showVideo);

  return (
    <SafeAreaView style={styles.container}>
      <View />
      <View style={styles.nameContainer}>
        <Text
          style={[
            styles.text,
            { fontFamily: fontLoaded ? "cutive-mono-regular" : null },
          ]}
        >
          {playbackInstanceName}
        </Text>
      </View>
      <View style={styles.space} />
      <View style={styles.videoContainer}>
        <Video
          ref={_video}
          style={[
            styles.video,
            {
              opacity: 1.0,
              width: videoDimensions.videoWidth,
              height: videoDimensions.videoHeight,
            },
          ]}
          resizeMode={Video.RESIZE_MODE_CONTAIN}
          onPlaybackStatusUpdate={_onPlaybackStatusUpdate}
          onLoadStart={_onloadStart}
          onLoad={_onLoad}
          onError={_onError}
          onFullscreenUpdate={_onFullScreenUpdate}
          onReadyForDisplay={_onReadyForDisplay}
          useNativeControls={useNativeControls}
        />
      </View>
      <View
        style={[
          styles.playbackContainer,
          {
            opacity: isLoading ? DISABLED_OPACITY : 1.0,
          },
        ]}
      >
        <Slider
          style={styles.playbackSlider}
          // trackImage={ICON_TRACK_1.module}
          // thumbImage={ICON_THUMB_1.module}
          value={_getSeekSliderPosition()}
          onValueChange={_onSeekSliderValueChange}
          onSlidingComplete={_onSeekSliderSlidingComplete}
          disabled={isLoading}
        />
        <View style={styles.timestampRow}>
          <Text
            style={[
              styles.text,
              styles.buffering,
              { fontFamily: fontLoaded ? "cutive-mono-regular" : null },
            ]}
          >
            {playbackStatus.isBuffering ? BUFFERING_STRING : ""}
          </Text>
          <Text
            style={[
              styles.text,
              styles.timestamp,
              { fontFamily: fontLoaded ? "cutive-mono-regular" : null },
            ]}
          >
            {_getTimestamp()}
          </Text>
        </View>
      </View>
      <View style={styles.space} />
      <View
        style={[
          styles.buttonsContainerBase,
          styles.buttonContainerTopRow,
          {
            opacity: isLoading ? DISABLED_OPACITY : 1.0,
          },
        ]}
      >
        <TouchableHighlight
          underlayColor={BACKGROUND_COLOR}
          style={styles.wrapper}
          onPress={_onBackPressed}
          disabled={isLoading}
        >
          <MaterialIcons
            name={ICON_BACK_BUTTON.module}
            size={32}
            style={styles.button}
          />
        </TouchableHighlight>

        <TouchableHighlight
          underlayColor={BACKGROUND_COLOR}
          style={styles.wrapper}
          onPress={_onPlayPausePressed}
          disabled={isLoading}
        >
          <MaterialIcons
            name={
              playbackStatus.isPlaying
                ? ICON_PAUSE_BUTTON.module
                : ICON_PLAY_BUTTON.module
            }
            size={32}
            style={styles.button}
          />
        </TouchableHighlight>

        <TouchableHighlight
          underlayColor={BACKGROUND_COLOR}
          style={styles.wrapper}
          onPress={_onStopPressed}
          disabled={isLoading}
        >
          <MaterialIcons
            name={ICON_STOP_BUTTON.module}
            size={32}
            style={styles.button}
          />
        </TouchableHighlight>

        <TouchableHighlight
          underlayColor={BACKGROUND_COLOR}
          style={styles.wrapper}
          onPress={_onForwardPressed}
          disabled={isLoading}
        >
          <MaterialIcons
            name={ICON_FORWARD_BUTTON.module}
            size={32}
            style={styles.button}
          />
        </TouchableHighlight>
      </View>
      <View
        style={[styles.buttonsContainerBase, styles.buttonContainerMiddleRow]}
      >
        <View style={styles.volumeContainer}>
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={_onMutePressed}
          >
            <MaterialIcons
              name={
                playbackStatus.muted
                  ? ICON_MUTED_BUTTON.module
                  : ICON_UNMUTED_BUTTON.module
              }
              size={32}
              style={styles.button}
            />
          </TouchableHighlight>
          <Slider
            style={styles.volumeSlider}
            // trackImage={ICON_TRACK_1.module}
            // thumbImage={ICON_THUMB_2.module}
            value={1}
            onValueChange={_onVolumeSliderValueChange}
          />
        </View>
        <TouchableHighlight
          underlayColor={BACKGROUND_COLOR}
          style={styles.wrapper}
          onPress={_onLoopPressed}
        >
          <MaterialIcons
            name={LOOPING_TYPE_ICONS[playbackStatus.loopingType]}
            size={32}
            style={styles.button}
          />
        </TouchableHighlight>
      </View>

      <View
        style={[styles.buttonsContainerBase, styles.buttonContainerBottomRow]}
      >
        <TouchableHighlight
          underlayColor={BACKGROUND_COLOR}
          style={styles.wrapper}
          onPress={() => _trySetRate(1.0, playbackStatus.shouldCorrectPitch)}
        >
          <View style={styles.button}>
            <Text
              style={[
                styles.text,
                { fontFamily: fontLoaded ? "cutive-mono-regular" : null },
              ]}
            >
              Rate:
            </Text>
          </View>
        </TouchableHighlight>
        <Slider
          style={styles.rateSlider}
          // trackImage={ICON_TRACK_1.module}
          // thumbImage={ICON_THUMB_1.module}
          value={playbackStatus.rate / RATE_SCALE}
          onSlidingComplete={_onRateSliderSlidingComplete}
        />
        <TouchableHighlight
          underlayColor={BACKGROUND_COLOR}
          style={styles.wrapper}
          onPress={_onPitchCorrectionPressed}
        >
          <View style={styles.button}>
            <Text
              style={[
                styles.text,
                { fontFamily: fontLoaded ? "cutive-mono-regular" : null },
              ]}
            >
              PC: {playbackStatus.shouldCorrectPitch ? "yes" : "no"}
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          onPress={_onSpeakerPressed}
          underlayColor={BACKGROUND_COLOR}
        >
          <MaterialIcons
            name={
              throughEarpiece ? ICON_THROUGH_EARPIECE : ICON_THROUGH_SPEAKER
            }
            size={32}
            color="black"
          />
        </TouchableHighlight>
      </View>
      <View />

      {showVideo ? (
        <View>
          <View
            style={[
              styles.buttonsContainerBase,
              styles.buttonsContainerTextRow,
            ]}
          >
            <View />
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={_onPosterPressed}
            >
              <View style={styles.button}>
                <Text
                  style={[
                    styles.text,
                    { fontFamily: fontLoaded ? "cutive-mono-regular" : null },
                  ]}
                >
                  Poster: {poster ? "yes" : "no"}
                </Text>
              </View>
            </TouchableHighlight>
            <View />
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={_onFullscreenPressed}
            >
              <View style={styles.button}>
                <Text
                  style={[
                    styles.text,
                    { fontFamily: fontLoaded ? "cutive-mono-regular" : null },
                  ]}
                >
                  Fullscreen
                </Text>
              </View>
            </TouchableHighlight>
            <View />
          </View>
          <View style={styles.space} />

          <View
            style={[
              styles.buttonsContainerBase,
              styles.buttonsContainerTextRow,
            ]}
          >
            <View />
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={_onUseNativeControlsPressed}
            >
              <View style={styles.button}>
                <Text
                  style={[
                    styles.text,
                    { fontFamily: fontLoaded ? "cutive-mono-regular" : null },
                  ]}
                >
                  Native Controls: {useNativeControls ? "yes" : "no"}
                </Text>
              </View>
            </TouchableHighlight>
            <View />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignSelf: "stretch",
    backgroundColor: BACKGROUND_COLOR,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: BACKGROUND_COLOR,
  },
  nameContainer: {
    height: FONT_SIZE,
  },
  text: {
    fontSize: FONT_SIZE,
    minHeight: FONT_SIZE,
  },
  space: {
    height: FONT_SIZE,
  },
  videoContainer: {
    height: VIDEO_CONTAINER_HEIGHT,
  },
  timestampRow: {
    // paddingVertical: 20,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    minHeight: FONT_SIZE,
  },
  buffering: {
    textAlign: "left",
    paddingLeft: 20,
  },
  buttonsContainerBase: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonContainerTopRow: {
    maxHeight: ICON_PLAY_BUTTON.height,
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0,
  },
  wrapper: {},
  playbackContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    minHeight: ICON_THUMB_1.height * 2.0,
    maxHeight: ICON_THUMB_1.height * 2.0,
  },
  button: {
    backgroundColor: BACKGROUND_COLOR,
  },
  buttonsContainerMiddleRow: {
    maxHeight: ICON_MUTED_BUTTON.height,
    alignSelf: "stretch",
    paddingRight: 20,
  },
  volumeContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0,
  },
  volumeSlider: {
    width: DEVICE_WIDTH / 2.0 - ICON_MUTED_BUTTON.width,
  },
  buttonsContainerBottomRow: {
    maxHeight: ICON_THUMB_1.height,
    alignSelf: "stretch",
    paddingRight: 20,
    paddingLeft: 20,
  },
  rateSlider: {
    width: DEVICE_WIDTH / 2.0,
  },
  buttonsContainerTextRow: {
    maxHeight: FONT_SIZE,
    alignItems: "center",
    paddingRight: 20,
    paddingLeft: 20,
    minWidth: DEVICE_WIDTH,
    maxWidth: DEVICE_WIDTH,
  },
  playbackSlider: {
    alignSelf: "stretch",
  },
});
