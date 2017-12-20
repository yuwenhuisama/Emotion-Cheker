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
} from "react-native";

import Svg, {
  Circle,
  Rect,
  Image as SvgImage,
} from "react-native-svg";

import ImagePicker from "react-native-image-picker";

import { Button, Toast, Theme } from "teaset";

import RNFetchBlob from "react-native-fetch-blob";
import FaceData, { Score } from "./FaceData";

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
          let result = await RNFetchBlob.fetch(
            "POST",
            "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize",
            {
              "Content-Type": "application/octet-stream",
              "Ocp-Apim-Subscription-Key": "83e04df3f0b14131aa9ba7eddfec69f8",
            }, imgData);
          let json = await result.json() as Array<any>;

          let faces = json.map((element, index) => {
            let faceData = new FaceData();
            faceData.rect = {
              x: element.faceRectangle.left,
              y: element.faceRectangle.top,
              width: element.faceRectangle.width,
              height: element.faceRectangle.height
            };
            faceData.score = element.scores as Score;
            return faceData;
          });

          this.setState({
            ...this.state,
            faces: faces,
          });

        } catch (e) {
          console.log(e);
        } finally {
          this.hideCustom();
        }
      }
    });
  }

  // svg: Svg;

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
          <View style={[styles.scroll]}>
            <Svg
              height={this.state.height}
              width={this.state.width}
            >
              <SvgImage
                href={{ uri: this.state.imagePath }}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
                x="0"
                y="0">
              </SvgImage>
              {
                this.state.faces.map((value, index) => {
                  return <Rect
                    key={index}
                    x={value.rect.x * this.state.width / this.state.realWidth}
                    y={value.rect.y * this.state.height / this.state.realHeight}
                    width={value.rect.width * this.state.width / this.state.realWidth}
                    height={value.rect.height * this.state.height / this.state.realHeight}
                    stroke="red"
                    strokeWidth="2"
                    fill="#0000"
                  ></Rect>;
                })
              }
            </Svg>
          </View>
        </ScrollView>
        <Button
          style={[styles.button]}
          title="选择一张照片"
          size="md"
          type="primary"
          onPress={() => this.onSelectButtonClicked()}></Button>
      </View>
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
