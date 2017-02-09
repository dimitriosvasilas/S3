import assert from 'assert';
import constants from '../../../../../constants';
import { makeS3Request } from '../../utils/makeRequest';

const bucket = 'testunsupportedqueriesbucket';
const objectKey = 'key';

const itSkipIfAWS = process.env.AWS_ON_AIR ? it.skip : it;

describe('unsupported query requests:', () => {
    constants.unsupportedQueries.forEach(query => {
        itSkipIfAWS(`should respond with NotImplemented for ?${query} request`,
        done => {
            const queryObj = {};
            queryObj[query] = '';
            makeS3Request({ method: 'GET', queryObj, bucket, objectKey },
            err => {
                assert.strictEqual(err.code, 'NotImplemented');
                assert.strictEqual(err.statusCode, 501);
                done();
            });
        });
    });
});
