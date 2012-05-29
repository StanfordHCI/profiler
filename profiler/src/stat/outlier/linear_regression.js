dp.outlier.linear_regression = function(opt) {

	var mean = opt.mean, std = opt.std, query_vals, xfield = opt.xfield, yfield = opt.yfield, query_result, table = opt.table, xdata = table[xfield], ydata = table[yfield], deviations = opt.deviations || 2,
	    residuals = dv.array(xdata.length), slope, intercept, residual_table,
	    i;


	query_vals = [dp.reg_slope(xfield, yfield).as('slope'), dp.reg_intercept(xfield, yfield).as('intercept')];
	query_result = table.query({dims: [], vals: query_vals});

  slope = query_result['slope'][0];
  intercept = query_result['intercept'][0];


	residuals = dv.array(xdata.length);
	for (i = 0; i < xdata.length; ++i) {
		residuals[i] = (ydata[i] - (slope * xdata[i] + intercept));
	}


  residual_table = dv.table([{values: residuals, name: 'residuals', type: dv.numeric}]);


	return dp.outlier.zscore({table: residual_table, field: 'residuals'});

};

dp.dot = function(x, y, o) {
  o = o || {};
  var op = dv.op(x, o);
	op.init = function() {var o = {}; o[expr] = [op.key]; return o;}
	op.done = function(ctx) {return ctx[op.key]; };
	op.key = 'dot_' + x + '*' + y;
	op.value = x;
	op.map = function(table, i) {
	  return table[x][i] * table[y][i];
	}
	return op;

};

dp.reg_slope = function(x, y, o) {
  o = o || {};
  var op = dv.op(x, o), adj = o.sample ? 1 : 0;
  op.init = function() {
    var o = {'*': ['cnt']}; o[x] = ['sum', 'ssq']; o[y] = ['sum']; o['^'] = [dp.dot(x, y)]; return o;
  };
  op.done = function(ctx) {
    var cnt = ctx['cnt'], sumx = ctx['sum_'+ x], sumy = ctx['sum_'+ y], ssq = ctx['ssq_'+ x], dot = ctx[dp.dot(x, y).key];

    return sumx.map(function(v,i) { return (cnt * dot[i] - sumx[i] * sumy[i]) / (cnt * ssq[i] - sumx[i] * sumx[i]); });
  };
  op.value = x + '*'+ y;
  return op;
};

dp.reg_intercept = function(x, y, sample) {
  o = o || {};
  var op = dv.op(x, o), adj = o.sample ? 1 : 0;
  op.init = function() {
    var o = {'*': ['cnt']}; o[x] = ['sum', 'ssq']; o[y] = ['sum']; o['^'] = [dp.dot(x, y)]; return o;
  };
  op.done = function(ctx) {
    var cnt = ctx['cnt'], sumx = ctx['sum_'+ x], sumy = ctx['sum_'+ y], ssq = ctx['ssq_'+ x], dot = ctx[dp.dot(x, y).key];
    var slope = sumx.map(function(v,i) { return (cnt * dot[i] - sumx[i] * sumy[i]) / (cnt * ssq[i] - sumx[i] * sumx[i]); });

    return sumx.map(function(v,i) { return (sumy[i] - slope[i] * sumx[i]) / (cnt); });
  };
  op.value = x + '*'+ y;
  return op;
};
