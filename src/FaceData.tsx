
export type Rect = {x: number, y: number, width: number, height: number};
export type Score = {anger: number, contempt: number, disgust: number,
    fear: number, happiness: number, neutral: number, sadness: number, surpise: number};
export default class FaceData {
    rect: Rect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
    score: Score = {
        anger: 0,
        contempt: 0,
        disgust: 0,
        fear: 0,
        happiness: 0,
        neutral: 0,
        sadness: 0,
        surpise: 0,
    };

    constructor() {
    }
}