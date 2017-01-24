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
const configLocationConstraints = {
    'aws-us-east-1': 'aws-us-east-1-value',
    'aws-us-east-test': 'aws-us-east-test-value',
    'scality-us-east-1': 'scality-us-east-1-value',
    'scality-us-west-1': 'scality-us-west-1-value',
    'virtual-user-metadata': 'virtual-user-metadata-value',
    'file': 'file-value',
    'mem': 'mem-value',
};

const AWSregions = ['us-west-1', 'us-west-2', 'ca-central-1',
'EU', 'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-south-1', 'ap-southeast-1',
'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'sa-east-1',
'us-east-2', ''];


describe('getBucketLocation API', () => {
    Object.keys(configLocationConstraints).concat(AWSregions).forEach(
    location => {
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
});
