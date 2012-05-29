/*Fill Direction*/
dw.LEFT = 'left';
dw.UP = 'up';
dw.DOWN = 'down';
dw.RIGHT = 'right';

dw.translate = function(column){
	var t = dw.transform(column);
	dw.ivar(t, [
		{name:'direction', initial:dw.DOWN},{name:'values', initial:1}
	])

	t.description_length = function(){
		if(t._row){
			return t._row.description_length();
		}
		return 0;
	}

	t.description = function(){
		return [
			'Translate',
			dw.column_clause(t, t._column),
			dw.select_clause(t, {select_options:{'up':'up', 'down':'down'}, param:'direction'})


		]
	}

	t.apply = function(tables){
		var table = t.getTable(tables),
			columns = t.columns(table),
			rows = table.rows(),
			row = t._row || dw.row(),
			values,
			method = t._method,
			direction = t._direction;

		var newCols = []
		columns.forEach(function(col){
			var index = col.index();

			if(t._direction===dw.DOWN)
			var newValues;
			switch(t._direction){
				case dw.DOWN:
					newValues = col.slice(0);
					newValues.unshift(undefined);
					break
				case dw.UP:
					newValues = col.slice(1);
					break;
			}

			newValues.name = 'translate'
			newValues.type = col.type;
			newValues.wrangler_type = col.wrangler_type;
			newValues.wrangler_role = col.wrangler_role;
			table.addColumn(newValues.name, newValues, newValues.type, {index:index+1, wranglerType:newValues.wrangler_type});
			newCols.push(newValues)
		})

		return {newCols:newCols}

	}





	t.enums = function(table){
		return ['direction'];
	}

	t.name = dw.transform.TRANSLATE;
	return t;
}
