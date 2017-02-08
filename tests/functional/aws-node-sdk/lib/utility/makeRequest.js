import http from 'http';
import https from 'https';
import querystring from 'querystring';

import conf from '../../../../../lib/Config';

const transport = conf.https ? https : http;
const ipAddress = process.env.IP ? process.env.IP : '127.0.0.1';

function _parseError(responseBody) {
    if (responseBody.indexOf('<Error>') > -1) {
        const error = {};
        const codeStartIndex = responseBody.indexOf('<Code>') + 6;
        const codeEndIndex = responseBody.indexOf('</Code>');
        error.code = responseBody.slice(codeStartIndex, codeEndIndex);
        const msgStartIndex = responseBody.indexOf('<Message>') + 9;
        const msgEndIndex = responseBody.indexOf('</Message>');
        error.message = responseBody.slice(msgStartIndex, msgEndIndex);
        return error;
    }
    return null;
}

/** makeRequest - utility function to generate a request
 * @param {object} params - params for making request
 * @param {string} params.hostname - request hostname
 * @param {number} params.port - request port
 * @param {string} params.method - request method
 * @param {object} params.queryObj - query fields and their string values
 * @param {object} params.headers - headers and their string values
 * @param {string} params.bucket - bucket name
 * @param {string} params.objectKey - object key name
 * @param {function} callback - with error and response parameters
 * @return {undefined} - and call callback
 */
export default function makeRequest(params, callback) {
    const { hostname, port, method, queryObj, headers, bucket, objectKey }
        = params;
    const options = {
        hostname: hostname || ipAddress, // default to where S3 Server is hosted
        port: port || 8000, // default to port 8000
        method,
        headers,
        path: bucket ? `/${bucket}` : '/',
        rejectUnauthorized: false,
    };
    if (process.env.AWS_ON_AIR) {
        options.hostname = 's3.amazonaws.com';
        options.port = 80;
    }
    if (objectKey) {
        options.path = `${options.path}${objectKey}`;
    }
    if (queryObj) {
        const qs = querystring.stringify(queryObj);
        options.path = `${options.path}?${qs}`;
    }

    const req = transport.request(options, res => {
        const body = [];
        res.on('data', chunk => {
            body.push(chunk);
        });
        res.on('error', err => {
            process.stdout.write('err receiving response');
            return callback(err);
        });
        res.on('end', () => {
            const total = body.join('');
            const data = {
                headers: res.headers,
                statusCode: res.statusCode,
                body: total,
            };
            const err = _parseError(total);
            if (err) {
                err.statusCode = res.statusCode;
            }
            return callback(err, data);
        });
    });
    req.on('error', err => {
        process.stdout.write('err sending request');
        return callback(err);
    });
    req.end();
}
