dt.math.divide = function(children) {
	
	var divide = dt.math.expression(children);

	divide.transform = function(values) {
		return values[0] / values[1];
	}
	
	return divide;
	
};
