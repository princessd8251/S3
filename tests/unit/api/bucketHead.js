import assert from 'assert';
import bucketHead from '../../../lib/api/bucketHead';
import bucketPut from '../../../lib/api/bucketPut';
import metadata from '../metadataswitch';
import utils from '../../../lib/utils';

const accessKey = 'accessKey1';
const namespace = 'default';
const bucketName = 'bucketname';
const testBucketUID = utils.getResourceUID(namespace, bucketName);

describe('bucketHead API', () => {
    let metastore;

    beforeEach((done) => {
        metastore = {
            "users": {
                "accessKey1": {
                    "buckets": []
                },
                "accessKey2": {
                    "buckets": []
                }
            },
            "buckets": {}
        };
        metadata.deleteBucket(testBucketUID, ()=> {
            done();
        });
    });

    after((done) => {
        metadata.deleteBucket(testBucketUID, ()=> {
            done();
        });
    });

    it('should return an error if the bucket does not exist', (done) => {
        const testRequest = {
            headers: {host: `${bucketName}.s3.amazonaws.com`},
            url: '/',
            namespace: namespace
        };

        bucketHead(accessKey, metastore, testRequest, (err) => {
            assert.strictEqual(err, 'NoSuchBucket');
            done();
        });
    });

    it('should return an error if user is not authorized', (done) => {
        const bucketName = 'bucketname';
        const putAccessKey = 'accessKey2';
        const testRequest = {
            lowerCaseHeaders: {},
            headers: {host: `${bucketName}.s3.amazonaws.com`},
            url: '/',
            namespace: namespace
        };

        bucketPut(putAccessKey, metastore, testRequest,
            (err, success) => {
                assert.strictEqual(success, 'Bucket created');
                bucketHead(accessKey, metastore, testRequest,
                    (err) => {
                        assert.strictEqual(err, 'AccessDenied');
                        done();
                    });
            });
    });

    it('should return a success message if ' +
       'bucket exists and user is authorized', (done) => {
        const bucketName = 'bucketname';
        const testRequest = {
            lowerCaseHeaders: {},
            headers: {host: `${bucketName}.s3.amazonaws.com`},
            url: '/',
            namespace: namespace
        };

        bucketPut(accessKey, metastore, testRequest,
            (err, success) => {
                assert.strictEqual(success, 'Bucket created');
                bucketHead(accessKey, metastore, testRequest,
                    (err, result) => {
                        assert.strictEqual(result,
                        'Bucket exists and user authorized -- 200');
                        done();
                    });
            });
    });
});
