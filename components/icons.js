// import { Asset } from "expo-asset";

class Icon {
  constructor(module, width, height) {
    this.module = module;
    this.width = width;
    this.height = height;
    // Asset.fromModule(this.module).downloadAsync();
  }
}

export const ICON_PLAY_BUTTON = new Icon("play-arrow", 34, 51);

export const ICON_PAUSE_BUTTON = new Icon("pause", 34, 51);

export const ICON_STOP_BUTTON = new Icon("stop", 22, 22);

export const ICON_FORWARD_BUTTON = new Icon("fast-forward", 33, 25);
export const ICON_BACK_BUTTON = new Icon("fast-rewind", 33, 25);

// const ICON_LOOP_ALL_BUTTON = new Icon(
//   require("./assets/images/loop_all_button.png"),
//   77,
//   35
// );
// const ICON_LOOP_ONE_BUTTON = new Icon(
//   require("./assets/images/loop_one_button.png"),
//   77,
//   35
// );

export const ICON_MUTED_BUTTON = new Icon("volume-off", 67, 58);
export const ICON_UNMUTED_BUTTON = new Icon("volume-up", 67, 58);

export const ICON_TRACK_1 = new Icon("", 166, 5);
export const ICON_THUMB_1 = new Icon("", 18, 19);
export const ICON_THUMB_2 = new Icon("", 15, 19);

export const ICON_THROUGH_EARPIECE = "speaker-phone";
export const ICON_THROUGH_SPEAKER = "speaker";
