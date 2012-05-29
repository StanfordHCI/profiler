dw.derive.is = function (children, val, is) {
	var compare = dw.derive.expression(children);
	is = is || true;
	compare.transform = function(values) {
		var x = values[0], length = x.length,
		    i, xval,
		    result = dv.array(length),
		    missing = dt.MISSING, error = dt.ERROR, valid = dt.VALID;
    for (i = 0; i < length; ++i) {
      xval =x[i];
      if (val === valid) {
        result[i] = is ? (xval !== missing && xval !== error) : (xval === missing || xval === error);
      } else {
		    result[i] = is ? (xval === val) : (xval !== val);
      }
		}
		return result;
	}
	return compare;
};