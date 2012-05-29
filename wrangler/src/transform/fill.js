/*Fill Direction*/
dw.LEFT = 'left';
dw.UP = 'up';
dw.DOWN = 'down';
dw.RIGHT = 'right';
/*Fill Method*/
dw.COPY = 'copy';
dw.INTERPOLATE = 'interpolate';

dw.fill = function(column){
	var t = dw.transform(column);
	dw.ivar(t, [
		{name:'direction', initial:dw.DOWN},{name:'method', initial:dw.COPY},{name:'row', initial:undefined}
	])

	t.description_length = function(){
		if(t._row){
			return t._row.description_length();
		}
		return 0;
	}

	t.description = function(){
		return [
			'Fill',
			dw.column_clause(t, t._column, 'column', {all_columns:true}),
			dw.row_clause(t, t._row, 'row', {editor_class:'updatedColumn'}),
			'with',


			'values from',
			dw.select_clause(t, {select_options:{'right':'the left', 'left':'the right', 'up':'below', 'down':'above'}, param:'direction'})

		]
	}

	t.apply = function(tables, options){
		options = options || {};
		var table = t.getTable(tables),
			columns = t.columns(table),
			rows = table.rows(),
			row = (t._row || dw.row()).tester(tables),
			values, missing = dt.MISSING, error = dt.ERROR,
			start_row =  0,
			end_row =  rows,
			method = t._method,
			direction = t._direction;



		if(method === dw.COPY){
			var col, v, fillCode, rawValue;
			if(direction === dw.DOWN){
				for(var c = 0; c < columns.length; ++c){
					col = columns[c];
					fillCode = undefined;
					rawValue = undefined;
					for(var i = start_row; i < end_row; ++i){
						v = col[i];
						if (v === missing) {
							if (row.test(table, i)) {
								col.set_code_and_raw(i, fillCode, rawValue);
							}
						}
						else {
						  fillCode = v;
						  rawValue = col.get_raw(i);
					  }
					}
				}
			}
			else if(direction === dw.RIGHT){
				for(var i = start_row; i < end_row; ++i){
					if(row.test(table, i)){
						fillCode = undefined;
						rawValue = undefined;
						for(var c = 0; c < columns.length; ++c){
							col = columns[c];
							v = col[i];
							if(v === missing) col.set_code_and_raw(i, fillCode, rawValue);
							else {
							  fillCode = v;
							  rawValue = col.get_raw(i);
						  }
						}
					}
				}
			}
			else if(direction === dw.LEFT){
				for(var i = start_row; i < end_row; ++i){
					if(row.test(table, i)){
						fillValue = undefined;
						rawValue = undefined;
						for(var c = columns.length-1; c >= 0; --c){
							col = columns[c];
							v = col[i];
							if(v === missing) col.set_code_and_raw(i, fillCode, rawValue);
							else {
							  fillCode = v;
							  rawValue = col.get_raw(i);
						  }
						}
					}
				}
			}
			else if(direction === dw.UP){
				for(var c = 0; c < columns.length; ++c){
					col = columns[c]
					fillCode = undefined;
					rawValue = undefined;
					for(var i = end_row-1; i >= start_row; --i){
						v = col[i];
						if(v === missing){
							if(row.test(table, i)){
								col.set_code_and_raw(i, fillCode, rawValue);
							}
						}
						else {
						  fillCode = v;
						  rawValue = col.get_raw(i)
					  }
					}
				}
			}
		}

		return {updatedCols:columns}

	}


	t.horizontal = function(){
		return t._direction===dw.LEFT || t._direction===dw.RIGHT;
	}

	t.well_defined = function(table){




		var columns = t.columns(table);

		var horizontal = t.horizontal();


		if(t._row){
			if (t._row.formula() === 'empty()') return false;
		}


		if(t.horizontal()){
			if(columns.length === 1){
						return false;
			}
			var col, seenMissingAfterNonMissing=false, seenNonMissing=false;

			if(t._row===undefined){
				if(t._direction===dw.LEFT){
					for(var i = 0; i < columns.length;++i){
						col = columns[i];
						if(dw.summary(col)['missing'].length===0){
							if(seenNonMissing){
								seenMissingAfterNonMissing=true;
								break;
							}
						}
						else{
							seenNonMissing=true;
						}
					}
				}
				else if(t._direction===dw.RIGHT){
					for(var i = columns.length-1; i >=0 ;--i){
						col = columns[i];
						if(dw.summary(col)['missing'].length===0){
							if(seenNonMissing){
								seenMissingAfterNonMissing=true;
								break;
							}
						}
						else{
							seenNonMissing=true;
						}
					}

				}


				if(!seenMissingAfterNonMissing) return false;
			}





		}
		else{

			var missingCols = columns.filter(function(col){
				var missing = dw.summary(col)['missing'];
				return missing.length === 0;
			});
			if(missingCols.length)
				return false;
		}







		return true;
	}

	t.enums = function(table){
		return ['direction'];
	}

	t.name = dw.transform.FILL;
	return t;
}
