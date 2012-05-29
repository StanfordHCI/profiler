dt.math.variable = function(v) {
	
	var variable = dt.math.expression();
	variable.transform = function(values, table) {
		return 4;
	}
	return variable;
	
}
