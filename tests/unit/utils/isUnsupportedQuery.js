import assert from 'assert';

import utils from '../../../lib/utils';
import constants from '../../../constants';

const unsupported = constants.unsupportedQueries[0];
const validQueryStrings = [
    `test${unsupported}`,
    `${unsupported}test`,
    `test${unsupported}test`,
    `test=${unsupported}`,
    `test&test${unsupported}`,
    `test&${unsupported}test`,
    `test&test${unsupported}test`,
    `test&test${unsupported}test&test2`,
    `test&test2&test${unsupported}`,
    `test&test2&${unsupported}test`,
    `test&test2&test${unsupported}test`,
];
const invalidQueryStrings = [
    `${unsupported}`,
    `${unsupported}=test`,
    `test&${unsupported}`,
    `test&${unsupported}=test`,
    `test&${unsupported}&test2`,
    `test&${unsupported}=test`,
    `test&${unsupported}=test&test2`,
    `test&test2&${unsupported}`,
    `test&test2&${unsupported}=test`,
];

describe('isUnsupportedQuery:', () => {
    validQueryStrings.forEach(qs => {
        it(`should return false for ?${qs}`, done => {
            const result = utils.isUnsupportedQuery(qs);
            assert.strictEqual(result, false);
            done();
        });
    });

    invalidQueryStrings.forEach(qs => {
        it(`should return true for ?${qs}`, done => {
            const result = utils.isUnsupportedQuery(qs);
            assert.strictEqual(result, true);
            done();
        });
    });
});
