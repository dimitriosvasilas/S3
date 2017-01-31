import assert from 'assert';

import bucketPut from '../../../lib/api/bucketPut';
import bucketGetLocation from '../../../lib/api/bucketGetLocation';
import { cleanup,
    DummyRequestLogger,
    makeAuthInfo }
from '../helpers';

const log = new DummyRequestLogger();
const authInfo = makeAuthInfo('accessKey1');
const bucketName = 'bucketGetLocationTestBucket';

const testBucketPutRequest = {
    bucketName,
    headers: { host: `${bucketName}.s3.amazonaws.com` },
    url: '/',
};

const testGetLocationRequest = {
    bucketName,
    headers: {
        host: `${bucketName}.s3.amazonaws.com`,
    },
    url: '/?location',
    query: { location: '' },
};

// Change these locations with the config ones
// import config from '../../../Config';
const config =
    { locationConstraints: {
        'aws-us-east-1': {
            type: 'aws_s3',
            information: {
                region: 'us-east-1',
                bucketName: 'premadebucket',
                credentialsProfile: 'default',
            },
        },
        'file': {
            type: 'file',
            information: {
            },
        },
        'mem': {
            type: 'mem',
            information: {
            },
        },
    },
};


describe('getBucketLocation API', () => {
    Object.keys(config.locationConstraints).forEach(location => {
        describe(`with ${location} LocationConstraint`, () => {
            beforeEach(done => {
                cleanup();
                bucketPut(authInfo, testBucketPutRequest,
                location, log, done);
            });
            afterEach(() => cleanup());
            it(`should return ${location} LocationConstraint xml`, done => {
                bucketGetLocation(authInfo, testGetLocationRequest, log,
                (err, res) => {
                    if (err) {
                        process.stdout.write(`Err putting cors config ${err}`);
                        return done(err);
                    }
                    const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">` +
          `${location}</LocationConstraint>`;
                    assert.deepStrictEqual(res, xml);
                    return done();
                });
            });
        });
    });
    [undefined, 'us-east-1'].forEach(location => {
        describe(`with ${location} LocationConstraint`, () => {
            beforeEach(done => {
                cleanup();
                bucketPut(authInfo, testBucketPutRequest, location, log, done);
            });
            afterEach(() => cleanup());
            it('should return empty string LocationConstraint xml', done => {
                bucketGetLocation(authInfo, testGetLocationRequest, log,
                (err, res) => {
                    if (err) {
                        process.stdout.write(`Err putting cors config ${err}`);
                        return done(err);
                    }
                    const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">` +
        '</LocationConstraint>';
                    assert.deepStrictEqual(res, xml);
                    return done();
                });
            });
        });
    });
});
