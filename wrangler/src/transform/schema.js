dw.set_type = function(column, types){
	var t = dw.transform(column);
	dw.ivara(t, [{name:'types', initial:types || []}])

	t.description = function(){
		return [
		]
	}

	t.apply = function(tables){
		var table = t.getTable(tables),
			columns = t.columns(table);

		columns.forEach(function(col, i){
			col.wrangler_type = t._types[i]
		})

		return {}

	}

	t.name = dw.transform.SET_TYPE;

	return t;
}

dw.promote = function(column) {
  var t = dw.transform(column);
	t._drop = true;
	dw.ivar(t, [{name:'header_row', initial:0}])
	t.transform = function(values){

	}

	t.well_defined = function(){
		return t._header_row != undefined
	}

	t.description = function(){
	}

	t.apply = function(tables){
		var table = t.getTable(tables),
			columns = t.columns(table);
		if(t._header_row!=undefined){
			var row = table.row(t._header_row);
			table.forEach(function(c, i){
				var val = row[i];
				if(dw.is_missing(val)) val = 'undefined';
				c.name(val)


				if(t._drop){
					c.splice(t._header_row, 1)
				}
			})
			return {promoteRows:[-1, t._header_row]}
		}
		return {}
	}

	t.name = dw.transform.PROMOTE;

	return t;
};


dw.set_name = function(column, names){
	var t = dw.transform(column);
	t._drop = true;
	dw.ivara(t, [{name:'names', initial:names || []}])
	dw.ivar(t, [{name:'header_row', initial:undefined}])
	t.transform = function(values){

	}

	t.well_defined = function(){
		return t._names.length || t._header_row != undefined
	}

	t.description = function(){
		if(t._header_row!=undefined){
			row = t._header_row;

			if(typeOf(row)==='number') row = dw.row(dw.rowIndex([t._header_row]))
			return [
				'Promote row',
				dw.key_clause(t, [t._header_row], 'header_row'),
				' to header'
			];
		}
		else{
			return [
				'Set ',
				dw.column_clause(t,  t._column, 'column', {extra_text:""}),
				' name to ',
				dw.input_clause(t, 'names')
			];
		}
	}

	t.apply = function(tables){
		var table = t.getTable(tables),
			columns = t.columns(table);
		if(t._header_row!=undefined){
			var row = table.row(t._header_row);
			table.forEach(function(c, i){
				var val = row[i];
				if(dw.is_missing(val)) val = 'undefined';
				c.name(val)


				if(t._drop){
					c.splice(t._header_row, 1)
				}
			})
			return {promoteRows:[-1, t._header_row]}
		}
		else{
			columns.forEach(function(col, i){
				col.name(names[i])


			})
		}
		return {}
	}

	t.name = dw.transform.SET_NAME;

	return t;
};
