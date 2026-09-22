'use strict'

// RSA CRT exponentiation with blinding, vendored from browserify-rsa@4.1.1
// (MIT, crypto-browserify). Thirty-eight lines; its randombytes dependency is
// covered by ./random.js here. The blinding is not optional - it is what keeps
// the private exponentiation from leaking timing information.

var BN = require('bn.js');
var Buffer = require('safe-buffer').Buffer;

// getRandomValues caps at 65536 bytes per call; RSA moduli are far smaller, but
// the loop costs nothing and removes the edge.
var MAX_BYTES = 65536;

function randomBytes(size) {
	var bytes = Buffer.allocUnsafe(size);
	for (var generated = 0; generated < size; generated += MAX_BYTES) {
		globalThis.crypto.getRandomValues(bytes.slice(generated, Math.min(generated + MAX_BYTES, size)));
	}
	return bytes;
}

function getr(priv) {
	var len = priv.modulus.byteLength();
	var r;
	do {
		r = new BN(randomBytes(len));
	} while (r.cmp(priv.modulus) >= 0 || !r.umod(priv.prime1) || !r.umod(priv.prime2));
	return r;
}

function blind(priv) {
	var r = getr(priv);
	var blinder = r.toRed(BN.mont(priv.modulus)).redPow(new BN(priv.publicExponent)).fromRed();
	return { blinder: blinder, unblinder: r.invm(priv.modulus) };
}

function crt(msg, priv) {
	var blinds = blind(priv);
	var len = priv.modulus.byteLength();
	var blinded = new BN(msg).mul(blinds.blinder).umod(priv.modulus);
	var c1 = blinded.toRed(BN.mont(priv.prime1));
	var c2 = blinded.toRed(BN.mont(priv.prime2));
	var qinv = priv.coefficient;
	var p = priv.prime1;
	var q = priv.prime2;
	var m1 = c1.redPow(priv.exponent1).fromRed();
	var m2 = c2.redPow(priv.exponent2).fromRed();
	var h = m1.isub(m2).imul(qinv).umod(p).imul(q);
	return m2.iadd(h).imul(blinds.unblinder).umod(priv.modulus).toArrayLike(Buffer, 'be', len);
}
crt.getr = getr;

module.exports = crt;
