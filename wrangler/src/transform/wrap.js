dw.wrap = function(row){
	var t = dw.transform();


	row = dw.row(row);

	dw.ivar(t, [
		{name:'row', initial:row}
	]);

	t.description = function(){

		return [
			'Wrap',
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
			columns = t.columns(table),
			cols = table.cols(),
			rows = table.rows(),
			row = t._row,
			start_row = options.start_row || 0,
			end_row = options.end_row || rows, acc = [], data = [], newrows = 0, effectedRows = [];

				end_row = Math.min(end_row, rows)

		for(var r = start_row; r < end_row; ++r){
			if(row.test(table, r)){
				effectedRows.push(r)
				dv.range(acc.length-data.length).forEach(function(){data.push([])})
				if(acc.length){
					acc.forEach(function(d, i){
						data[i][newrows] = d
					})
					acc  = [];
					newrows++;
				}
			}
			for(var c = 0; c < cols; ++c){
				acc.push(table[c][r])
			}


		}
		dv.range(acc.length-data.length).forEach(function(){data.push([])})
		if(acc.length){
			acc.forEach(function(d, i){
				data[i][newrows] = d
			})
			acc  = [];
			newrows++;
		}





		var l = table.cols();

		for(var c = 0; c < l; ++c){
					table.removeColumn(0);
				}

		data.map(function(d,i){
			table.addColumn("wrap", d, 'nominal')
		})



		return {effectedRows:effectedRows, keyCols:dv.range(cols).map(function(c){return table[c]})}
	}

	t.valid_columns = function(tables){
		if(t._row)
			return t._row.valid_columns(tables);

		return {valid:true}
	}


	t.well_defined = function(){
		return t._row.conditions().length
	}

	t.name = dw.transform.WRAP;
	return t;
}
