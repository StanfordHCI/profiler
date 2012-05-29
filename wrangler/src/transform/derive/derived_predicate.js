dw.derive.derived_predicate = function(expression) {
  var pred = dw.transform();

  pred.apply = function(tables, options) {
    options = options || {};
		var table = pred.getTable(tables),
		result = expression.evaluate(table), filter_predicate;
		filter_predicate = function(table, row) {
		  return result[row];
		}
		dw.filter({test:filter_predicate}).apply(tables, options);
  }

  return pred;
};