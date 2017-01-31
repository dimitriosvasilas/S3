import { errors } from 'arsenal';

import { createBucket } from './apiUtils/bucket/bucketCreation';
import collectCorsHeaders from '../utilities/collectCorsHeaders';
import config from '../Config';
import aclUtils from '../utilities/aclUtils';
import { pushMetric } from '../utapi/utilities';

// TODO: Change these locations with the config ones
const configC =
    { locationConstraints: {
        'aws-us-east-1': {
            type: 'aws_s3',
            information: {
                region: 'us-east-1',
                bucketName: 'premadebucket',
                credentialsProfile: 'default',
            },
        },
        'aws-us-west-2': {
            type: 'aws_s3',
            information: {
                region: 'us-west-2',
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

/*
   Format of xml request:

   <?xml version="1.0" encoding="UTF-8"?>
   <CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
   <LocationConstraint>us-west-1</LocationConstraint>
   </CreateBucketConfiguration>
   */

/**
 * PUT Service - Create bucket for the user
 * @param {AuthInfo} authInfo - Instance of AuthInfo class with requester's info
 * @param {object} request - http request object
 * @param {string | undefined} locationConstraint - locationConstraint for
 * bucket (if any)
 * @param {object} log - Werelogs logger
 * @param {function} callback - callback to server
 * @return {undefined}
 */
export default function bucketPut(authInfo, request, locationConstraint, log,
    callback) {
    log.debug('processing request', { method: 'bucketPut' });

    if (authInfo.isRequesterPublicUser()) {
        log.debug('operation not available for public user');
        return callback(errors.AccessDenied);
    }
    if (!aclUtils.checkGrantHeaderValidity(request.headers)) {
        log.trace('invalid acl header');
        return callback(errors.InvalidArgument);
    }
    // - AWS JS SDK send a request with locationConstraint us-east-1
    // if no locationConstraint provided.
    const locationConstraintChecked = locationConstraint === 'us-east-1' ? '' :
    locationConstraint;
    if (locationConstraintChecked && Object.keys(configC.locationConstraints).
    indexOf(locationConstraintChecked) < 0) {
        log.trace('locationConstraint is invalid',
          { locationConstraint });
        return callback(errors.InvalidLocationConstraint);
    }
    const bucketName = request.bucketName;

    return createBucket(authInfo, bucketName, request.headers,
        locationConstraintChecked, config.usEastBehavior, log,
        (err, previousBucket) => {
            // if bucket already existed, gather any relevant cors headers
            const corsHeaders = collectCorsHeaders(request.headers.origin,
                request.method, previousBucket);
            if (err) {
                return callback(err, corsHeaders);
            }
            pushMetric('createBucket', log, {
                authInfo,
                bucket: bucketName,
            });
            return callback(null, corsHeaders);
        });
}
