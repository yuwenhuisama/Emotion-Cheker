/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  Alert,
} from "react-native";

import _ from "lodash";

// import Svg, {
//   Circle,
//   Rect,
//   Image as SvgImage,
// } from "react-native-svg";

import ImagePicker from "react-native-image-picker";

import { Button, Toast, Theme } from "teaset";

import RNFetchBlob from "react-native-fetch-blob";
import FaceData, { Score } from "./FaceData";

interface IArray {
  [index: string]: any[];
}

const PICTURES: IArray = {
  anger: [require("../assets/anger/1.png"), require("../assets/anger/2.png"), require("../assets/anger/3.png")],
  contempt: [require("../assets/contempt/1.png"), require("../assets/contempt/2.png"), require("../assets/contempt/3.png")],
  disgust: [require("../assets/disgust/1.png"), require("../assets/disgust/2.png"), require("../assets/disgust/3.png")],
  fear: [require("../assets/fear/1.png"), require("../assets/fear/2.png"), require("../assets/fear/3.png")],
  happiness: [require("../assets/happiness/1.png"), require("../assets/happiness/2.png"), require("../assets/happiness/3.png"), require("../assets/happiness/4.jpg")],
  neutral: [require("../assets/neutral/1.png"), require("../assets/neutral/2.png"), require("../assets/neutral/3.png")],
  sadness: [require("../assets/sadness/1.png"), require("../assets/sadness/2.png"), require("../assets/sadness/3.png")],
  surprise: [require("../assets/surprise/1.png"), require("../assets/surprise/2.png"), require("../assets/surprise/3.png")],
};

interface Props {

}

interface States {
  imagePath?: string;
  width: number;
  height: number;
  realWidth: number;
  realHeight: number;

  faces: FaceData[];

  waitingForResult: boolean;
  disabled: boolean;
}

export default class App extends Component<Props, States> {

  state: States = {
    imagePath: undefined,
    width: 0,
    height: 0,
    realWidth: 0,
    realHeight: 0,

    faces: [],
    waitingForResult: false,

    disabled: false,
  };

  customKey: any = null;

  showCustom() {
    if (this.customKey) return;
    this.customKey = Toast.show({
      text: "图片处理中，请等待……",
      icon: <ActivityIndicator size="large" color={Theme.toastIconTintColor} />,
      position: "center",
      duration: 1000000,
    });
  }

  hideCustom() {
    if (!this.customKey) return;
    Toast.hide(this.customKey);
    this.customKey = null;
  }

  /**
   *
   */
  constructor(props: any, context: any) {
    super(props, context);
  }

  onSelectButtonClicked() {
    this.setState({
      ...this.state,
      faces: []
    });
    ImagePicker.showImagePicker({
      title: "选择一张照片",
      cancelButtonTitle: "取消",
      takePhotoButtonTitle: "拍照",
      chooseFromLibraryButtonTitle: "从相册中选择",
      cameraType: "front",
    }, async (response) => {
      if (response.error) {
        console.log(response.error);
      }
      else if (!response.didCancel && !response.customButton) {
        // dispatch(ACT_SELECT_PHOTO({ uri: "data:image/jpeg;base64," + response.data }));
        this.setState({
          ...this.state,
          imagePath: response.uri,
          width: Dimensions.get("window").width,
          height: response.height * Dimensions.get("window").width / response.width,
          realWidth: response.width,
          realHeight: response.height,
        });

        let imgData = response.data;
        try {
          this.showCustom();
          this.setState({
            ...this.state,
            disabled: true,
          });
          let result = await RNFetchBlob.fetch(
            "POST",
            "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize",
            {
              "Content-Type": "application/octet-stream",
              "Ocp-Apim-Subscription-Key": "83e04df3f0b14131aa9ba7eddfec69f8",
            }, imgData);
          let json = await result.json() as Array<any>;

          // console.log(json);

          let faces = json.map((element, index) => {
            let faceData = new FaceData();
            faceData.rect = {
              x: element.faceRectangle.left,
              y: element.faceRectangle.top,
              width: element.faceRectangle.width,
              height: element.faceRectangle.height
            };
            faceData.score = element.scores as Score;

            const keys = _.keys(faceData.score);
            let key = keys[0];
            let max = faceData.score[key];

            for (let index = 1; index < keys.length; index++) {
              const element = keys[index];
              if (faceData.score[element] > faceData.score[key]) {
                key = keys[index];
                max = faceData.score[element];
              }
            }

            faceData.faceImage = PICTURES[key][Math.ceil(Math.random() * PICTURES[key].length) - 1];

            return faceData;
          });

          this.setState({
            ...this.state,
            faces: faces,
          });

        } catch (e) {
          if (Platform.OS === "ios") {
            Alert.alert("网络错误", "提交数据时发生错误，请检查网络状态。");
          } else {
            ToastAndroid.show("提交数据时发生错误，请检查网络状态。", ToastAndroid.SHORT);
          }
          console.log(e);
        } finally {
          this.hideCustom();
          this.setState({
            ...this.state,
            disabled: false,
          });
        }
      }
    });
  }

  onLayout(event: any) {
    if (!this.state || !this.state.realHeight || this.state.realHeight === 0) {
      return;
    }

    this.setState({
      ...this.state,
      width: Dimensions.get("window").width,
      height: this.state.realHeight * Dimensions.get("window").width / this.state.realWidth,
    });

  }

  render() {
    return (
      <View style={styles.container}
        onLayout={this.onLayout.bind(this)}>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <ActivityIndicator animating={this.state.waitingForResult}></ActivityIndicator>
          <View style={[styles.scroll, { width: this.state.width, height: this.state.height }]}>
            <View>
              <Image
                source={{ uri: this.state.imagePath }}
                style={{
                  width: this.state.width,
                  height: this.state.height
                }}
              ></Image>

              {
                this.state.faces.map((value, index) => {
                  return <Image
                    key={index}
                    source={value.faceImage}
                    style={{
                      position: "absolute",
                      left: value.rect.x * this.state.width / this.state.realWidth,
                      top: value.rect.y * this.state.height / this.state.realHeight,
                      width: value.rect.width * this.state.width / this.state.realWidth,
                      height: value.rect.height * this.state.height / this.state.realHeight,
                    }}>
                  </Image>;
                })
              }
            </View>
          </View>
        </ScrollView>

        <Button
          style={[styles.button]}
          title="选择一张照片"
          size="md"
          type="primary"
          onPress={() => this.onSelectButtonClicked()}
          disabled={this.state.disabled}
        ></Button>
      </View >
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
  },
  scroll: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
});
