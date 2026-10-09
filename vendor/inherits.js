'use strict';

// In-tree replacement for the `inherits` package. This is exactly what its
// browser entry does; keeping it here means a bundler never has to resolve the
// package (or its Node entry, which pulls in `util`). `super_` is kept for
// anything downstream that still reads it.
module.exports = function inherits(ctor, superCtor) {
	ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
};
