dw.derive.add = function(children) {

	var add = dw.derive.expression(children);

	add.transform = function(values) {
		var x = values[0], y = values[1], length = x.length, i,
		    result = dv.array(length);
		for (i = 0; i < length; ++i) {
		  result[i] = x[i] + y[i];
		}

		if (x.type.name === y.type.name) {
		  result.type = x.type;
		} else {
		  result.type = dt.type.string();
		}
		return result;
	}

	return add;

};
