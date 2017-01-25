import assert from 'assert';

import withV4 from '../support/withV4';
import BucketUtility from '../../lib/utility/bucket-util';

const bucketName = 'testgetlocationbucket';

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
'us-east-2'];

const describeSkipAWS = process.env.AWS_ON_AIR ? describe.skip : describe;

describeSkipAWS('GET bucket location ', () => {
    withV4(sigCfg => {
        const bucketUtil = new BucketUtility('default', sigCfg);
        const s3 = bucketUtil.s3;
        const otherAccountBucketUtility = new BucketUtility('lisa', {});
        const otherAccountS3 = otherAccountBucketUtility.s3;

        Object.keys(configLocationConstraints).concat(AWSregions).forEach(
        location => {
            describeSkipAWS(`with location: ${location}`, () => {
                before(done => s3.createBucketAsync(
                    {
                        Bucket: bucketName,
                        CreateBucketConfiguration: {
                            LocationConstraint: location,
                        },
                    }, done));
                after(() => bucketUtil.deleteOne(bucketName));

                it(`should return location configuration: ${location} ` +
                'successfully',
                done => {
                    s3.getBucketLocation({ Bucket: bucketName },
                    (err, data) => {
                        assert.strictEqual(err, null,
                            `Found unexpected err ${err}`);
                        assert.deepStrictEqual(data.LocationConstraint,
                            location);
                        return done();
                    });
                });
            });
        });

        describe('without location configuration', () => {
            afterEach(() => bucketUtil.deleteOne(bucketName));
            before(done => s3.createBucketAsync({ Bucket: bucketName }, done));
            it('should return default location',
            done => {
                s3.getBucketLocation({ Bucket: bucketName },
                (err, data) => {
                    assert.strictEqual(err, null,
                        `Found unexpected err ${err}`);
                    assert.deepStrictEqual(data.LocationConstraint, '');
                    return done();
                });
            });
        });

        describe('without location us-east-1', () => {
            before(done => s3.createBucketAsync(
                {
                    Bucket: bucketName,
                    CreateBucketConfiguration: {
                        LocationConstraint: 'us-east-1',
                    },
                }, done));
            afterEach(() => bucketUtil.deleteOne(bucketName));
            it('should return default location',
            done => {
                s3.getBucketLocation({ Bucket: bucketName },
                (err, data) => {
                    assert.strictEqual(err, null,
                        `Found unexpected err ${err}`);
                    assert.deepStrictEqual(data.LocationConstraint, '');
                    return done();
                });
            });
        });

        describe('with existing configuration', () => {
            before(done => s3.createBucketAsync(
                {
                    Bucket: bucketName,
                    CreateBucketConfiguration: {
                        LocationConstraint: 'aws-us-east-1',
                    },
                }, done));
            after(() => bucketUtil.deleteOne(bucketName));

            it('should return AccessDenied if user is not bucket owner',
            done => {
                otherAccountS3.getBucketLocation({ Bucket: bucketName },
                err => {
                    assert(err);
                    assert.strictEqual(err.code, 'AccessDenied');
                    assert.strictEqual(err.statusCode, 403);
                    return done();
                });
            });
        });
    });
});
