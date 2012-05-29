dw.copy = function(column){
	var t = dw.map(column);

	t.well_defined = function(table){
		return t._column.length === 1;
	}

	t.transform = function(values){
		return values;
	}

	t.description = function(){
		return [
			'Copy',
			dw.column_clause(t, t._column, 'column')
		]
	}

	t.name = dw.transform.COPY;

	return t;
}
