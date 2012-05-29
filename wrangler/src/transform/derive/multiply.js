dw.derive.multiply = function(children) {
	var add = dw.derive.expression(children);

	add.transform = function(values) {
		var x = values[0], y = values[1], length = x.length, i,
		    result = dv.array(length);
		for (i = 0; i < length; ++i) {
		  result[i] = x[i] * y[i];
		}
		result.type = dt.type.number();
		return result;
	}
	return add;

}
