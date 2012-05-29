dw.derive.log = function(children, base) {

	var derive = dw.derive.expression(children);

  derive.base = function (x) {
    if(!arguments.length) return base;
    base = x;
    return derive;
  }

	derive.transform = function(values, table) {
		var x = values[0], length = x.length, i,
		    result = dv.array(length), val, log_base = base && base.evaluate(table);
		for (i = 0; i < length; ++i) {
      if (x[i] === 0) result[i] = 0;
      else {
        val = Math.log(x[i])
  		  if(log_base) {
  		    val = val / Math.log(log_base[i]);
  		  }
  		  result[i] = val;
      }
		}
		result.type = dt.type.number();
		return result;
	}

  derive.name = 'log';

  derive.base(base);
	return derive;

}
