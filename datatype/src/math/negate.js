dt.math.negate = function(children) {
	
	var add = dt.math.expression(children);
	
	add.transform = function(values) {
		return -1*values[0];
	}
	
	return add;
	
}
