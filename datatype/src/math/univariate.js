dt.math.univariate = function(formula, alias) {
	var fn = {},
		alias = alias || 'x';

	var expression = dt.math.parse(formula);

	fn.alias = function(x) {
		if(!arguments.length) return alias;
		alias = x;
		return fn;
	}

	fn.expression = function(x) {
		if(!arguments.length) return expression;
		expression = x;
		return fn;
	}


	fn.evaluate = function(x){
		var vals = {};
		vals[alias] = x;
		return expression.evaluate(vals)
	}
	
	return fn;
};
