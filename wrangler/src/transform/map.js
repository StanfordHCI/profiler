dw.map = function(column){
	var t = dw.transform(column);
	dw.ivar(t, [{name:'result', initial:dw.COLUMN},{name:'update', initial:false},{name:'insert_position', initial:dw.INSERT_RIGHT},{name:'row', initial:undefined}])


	t.apply = function(tables, options){

		if(t._result === dw.COLUMN) {
		  return t.apply_column_map(tables, options);
		} else {
		  return t.apply_row_map(tables, options);
		}

	}

	t.apply_row_map = function(tables, options) {
	  options = options || {};
		var table = t.getTable(tables),
			  columns = t.columns(table),
  			new_columns = [],
			  rows = table.rows(),
			  values, valueStats = [], transformedValues, transformStats,start_row = options.start_row || 0,
			  end_row = options.end_row || rows,
			  row = t._row.tester(tables), new_cols = [], dropped_cols = [];

    values = dv.array(columns.length);

    var repeated_col_indices = dw.range(table.length);
    if(t._drop) {
      repeated_col_indices = repeated_col_indices.filter(function(i) {
        return columns.indexOf(table[i]) === -1;
      })
    }
    repeated_cols = repeated_col_indices.map(function(index){
      var x = [];
      x.name = table[index].name;
      x.type = table[index].type;
      x.lut = table[index].lut;
      return x
    });

    var new_column = [], current_insert_row = 0;

		for(var i = start_row; i < end_row; ++i){
			if(!row || row.test(table, i)){
				for(var c = 0; c < columns.length; ++c){
					values[c] = columns[c].get_raw(i);
				}
				transformedValues = t.transform(values, table);
				for(var j = 0; j < transformedValues.length; ++j) {
				  new_column[current_insert_row] = transformedValues[j];
				  for(var k = 0; k < repeated_col_indices.length; ++k) {
				    repeated_cols[k][current_insert_row] = table[repeated_col_indices[k]][i];
				  }
				  current_insert_row++;
				}
			}
		}



  	var insertPreference = t.insert_position();
  	var insertPosition;
		switch(insertPreference) {
  		case dw.INSERT_RIGHT:
  			insertPosition = columns[columns.length-1].index;
  			break
  		case dw.INSERT_END:
  			insertPosition = table.length;
  			break
  	}


    var tl = table.length;
    for(c = 0; c < tl; ++c) {
      table.removeColumn(0);
    }



    for(c = 0; c < repeated_cols.length; ++c) {
      table.addColumn(repeated_cols[c].name, repeated_cols[c], repeated_cols[c].type, {encoded:true, lut:repeated_cols[c].lut});
    }


    table.addColumn(t.name, new_column, "nominal");

		return transformStats;
	}

	t.apply_column_map = function(tables, options) {
	  options = options || {};
		var table = t.getTable(tables),
			  columns = t.columns(table),
  			new_columns = [],
			  rows = table.rows(),
			  values, valueStats = [], transformedValues, transformStats,start_row = options.start_row || 0,
			  end_row = options.end_row || rows,
			  row = t._row && t._row.tester(tables),
			  new_cols = [], dropped_cols = [];

    values = dv.array(columns.length);

		for(var i = start_row; i < end_row; ++i){
			if(!row || row.test(table, i)){

				for(var c = 0; c < columns.length; ++c){
					values[c] = columns[c].get_raw(i);
				}
				transformedValues = t.transform(values, table);
        valueStats.push(transformedValues.stats);
				for(var j = 0; j < transformedValues.length; ++j) {
				  if(new_columns[j]===undefined) new_columns[j] = dv.array_with_init(rows, undefined);
				  new_columns[j][i] = transformedValues[j];
				}
			}
		}

  	var insertPreference = t.insert_position();
  	var insertPosition;
		switch(insertPreference) {
  		case dw.INSERT_RIGHT:
  			insertPosition = columns[columns.length-1].index;
  			break
  		case dw.INSERT_END:
  			insertPosition = table.length;
  			break
  	}

    for (c = 0; c < new_columns.length; ++c) {
      new_cols.push(table.addColumn(t.name, new_columns[c], "nominal", {index:insertPosition+c+1}));
    }


    if (t._drop) {
      for(c = 0; c < columns.length; ++c) {
        dropped_cols.push(columns[c])
        table.removeColumn(columns[c].index);
      }
    }

    return {newCols:new_cols, droppedCols:dropped_cols, valueStats:valueStats}
	}

	return t;
}
