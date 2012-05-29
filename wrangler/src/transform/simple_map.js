dw.simple_map = function(column){
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

		for(var i = start_row; i < end_row; ++i){
			if(!row || row.test(table, i)){

				for(var c = 0; c < columns.length; ++c){
					values[c] = columns[c].lut ? columns[c].lut[columns[c][i]] : columns[c][i];
				}
				transformedValues = t.transform(values, table);
				for(var j = 0; j < transformedValues.length; ++j) {
				  if(new_columns[j]===undefined) new_columns[j] = dv.array(rows);
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

    for(c = 0; c < new_columns.length; ++c) {
      table.addColumn(t.name, new_columns[c], "nominal", {index:insertPosition+c+1});
    }

    if(t._drop) {
      for(c = 0; c < columns.length; ++c) {
        table.removeColumn(columns[c].index);
      }
    }


		return transformStats;
	}

	return t;
}
