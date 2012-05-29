dw.complex_map = function(column){
	var t = dw.transform(column);
	dw.ivar(t, [{name:'result', initial:dw.COLUMN},{name:'update', initial:false},{name:'insert_position', initial:dw.INSERT_RIGHT},{name:'row', initial:undefined}])


	t.apply = function(tables, options){

		options = options || {};
		var table = t.getTable(tables),
			  columns = t.columns(table),
  			new_columns = [],
			  rows = table.rows(),
			  values, valueStats = [], transformedValues, transformStats,start_row = options.start_row || 0,
			  end_row = options.end_row || rows,
			  row = t._row;

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
					values[c] = columns[c].lut ? columns[c].lut[columns[c][i]] : columns[c][i];
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

	return t;
}
