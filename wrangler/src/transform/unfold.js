dw.unfold = function(column){
	var t = dw.transform(column);
	dw.ivar(t, [{name:'measure', initial:undefined}])
	t.description = function(){
		return [
			'Unfold',
			dw.column_clause(t, t._column, 'column', {editor_class:'unfold', single:true}),
			' on ',
			dw.column_clause(t, [t._measure], 'measure' ,{single:true})
		]
	}

	t.apply = function(tables, options){
		options = options || {};
		var table = t.getTable(tables),
			columns = t.columns(table),
			toHeaderNames = columns.map(function(c){return c.name()}),
			keyColumns = table.filter(function(c){return toHeaderNames.indexOf(c.name())===-1 && t._measure != c.name()}),
			rows = table.rows(), newIndex = 0,
			valueCol = table[t._measure],
			max_rows = options.max_rows || 1000,
			start_row = options.start_row || 0, end_row = options.end_row || rows;

		end_row = Math.min(rows, end_row);




		end_row = rows;

		var headerColumn = columns[0];

		var newColumnHeaders = [];
		headerColumn.forEach(function(e) {
			if (newColumnHeaders.indexOf(e) === -1) {
				newColumnHeaders.push(e);
			}
		});


		var new_table = [];
		keyColumns.forEach(function(e) {new_table.push([]);});

		newColumnHeaders.forEach(function(e, i) {
			var col = [];
			col.name = e;
			new_table.push(col);
		});

		var reduction = {};
		var reduction_index = 0;
		for (var r = start_row; r < end_row; r++) {
			var key = keyColumns.map(function(e){return e.get_raw(r);}).join('*');
			if (reduction[key]===undefined) {
				reduction[key] = reduction_index;

				for (var i = 0; i < keyColumns.length; i++) {
					var col = keyColumns[i];
					new_table[i][reduction_index] = col.get_raw(r);
				}
				reduction_index += 1;
			}

			index = reduction[key];
			header = headerColumn[r];
			measure = valueCol[r];

			new_table[keyColumns.length + newColumnHeaders.indexOf(header)][index] = measure;
		}

		var length = table.cols();
		for(var i = 0; i < length; ++i){
			table.removeColumn(0);
		}

		var name, valueCols = [];
		new_table.forEach(function(col, i) {
			if (i < keyColumns.length) {
				name = keyColumns[i].name();
			}
			else {
				name = col.name
			}
			table.addColumn(name, col, dv.type.nominal);

			if (i >= keyColumns.length) {
				valueCols.push(name);
			}
		});

		return { toKeyRows:[-1], toHeaderCols:columns, toValueCols:[valueCol], valueCols:valueCols.map(function(c){return table[c]}).filter(function(c){return c!=undefined})};
	}

	t.description_length = function(){
		if(t._measure==='State') return 1;
		return 0;
	}

	t.well_defined = function(table){
		if(t._column && t._column.length === 1 && t._measure && t._measure != t._column[0] && (!table || table.length >= 3)){

			var col = table[t._column[0]];
			return true;
		}

		return false;
	}

	t.check_validity = function(tables){
		var x = t.valid_columns(tables);
		if(x.valid) {
			var col = t.getTable(tables)[t._measure]
			if(col){
				return {valid:true}
			}
			else{
				return {valid:false, errors:['Invalid Measure']}
			}
		}
		else{
			return x;
		}
	}

	t.translate = function(schema, table_query, toDelete){
			var toHeaderNames = t.column(),
			keyColumns = schema.filter(function(c){return toHeaderNames.indexOf(c)===-1 && t._measure != c});

		var headerColumn = t.column()[0];
		var newColumnHeaders;

    if (!toDelete) {
      var columnHeaderQueries = "SELECT DISTINCT " + (headerColumn) + " FROM " + table_query + ";"
      return {query:columnHeaderQueries, schema:toDelete};
    }



    newColumnHeaders = toDelete;
    var groupByColumns = keyColumns.map(function(c){return c}).join(' ,');

    var query = "SELECT " + groupByColumns + ", " +
       newColumnHeaders.map(function(header){return "last_non_null(case when " + headerColumn + " = " + header + " then " + t._measure + " else NULL end) as \"" + header + '"' }).join(',')
       + " from " + table_query + " group by " + groupByColumns + ";"
    return {query:query, schema:groupByColumns};
	}
	t.name = dw.transform.UNFOLD;
	return t;
}

