dw.derive.zscore = function(children) {

	var derive = dw.derive.expression(children);

	derive.transform = function(values, table) {
    var mean = dw.derive.avg([]).transform(values, table),
        stdev = dw.derive.stdev([]).transform(values, table), result;
    result = dw.derive.divide([]).transform([dw.derive.subtract([]).transform([values[0], mean]), stdev]);
    result.type = dt.type.number();
    return result;
	}

	return derive;

}
