'use strict'

// Vendored from public-encrypt@4.0.3 (MIT, crypto-browserify): the browser
// entry point.

exports.publicEncrypt = require('./public-encrypt')
exports.privateDecrypt = require('./private-decrypt')

exports.privateEncrypt = function privateEncrypt (key, buf) {
  return exports.publicEncrypt(key, buf, true)
}

exports.publicDecrypt = function publicDecrypt (key, buf) {
  return exports.privateDecrypt(key, buf, true)
}
