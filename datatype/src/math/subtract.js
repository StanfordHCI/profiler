dt.math.subtract = function(children) {
	
	var subtract = dt.math.expression(children);

	subtract.transform = function(values) {
		return values[0]-values[1];
	}
	
	return subtract;
	
};
