//	........................................................................................................
//
//  extensions for javascript array class
//
//	by xiangchen@acm.org, 03/2017
//
//	........................................................................................................

Array.prototype.clone = function() {
	var arr = [];
	for (var i = 0; i < this.length; i++) {
		arr.push(this[i]);
	}
	return arr;
}

Array.prototype.add = function(arr, sign) {
	if (arr == undefined) return;
	sign = sign || 1;
	var len = Math.min(this.length, arr.length);
	for (var i = 0; i < len; i++) {
		this[i] += sign * arr[i];
	}
	return this;
}

Array.prototype.addScalar = function(s) {
	for (var i = 0; i < this.length; i++) {
		this[i] += s;
	}
	return this;
}

Array.prototype.sub = function(arr) {
	return this.add(arr, -1);
}

Array.prototype.times = function(s) {
	for (var i = 0; i < this.length; i++) {
		this[i] *= s;
	}
	return this;
}

Array.prototype.copy = function(arr) {
	this.splice(0, this.length);
	for (var i = 0; i < arr.length; i++) {
		this.push(arr[i]);
	}
}

Array.prototype.remove = function(elm, compFunc) {
	var toRemove = [];
	for (var i = this.length - 1; i >= 0; i--) {
		var equal = undefined;
		if (compFunc != undefined) {
			equal = compFunc(elm, this[i]);
		} else {
			equal = elm == this[i];
		}

		if (equal) {
			toRemove.push(i);
		}
	}

	for (var i = toRemove.length - 1; i >= 0; i--) {
		this.splice(toRemove[i], 1);
	}
}

Array.prototype.removeAt = function(idx) {
	if (idx >= 0) return this.splice(idx, 1);
}

Array.prototype.stitch = function(sep) {
	var str = '';
	for (var i = this.length - 1; i >= 0; i--) {
		str = this[i] + (i < this.length - 1 ? sep : '') + str;
	}
	return str;
}

Array.prototype.dimension = function() {
	var dim = [];
	var arr = this;
	while (arr.length != undefined) {
		dim.push(arr.length);
		arr = arr[0];
	}
	return dim;
}

Array.prototype.equals = function(arr) {
	if (this.length != arr.length) {
		return false;
	}

	for (var i = this.length - 1; i >= 0; i--) {
		if (this[i] != arr[i]) {
			return false;
		}
	}
	return true;
}

Array.prototype.max = function() {
	var maxVal = Number.MIN_VALUE;
	for (var i = this.length - 1; i >= 0; i--) {
		maxVal = Math.max(maxVal, this[i]);
	}
	return maxVal;
}

// similar to numpy's take https://docs.scipy.org/doc/numpy/reference/generated/numpy.take.html
// arrIndex is of this form:
//	[[x1, ..., xn], [y1, ..., yn], ... ], where, e.g.,
// 	[[x1, ..., xn] means along the 1st dim of this array, only consider x1-th, ... xn-th hyper-rows
Array.prototype.take = function(arrIndex) {
	var taken = [];
	for (var i = 0; i < arrIndex[0].length; i++) {
		var idx = arrIndex[0][i];
		if (arrIndex[1] != undefined) {
			taken.push(this[idx].take(arrIndex.slice(1)))
		} else {
			taken.push(this[idx]);
		}
	}
	return taken;
}

Array.prototype.average = function() {
	var sum = 0;
	for (var i = this.length - 1; i >= 0; i--) {
		if (isNaN(this[i])) {
			console.error('[Array.average]: containing not numbers: ' + this[i])
			return;
		}
		sum += this[i];
	}

	return sum / this.length;
}

Array.prototype.std = function() {
	var avg = this.average();

	var sqsum = 0;
	for (var i = this.length - 1; i >= 0; i--) {
		if (isNaN(this[i])) {
			console.error('[Array.std]: input arrays contain not numbers: ' + this[i])
			return;
		}
		sqsum += Math.pow(this[i] - avg, 2);
	}

	return Math.sqrt(sqsum / (this.length - 1));
}

// return an array that contains elements from this array but not from arr
Array.prototype.diff = function(arr) {
	var diffArr = [];

	for (var i = 0; i < this.length; i++) {
		if(arr.indexOf(this[i]) < 0) {
			diffArr.push(this[i]);
		}
	}

	return diffArr;
}
