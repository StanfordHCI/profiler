dw.drop = function(column){
	var t = dw.transform(column);
	t._drop = true;
	dw.ivar(t, [])
	t.description = function(){
		return [
			'Drop',
			dw.column_clause(t, t._column, 'column', {editor_class:'droppedColumn'})		]
	}
	t.apply = function(tables){
		var table = t.getTable(tables),
			  columns = t.columns(table);
		if(t._drop){
			columns.forEach(function(col){
				table.removeColumn(col.name());
			})
		}
		return {droppedCols:columns}
	}
	t.name = dw.transform.DROP;
	return t;
}
