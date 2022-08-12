"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jasmine");
//import { TrackControlStripKeys, controlStripKeyToNumber } from '../src/widgets/TrackControlStrip';
const hDJRecvModel_1 = require("../src/hDJRecvModel");
describe("BufferIndexBinding", () => {
    it("should return correct key number", () => {
        const vol = hDJRecvModel_1.Model.ButtonId.VOLUME;
        expect(vol).toBe(hDJRecvModel_1.Model.buttonIdToButtonBufferIndex(vol));
        //        expect(controlStripKeyToNumber(5)).toBe(0);
    });
});
//# sourceMappingURL=testMidiSpec.js.map