dw.fold = function(column){
	var t = dw.transform(column);
	dw.ivara(t, {name:'keys', initial:[-1]})

	t.description = function(){
		return [
			'Fold',
			dw.column_clause(t, t._column, 'column'),
			' using ',
			dw.key_clause(t, t._keys.map(function(c){return c===-1?'header' : c }), 'keys', {editor_class:'fold', clean_val:function(x){return Number(x)}}),

			(t._keys.length===1? 'as a key' : ' as keys ')
		]
	}


	t.apply = function(tables, options){
		options = options || {};
		var table = t.getTable(tables),
			columns = t.columns(table),
			names = columns.map(function(c){return c.name}),
			rows = table.rows(),
			newIndex = 0,
			col,
			values,
			newCols,
			start_row = options.start_row || 0,
			end_row = options.end_row || rows;


		end_row = Math.min(end_row, rows)

		/*These are the keys to use for the fold...We use the header if the key = -1 otherwise we use the value in the cell*/
		var keys = columns.map(function(c){
			return t._keys.reduce(function(a, b){
				if(b===-1) a.push(dw.display_name(c.name()));
				else a.push(c[b])
				return a;
			}, [])
		})

		/*The new columns to put the keys in*/
		var keyCols = dv.range(keys[0].length).map(function(k){
			var x = [];
			x.name = 'fold';
			x.type = dv.type.nominal;
			return x;
		})

		var valueCol = []; valueCol.name = 'value'; valueCol.type = dv.type.nominal, newColumns = [];

		/*Copy the values from all other columns*/
		/*Also find where to insert to the new columns*/
		var updateCol;
		var foundLeft = false;
		var cols = table.filter(function(c){
			if(names.indexOf(c.name) === -1){
				return true;
			}
			else{
				if(!foundLeft) updateCol = c;
			}
			foundLeft = true;
			return false;
		}).map(function(c){
			var x = [];
			x.name = c.name;
			x.type = c.type;
			x.lut = c.lut;
			return x;
		})

		var v;

		for(var row = start_row; row < end_row; ++row){

			if(t._keys.indexOf(row)===-1){
				for(var k = 0; k < columns.length; ++k){
					for(var c = 0; c < cols.length; ++c){
						col = cols[c];
						col[newIndex] = table[col.name()][row];
					}
					for(var j = 0; j < keyCols.length; ++j){
						keyCols[j][newIndex] = keys[k][j]
					}
					valueCol[newIndex] = columns[k][row]
					++newIndex;
				}
			}
		}

		var updateIndex = updateCol ? updateCol.index : 0;

		while(table.cols()){
			table.removeColumn(0);
		}
		cols.forEach(function(c){
			table.addColumn(c.name(), c, c.type, {encoded:true, lut:c.lut})
		})

		keyCols.concat([valueCol]).forEach(function(c, i){
			newColumns.push(table.addColumn(c.name, c, c.type, {index:updateIndex+i, wranglerType:c.wrangler_type}));
		})

		return {keyCols:newColumns.slice(0, newColumns.length-1), valueCols:newColumns.slice(newColumns.length-1), toValueCols:columns, keyRows:t._keys}


	}

	t.well_defined = function(table){

		return true;
	}

	t.name = dw.transform.FOLD;
	return t;
}
