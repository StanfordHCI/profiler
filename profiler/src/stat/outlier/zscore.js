dp.outlier.zscore = function(opt) {

  var mean = opt.mean, std = opt.std, query_vals = [], field = opt.field, query_result, table = opt.table, data = table[field], deviations = opt.deviations || 2;

  if (!mean) {
	  query_vals.push(dv.avg(field, {as: 'mean'}));
	}

  if (!std) {
	  query_vals.push(dv.stdev(field, {as: 'std'}));
	}

  query_result = table.query({dims: [], vals: query_vals});

  /* */
  if (!mean) mean = query_result['mean'][0];
  if (!std) std = query_result['std'][0];

  return [mean - std * deviations, mean + std * deviations];

};
