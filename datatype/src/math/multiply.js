dt.math.multiply = function(children) {
	
	var add = dt.math.expression(children);
	
	add.transform = function(values) {
		return values[0]*values[1];
	}
	
	return add;
	
}
