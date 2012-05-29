dt.math.bivariate = function(formula, xalias, yalias) {
	var fn = {},
		alias = xalias || 'x',
		alias = yalias || 'y';

	var expression = dt.math.parse(formula);

	fn.xalias = function(x) {
		if(!arguments.length) return xalias;
		xalias = x;
		return fn;
	}

	fn.yalias = function(x) {
		if(!arguments.length) return yalias;
		yalias = x;
		return fn;
	}

	fn.expression = function(x) {
		if(!arguments.length) return expression;
		expression = x;
		return fn;
	}

	fn.evaluate = function(x, y){
		var vals = {};
		vals[xalias] = x;
		vals[yalias] = y;
		return expression.evaluate(vals);
	}
	
	return fn;
};
