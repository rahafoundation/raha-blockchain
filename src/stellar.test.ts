import { expect } from 'chai';

import { sha256MultiHashToMemo } from './stellar';

describe('function sha256MultiHashToMemo', function() {
    it('should throw an error on invalid MultiHash prefix.', function() {
        let error = new Error('');
        const badMultiHash = 'ZzTcHdEZNrKB3zb5XSUeMUy83kfVJCbxcbRuFqDYdDxdsa';
        expect(() => sha256MultiHashToMemo(badMultiHash)).to.throw(Error, 'Invalid MultiHash prefix: 25,41.');
    });
    it('should return the expected encoded MultiHash.', function() {
        const multiHash = 'QmTcHdEZNrKB3zb5XSUeMUy83kfVJCbxcbRuFqDYdDxdsa';
        const memoBuffer = sha256MultiHashToMemo(multiHash);
        expect(memoBuffer.toString('base64')).to.equal('TkvjSDwJPGh7JHCOWrEECofCcgUUu7rTxllomyV0lh0=');
    });
});