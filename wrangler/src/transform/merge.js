dw.merge = function(column){
	var t = dw.map(column);
	dw.ivar(t, [{name:'glue', initial:''}])

	t.transform = function(values){
		var	glue = t._glue,
		    v = values.filter(function(v){return v!=undefined}).join(glue)
		return [v];
	}


	t.description = function(){
		return [
			'Merge',
			dw.column_clause(t, t._column, 'column'),
			' with glue ',
			dw.input_clause(t, 'glue')
		]
	}

	t.well_defined = function(table){
		return t._column.length > 1;
	}

	t.name = dw.transform.MERGE;

	return t;
}
