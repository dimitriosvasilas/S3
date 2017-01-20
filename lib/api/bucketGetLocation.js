import { errors } from 'arsenal';

import bucketShield from './apiUtils/bucket/bucketShield';
import { isBucketAuthorized } from './apiUtils/authorization/aclChecks';
import metadata from '../metadata/wrapper';
import { pushMetric } from '../utapi/utilities';

const requestType = 'bucketOwnerAction';

/**
 * Bucket Get Location - Get bucket locationConstraint configuration
 * @param {AuthInfo} authInfo - Instance of AuthInfo class with requester's info
 * @param {object} request - http request object
 * @param {object} log - Werelogs logger
 * @param {function} callback - callback to server
 * @return {undefined}
 */

export default function bucketGetLocation(authInfo, request, log, callback) {
    const bucketName = request.bucketName;
    const canonicalID = authInfo.getCanonicalID();

    metadata.getBucket(bucketName, log, (err, bucket) => {
        if (err) {
            log.debug('metadata getbucket failed', { error: err });
            return callback(err);
        }
        if (bucketShield(bucket, requestType)) {
            return callback(errors.NoSuchBucket);
        }
        log.trace('found bucket in metadata');

        if (!isBucketAuthorized(bucket, requestType, canonicalID)) {
            log.debug('access denied for user on bucket', {
                requestType,
                method: 'bucketGetLocation',
            });
            return callback(errors.AccessDenied);
        }

        let locationConstraint = bucket.getLocationConstraint();
        if (!locationConstraint || locationConstraint === 'us-east-1') {
            // Not sure about this error - check against AWS
            // return callback(errors.NoSuchEntity);
            // Update: AWS return empty string if no region has been
            // provided or for us-east-1
            // Note: AWS JS SDK send a request with locationContaint us-east-1
            // if no locationContaint provided.
            locationConstraint = '';
        }
        // \r\n generate a line breack
        const xml = '<?xml version="1.0" encoding="UTF-8"?> \r\n ' +
        '<LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
            `${locationConstraint}</LocationConstraint>`;
        pushMetric('getBucketLocation', log, {
            authInfo,
            bucket: bucketName,
        });

        return callback(null, xml);
    });
}
