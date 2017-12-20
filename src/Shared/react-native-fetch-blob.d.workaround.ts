declare module "react-native-fetch-blob" {
    export default class RNFetchBlob {
        static fetch(method: string, url: string, body: any, data: string): Promise<any>;
        static wrap(param: any): any;
    }
}