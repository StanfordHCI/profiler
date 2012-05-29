dw.derive.divide = function(children) {

	var divide = dw.derive.expression(children);

	divide.transform = function(values) {
		var x = values[0], y = values[1], length = x.length, i,
		    result = dv.array(length);
		for (i = 0; i < length; ++i) {
		  result[i] = x[i] / y[i];
		}
    result.type = dt.type.number();
		return result;
	}
	return divide;

};
