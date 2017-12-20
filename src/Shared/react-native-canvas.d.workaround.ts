declare module "react-native-canvas" {
    export default class Canvas extends React.Component<any, any> {
        getContext(type: string): any;
        width: number;
        height: number;
    }

    class Image {
        src: string;
        addEventListener(eventName: string, callback: () => any): any;
        constructor(canvas: Canvas);
    }
}