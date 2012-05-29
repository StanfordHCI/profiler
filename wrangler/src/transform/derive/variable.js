dw.derive.variable = function(x) {

	var variable = dw.derive.expression();
	variable.transform = function(values, table) {
		var result = table[x].copy();
		return result;
	}
	return variable;

}
