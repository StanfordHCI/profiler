dw.derive.not = function (children) {
	var compare = dw.derive.expression(children);
	compare.transform = function(values) {
		var x = values[0], length = x.length,
		    i,
		    result = dv.array(length);

		for (i = 0; i < length; ++i) {
		  result[i] = !x[i];
		}
		return result;
	}
	return compare;
};