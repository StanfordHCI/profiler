dp.outlier.mahalanobis = function(opt) {

	var mean = opt.mean, std = opt.std, query_vals, xfield = opt.xfield, yfield = opt.yfield, query_result, table = opt.table, xdata = table[xfield], ydata = table[yfield], deviations = opt.deviations || 2,
	    residuals = dv.array(xdata.length), slope, intercept, covariance_table,
	    i;


	result = table.query({dims: [], vals: [dv.avg(xfield).as('xmean'), dv.avg(yfield).as('ymean')]}),
		      xmean = result['xmean'], ymean = result['ymean'],
		      xl = xdata.length, xx = dv.array(xl), xy = dv.array(xl), yy = dv.array(xl), mx, my;

	xx.name = 'xx';
	yy.name = 'yy';
	xy.name = 'xy';


	for (i = 0; i < xl; ++i) {
		mx = xdata[i] - xmean;
		my = ydata[i] - ymean;
		xx[i] = mx * mx;
		yy[i] = my * my;
		xy[i] = mx * my;
	}

	covariance_table = dv.table([{values: xx, name: 'xx', type: dv.numeric},{values: xy, name: 'xy', type: dv.numeric}, {values: yy, name: 'yy', type: dv.numeric}]);
	result = covariance_table.query({dims: [], vals: [dv.count('*'), dv.sum('xx'), dv.sum('xy'), dv.sum('yy')]});

	covariance = result.slice(1).map(function(c) {
		return c.map(function(d, i) {
			return d / (result[0] - 1);
		});
	});


	var inverse = [[], [], []], det, ul = covariance[0][0], ur = covariance[1][0], ll = covariance[1][0], lr = covariance[2][0];

	det = (ul * lr) - (ur * ll);

	iul = lr / det;
	ill = iur = -1 * ur / det;
	ilr = ul / det;


	var distance = [], mx, my;

	for (i = 0; i < xl; ++i) {
		mx = xdata[i] - xmean;
		my = ydata[i] - ymean;
		distance[i] = ((mx * iul + my * ill) * mx + (mx * iur + my * ilr) * my);
	}

	distance_table = dv.table([{values: distance, name: 'distance', type: dv.numeric}]);

	return dp.outlier.zscore({table: distance_table, field: 'distance'});


};
