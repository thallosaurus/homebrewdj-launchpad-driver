import "jasmine";
//import { TrackControlStripKeys, controlStripKeyToNumber } from '../src/widgets/TrackControlStrip';
import { Model } from '../src/hDJRecvModel';

describe("BufferIndexBinding", () => {
    it("should return correct key number", () => {
        const vol = Model.ButtonId.VOLUME;
        expect(vol).toBe(Model.buttonIdToButtonBufferIndex(vol));
//        expect(controlStripKeyToNumber(5)).toBe(0);
    });
});