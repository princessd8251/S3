import assert from 'assert';
import { S3 } from 'aws-sdk';
import getConfig from '../support/config';
import withV4 from '../support/withV4';

describe('PUT Bucket - AWS.S3.createBucket', () => {
    let s3;

    describe('When user is unauthorized', () => {
        let s3;
        let config;

        beforeEach(() => {
            config = getConfig('default');
            s3 = new S3(config);
        });

        it('should return 403 and AccessDenied', done => {
            const params = { Bucket: 'mybucket' };

            s3.makeUnauthenticatedRequest('createBucket', params, error => {
                assert(error);

                assert.strictEqual(error.statusCode, 403);
                assert.strictEqual(error.code, 'AccessDenied');

                done();
            });
        });
    });

    withV4(sigCfg => {
        before(() => {
            const config = getConfig('default', sigCfg);

            s3 = new S3(config);
        });

        describe('bucket naming restriction', () => {
            let testFn;

            before(() => {
                testFn = (bucketName, done) => {
                    const expectedStatus = 400;
                    const expectedCode = 'InvalidBucketName';

                    s3.createBucket({ Bucket: bucketName }, (error, data) => {
                        if (data) {
                            const e = new Error('Expect failure in creation, ' +
                                'but it succeeded');

                            return done(e);
                        }

                        assert.strictEqual(error.code, expectedCode);
                        assert.strictEqual(error.statusCode, expectedStatus);
                        done();
                    });
                };
            });

            // Found that AWS has fewer restriction in naming than
            // they described in their document.
            // Hence it skips some of test suites.
            const itSkipIfAWS = process.env.AWS_ON_AIR ? it.skip : it;

            it('should return 400 if name is shorter than 3 chars', done => {
                const shortName = 'as';

                testFn(shortName, done);
            });

            itSkipIfAWS('should return 400 if name is longer than 63 chars',
                done => {
                    const longName = 'x'.repeat(64);
                    testFn(longName, done);
                }
            );

            itSkipIfAWS('should return 400 if name is formatted as IP address',
                done => {
                    const ipAddress = '192.168.5.4';
                    testFn(ipAddress, done);
                }
            );

            itSkipIfAWS('should return 400 if name starts with period',
                done => {
                    const invalidName = '.myawsbucket';
                    testFn(invalidName, done);
                }
            );

            it('should return 400 if name ends with period', done => {
                const invalidName = 'myawsbucket.';
                testFn(invalidName, done);
            });

            itSkipIfAWS(
                'should return 400 if name has two period between labels',
                done => {
                    const invalidName = 'my..examplebucket';
                    testFn(invalidName, done);
                }
            );

            it('should return 400 if name has special chars', done => {
                const invalidName = 'my.#s3bucket';
                testFn(invalidName, done);
            });
        });
    });
});