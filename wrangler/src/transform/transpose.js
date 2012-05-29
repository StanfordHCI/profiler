dw.transpose = function(column){
	var t = dw.transform(column);
	dw.ivara(t, [

	])

	t.description_length = function(){
		return 0;
	}

	t.description = function(){
		var d = [
			'Transpose table'
		]
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

		var newcols = dv.range(0, table.rows()).map(function(r){
			var x = [];
			x.name = 'transpose';
			x.type = dv.type.nominal;
			return x;
		});

		for(var c = 0; c < table.cols(); ++c){
			var col = table[c];
			for(var r = 0; r < table.rows(); ++r){
				newcols[r][c] = col[r];
			}
		}

		while(table.cols()){
			table.removeColumn(0);
		}

		newcols.forEach(function(c){
			table.addColumn(c.name, c, c.type, dw.string(), undefined, {})
		})


		return {};
	}



	t.name = dw.transform.TRANSPOSE;
	return t;
}


