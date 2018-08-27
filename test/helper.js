
import * as Rainbow from '../lib/rainbow.js';

const expect = chai.expect;

export function run(lang, description, code, expected, only = false) {
    let toCall = test;
    if (only) {
        toCall = test.only;
    }

    toCall(description, async () => {
        const {result} = await Rainbow.color(code, lang);
        expect(result).to.equal(expected);
    });
}

export function skip(lang, description, code, result) {
    test.skip(description);
}

