dt.math.constant = function(v) {
	
	var constant = dt.math.expression();
	constant.transform = function(values) {
		return v;
	}
	return constant;
	
}
