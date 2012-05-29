dt.math.expression = function(children) {
	var exp = {},
		children = children || [];

	exp.children = function(x) {
		if(!arguments.length) return children;
		children = x;
		return exp;
	};

	exp.evaluate = function(table) {
		var c, values = [], child;
    values = children.map(function(c) {
      return c.evaluate(table);
    })





		return exp.transform(values, table);
	};

	return exp;
};
