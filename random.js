'use strict';

// randomBytes / randomFill / randomFillSync over the Web Crypto API.
//
// These were `randombytes` (2019) and `randomfill` (2018), six kilobytes
// between them and both abandoned. Their bulk is environment detection that no
// longer earns its place: `global.msCrypto` for IE11, a `process.browser`
// branch choosing between node:crypto and getRandomValues, and an "old browser"
// path that throws. `crypto.getRandomValues` is standard in every runtime this
// package targets — browsers and Node 19+ — so one implementation serves both.
//
// The argument validation is upstream's, because it is observable: callers
// depend on these exact TypeError and RangeError messages, and Node's own
// crypto module produces the same ones.

var safeBuffer = require('safe-buffer');

var Buffer = safeBuffer.Buffer;
var kBufferMaxLength = safeBuffer.kMaxLength;
var kMaxUint32 = Math.pow(2, 32) - 1;

// getRandomValues rejects requests above this; Node's randomBytes does not, so
// larger requests are filled in chunks rather than refused.
var MAX_BYTES = 65536;

function fill(view) {
	for (var generated = 0; generated < view.length; generated += MAX_BYTES) {
		globalThis.crypto.getRandomValues(
			view.subarray(generated, Math.min(generated + MAX_BYTES, view.length))
		);
	}
	return view;
}

function assertOffset(offset, length) {
	if (typeof offset !== 'number' || offset !== offset) { // eslint-disable-line no-self-compare
		throw new TypeError('offset must be a number');
	}
	if (offset > kMaxUint32 || offset < 0) {
		throw new TypeError('offset must be a uint32');
	}
	if (offset > kBufferMaxLength || offset > length) {
		throw new RangeError('offset out of range');
	}
}

function assertSize(size, offset, length) {
	if (typeof size !== 'number' || size !== size) { // eslint-disable-line no-self-compare
		throw new TypeError('size must be a number');
	}
	if (size > kMaxUint32 || size < 0) {
		throw new TypeError('size must be a uint32');
	}
	if (size + offset > length || size > kBufferMaxLength) {
		throw new RangeError('buffer too small');
	}
}

function randomBytes(size, cb) {
	if (size > kMaxUint32) {
		throw new RangeError('requested too many random bytes');
	}

	var bytes = Buffer.allocUnsafe(size);
	if (size > 0) {
		fill(bytes);
	}

	if (typeof cb === 'function') {
		process.nextTick(function () {
			cb(null, bytes);
		});
		return undefined;
	}

	return bytes;
}

function actualFill(buf, offset, size, cb) {
	fill(new Uint8Array(buf.buffer, buf.byteOffset + offset, size));

	if (cb) {
		process.nextTick(function () {
			cb(null, buf);
		});
		return undefined;
	}

	return buf;
}

function randomFill(buf, offset, size, cb) {
	if (!Buffer.isBuffer(buf) && !(buf instanceof Uint8Array)) {
		throw new TypeError('"buf" argument must be a Buffer or Uint8Array');
	}

	if (typeof offset === 'function') {
		cb = offset;
		offset = 0;
		size = buf.length;
	} else if (typeof size === 'function') {
		cb = size;
		size = buf.length - offset;
	} else if (typeof cb !== 'function') {
		throw new TypeError('"cb" argument must be a function');
	}

	assertOffset(offset, buf.length);
	assertSize(size, offset, buf.length);

	return actualFill(buf, offset, size, cb);
}

function randomFillSync(buf, offset, size) {
	if (typeof offset === 'undefined') {
		offset = 0;
	}

	if (!Buffer.isBuffer(buf) && !(buf instanceof Uint8Array)) {
		throw new TypeError('"buf" argument must be a Buffer or Uint8Array');
	}

	assertOffset(offset, buf.length);

	if (typeof size === 'undefined') {
		size = buf.length - offset;
	}

	assertSize(size, offset, buf.length);

	return actualFill(buf, offset, size);
}

module.exports = {
	randomBytes: randomBytes,
	randomFill: randomFill,
	randomFillSync: randomFillSync
};
