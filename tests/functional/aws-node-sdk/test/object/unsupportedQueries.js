import assert from 'assert';
import makeRequest from '../../lib/utility/makeRequest';

// Queries supported by AWS that we do not currently support.
const unsupportedQueries = [
    'accelerate',
    'analytics',
    'inventory',
    'lifecycle',
    'logging',
    'metrics',
    'notification',
    'policy',
    'replication',
    'requestPayment',
    'restore',
    'tagging',
    'torrent',
    'versions',
];
const bucket = 'testunsupportedqueriesbucket';
const objectKey = 'key';

const itSkipIfAWS = process.env.AWS_ON_AIR ? it.skip : it;

describe('unsupported query requests:', () => {
    unsupportedQueries.forEach(query => {
        itSkipIfAWS(`should respond with NotImplemented for ?${query} request`,
        done => {
            const queryObj = {};
            queryObj[query] = '';
            makeRequest({ method: 'GET', queryObj, bucket, objectKey }, err => {
                assert.strictEqual(err.code, 'NotImplemented');
                assert.strictEqual(err.statusCode, 501);
                done();
            });
        });
    });
});
