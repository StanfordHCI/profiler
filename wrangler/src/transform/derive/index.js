dw.derive.index = function(children) {
	var row = dw.derive.expression([]);
	row.transform = function(values, table) {
		var result = d3.range(table.rows());
		result.type = dt.type.integer();
		return result;
	}
	return row;

}
