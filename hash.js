'use strict';

// createHash / createHmac over @unabandoned/hash.js.
//
// These were `create-hash` and `create-hmac`, neither released since 2018 and
// between them pulling md5.js (2018), cipher-base, ripemd160, sha.js, hash-base
// and to-buffer's typed-array helpers. @unabandoned/hash.js implements every
// digest they exposed — md5, sha1, sha224, sha256, sha384, sha512, sha512-256
// and ripemd160 — plus HMAC over any of them, with no dependencies of its own.
//
// Unlike the equivalent in @unabandoned/browserify-sign, this one is the
// package's *public* API: crypto.createHash and crypto.createHmac are
// re-exported straight from here, and callers may use them as streams. So the
// full surface is reproduced — Transform, `.update()`, `.digest()` — rather
// than the two methods one caller happened to need. `stream` resolves to the
// browser shim under a bundler, exactly as cipher-base relied on.

var Transform = require('stream').Transform;
var Buffer = require('safe-buffer').Buffer;
var inherits = require('inherits');
var hash = require('@unabandoned/hash.js');

var algorithms = {
	__proto__: null,
	md5: hash.md5,
	sha1: hash.sha1,
	sha224: hash.sha224,
	sha256: hash.sha256,
	sha384: hash.sha384,
	sha512: hash.sha512,
	'sha512-256': hash.sha512_256,
	ripemd160: hash.ripemd160,
	rmd160: hash.ripemd160
};

function resolve(algorithm) {
	var ctor = algorithms[String(algorithm).toLowerCase()];
	if (!ctor) {
		throw new Error('Digest method not supported: ' + algorithm);
	}
	return ctor;
}

// hash.js takes array-likes, and Buffer is one. Strings are converted here so
// an explicit encoding is honoured, matching create-hash's behaviour (utf8 by
// default).
function toBytes(data, encoding) {
	if (Buffer.isBuffer(data)) {
		return data;
	}
	if (typeof data === 'string') {
		return Buffer.from(data, encoding || 'utf8');
	}
	return Buffer.from(data);
}

function Hash(state) {
	if (!(this instanceof Hash)) {
		return new Hash(state);
	}
	Transform.call(this);
	this._state = state;
	this._finalized = false;
}
inherits(Hash, Transform);

Hash.prototype._transform = function _transform(chunk, encoding, callback) {
	var err = null;
	try {
		this.update(chunk, encoding);
	} catch (e) {
		err = e;
	}
	callback(err);
};

Hash.prototype._flush = function _flush(callback) {
	var err = null;
	try {
		this.push(this.digest());
	} catch (e) {
		err = e;
	}
	callback(err);
};

Hash.prototype.update = function update(data, encoding) {
	if (this._finalized) {
		throw new Error('Digest already called');
	}
	this._state.update(toBytes(data, encoding));
	return this;
};

Hash.prototype.digest = function digest(encoding) {
	if (this._finalized) {
		throw new Error('Digest already called');
	}
	this._finalized = true;
	var out = Buffer.from(this._state.digest());
	return encoding ? out.toString(encoding) : out;
};

function createHash(algorithm) {
	return new Hash(resolve(algorithm)());
}

function createHmac(algorithm, key) {
	return new Hash(hash.hmac(resolve(algorithm), toBytes(key)));
}

module.exports = { createHash: createHash, createHmac: createHmac, Hash: Hash };
