dw.derive.pow = function(children, exp) {

	var derive = dw.derive.expression(children);

	derive.base = function (x) {
    if(!arguments.length) return exp;
    exp = x;
    return derive;
  }

	derive.transform = function(values, table) {
		var x = values[0], length = x.length, i,
		    result = dv.array(length), val, pow_exp = exp && exp.evaluate(table);
		for (i = 0; i < length; ++i) {
		  val = x[i];
		  if (pow_exp) {
		    val = Math.pow(val, pow_exp[i]);
		  }
		  result[i] = val;
		}
		result.type = dt.type.number();
		return result;
	}

  derive.name = 'pow';

	return derive;

}
