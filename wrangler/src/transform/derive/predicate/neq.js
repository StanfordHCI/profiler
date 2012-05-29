dw.derive.neq = function (children) {
	var compare = dw.derive.expression(children);
	compare.transform = function(values) {
		var x = values[0], y = values[1], length = x.length,
		    i, xval, yval,
		    result = dv.array(length);

		for (i = 0; i < length; ++i) {
		  xval = x.lut ? x.lut[x[i]] : x[i];
		  yval = y.lut ? y.lut[y[i]] : y[i];
		  result[i] = xval != yval;
		}
		return result;
	}
	return compare;
};