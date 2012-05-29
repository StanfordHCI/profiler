dw.derive.empty = function(children) {
	var row = dw.derive.expression([]);
	row.transform = function(values, table) {
		var result = dv.array(table.rows()), r, c, rows = result.length, cols = table.length,
		    num_missing, missing = dt.MISSING;
    for (r = 0; r < rows; ++r) {
      num_missing = 0;
		  for(c = 0; c < cols; ++c) {
			  v = table[c].get(r);
			  if (v === missing) {
			    num_missing++;
		    } else {
		      break
		    }
			}
			if (num_missing == cols) {
			  result[r] = 1;
			} else {
			  result[r] = 0;
			}
		}
		return result;
	}

	return row;
}
