dw.filter = function(row){
	var t = dw.transform();
	t._drop = true;

	row = dw.row(row);

	dw.ivar(t, [
		{name:'row', initial:row}
	]);

	t.description = function(){
		return [
			'Delete',
			dw.row_clause(t, t._row, 'row')
		]
	}

	t.description_length = function(){
		if(t._row)
			return t._row.description_length();

		return 0;
	}



	t.apply = function(tables, options){
		options = options || {};
		var table = t.getTable(tables),
			cols = table.cols(),
			rows = table.rows(),
			row = t._row.tester(tables),
			filteredTable = table.slice(0,0),
			effectedRows = [], drop = t._drop,
			start_row = options.start_row || 0,
			end_row = options.end_row || rows, luts = table.map(function(c){return c.lut}),
			filter;

		for(var r = start_row; r < end_row; ++r){
			filter = row.test(table, r);
			if (filter) {
				effectedRows.push(r)
			}
			if (!filter || !drop) {
				for (var c = 0; c < cols; ++c) {
					col = filteredTable[c];
					col.push(table[c].get_raw(r))
				}
			}
		}

		var l = table.cols();
		var names = table.map(function(c) {return c.name()});
		var types = table.map(function(c) {return c.type});
		for(var c = 0; c < l; ++c){
			table.removeColumn(0);
		}
		for(var c = 0; c < l; ++c){
			table.addColumn(names[c], filteredTable[c], types[c])
		}

		return {effectedRows:effectedRows}
	}

	t.valid_columns = function(tables){
		if(t._row)
			return t._row.valid_columns(tables);

		return {valid:true}
	}


	t.well_defined = function(){
		return t._row.valid_filter()
	}

	t.name = dw.transform.FILTER;
	return t;
}
