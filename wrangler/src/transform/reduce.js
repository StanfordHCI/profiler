dw.reduce = function(column){
	var t = dw.transform(column);
	dw.ivara(t, [{name:'measures', initial:[]}])
	t.description = function(){
		return [
			'reduce',
			dw.column_clause(t, t._column),
			' with aggregates ',
			dw.column_clause(t, t._measures)
		]
	}


	t.apply = function(tables){

		var table = t.getTable(tables),
			compress = table.slice(0, table.rows(), {compress:true}),
			columns = t.columns(table),
			names = columns.map(function(c){return c.name}),
			rows = table.rows(), newIndex = 0, col, values, reduce = {};


		var x = table.query({dims:names, vals:t._measures.map(function(m){return dv.first(m)})});



		table = dv.table([]);



		return {};


	}
	t.name = dw.transform.UNFOLD;
	return t;
}
