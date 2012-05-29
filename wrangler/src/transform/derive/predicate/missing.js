dw.derive.missing = function (children) {
	var compare = dw.derive.expression(children);
	compare.transform = function(values) {
		var x = values[0], length = x.length,
		    i, xval, missing = dt.MISSING,
		    result = dv.array(length);
		for (i = 0; i < length; ++i) {
		  xval = x[i];
		  result[i] = (xval === missing);
		}
		return result;
	}
	return compare;
};