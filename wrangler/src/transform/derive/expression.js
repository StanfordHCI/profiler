dw.derive.expression = function(children) {
	var exp = {},
		children = children || [];

	exp.children = function(x) {
		if(!arguments.length) return children;
		children = x;
		if(typeOf(children) !== 'array') {
      children = [children];
    }
		return exp;
	};

	exp.evaluate = function(table) {
		var values = children.map(function(c) {
      return c.evaluate(table);
    })





		return exp.transform(values, table);
	};

	exp.children(children);
	return exp;
};
