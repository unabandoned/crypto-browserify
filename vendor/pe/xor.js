'use strict'

// Vendored from public-encrypt@4.0.3 (MIT, crypto-browserify), unmaintained
// since 2018.

module.exports = function xor (a, b) {
  var len = a.length
  var i = -1
  while (++i < len) {
    a[i] ^= b[i]
  }
  return a
}
