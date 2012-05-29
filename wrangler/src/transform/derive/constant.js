dw.derive.constant = function(c, type) {
	var constant = dw.derive.expression();
	constant.transform = function(values, table) {
		var length = table.rows();
		    result = dv.array_with_init(length, c);
		result.type = type;
		return result;
	}
	return constant;

}
