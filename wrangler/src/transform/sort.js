dw.sort = function(column){
	var t = dw.transform(column);
	dw.ivara(t, [
		{name:'direction', initial:[]},
		{name:'as_type', initial:[]}
	])

	t.description_length = function(){

		return 0;
	}

	t.description = function(){
		var d = [
			'Sort by ',
			dw.column_clause(t, t._column, 'column')
		]
		if(t._direction && t._direction.length && t._direction[0]==='desc'){
			d.push(t._direction[0])
		}
		return d;
	}

	t.apply = function(tables, options){
		options = options || {};
		var table = t.getTable(tables),
			columns = t.columns(table),
			rows = table.rows(),
			row = t._row || dw.row(),
			values,
			start_row =  0,
			end_row =  rows,
			method = t._method,
			direction = t._direction;



		var comparisons = columns.map(function(c){
			var ct = t._as_type[0] || c.wrangler_type;
			if(!ct){
				return dw.stringCompare;
			}

			return ct.comparison();

		})

		var directions = [];
		for(var i = 0; i < columns.length;++i){
			if(t._direction[i]==='desc') directions.push(-1);
			else directions.push(1);
		}


		var sortFunction = function(a, b){
			for(var i = 0; i < comparisons.length;++i){
				var col = columns[i];

				var result = comparisons[i](col[a], col[b]);
				if(result != 0){
					return directions[i]*result;
				}
			}
			if(a < b) return -1;
			if(a==b) return 0;
			return 1;
		}

		var sortedRows = dw.merge_sort(dv.range(0, table.rows()), sortFunction);

		var newTable = table.slice();
		for(var col = 0; col < table.length; ++col){
			var column = table[col];
			var newColumn = newTable[col]
			for(var row = 0; row < table.rows(); ++row){
				column[row] = newColumn[sortedRows[row]];
			}
		}



		return {updatedCols:columns}

	}



	t.name = dw.transform.SORT;
	return t;
}


