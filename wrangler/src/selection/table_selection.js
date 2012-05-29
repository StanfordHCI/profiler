dw.table_selection = function(){
	var ts = {}, rowSelection = dw.selection(), colSelection = dw.selection();

	ts.add = function(selection){
		var keytype;
		if(selection.shift){
			keytype = dw.selection.shift;
		}
		else if(selection.ctrl){
			keytype = dw.selection.ctrl;
		}

		switch(selection.type){
			case dw.engine.row:
				rowSelection.add({type:keytype, selection:selection.position.row})
				colSelection.clear()
				break
			case dw.engine.col:
				colSelection.add({type:keytype, selection:selection.table[selection.position.col].index})
				rowSelection.clear()
				break
			default:
		}
		return ts;
	}

	ts.clear = function(){
		rowSelection.clear();
		colSelection.clear();
	}

	ts.selection = function(){
		return {rows:rowSelection, cols:colSelection}
	}

	ts.rows = function(){
		return rowSelection.slice(0);
	}

	ts.cols = function(){
		return colSelection.slice(0);
	}



	return ts;
}

dw.table_selection.row = 'row';
dw.table_selection.col = 'col';
dw.selection = function(){
	var selection = []
	var history = [];
	selection.add = function(s){
		var e = s.selection, index, last, range;
		switch(s.type){
			case dw.selection.ctrl:
				index = selection.indexOf(e);
				if(index===-1){
					selection.push(e)
				}
				else{
					selection.splice(index, 1)
				}
				break
			case dw.selection.shift:
				if(selection.length){
					last = history[history.length-1];
					if(last.type!=dw.selection.clear){
						range = (last.selection < e) ? dv.range(last.selection, e+1) : dv.range(e, last.selection+1);
						range.forEach(function(r){
							if(selection.indexOf(r) === -1){
								selection.push(r)
							}
						})
					}
				}
				else{
					selection.push(e)
				}
				break;
			case dw.selection.clear:
				selection.length = 0;
				break;
			default:
				selection.length = 0;
				selection.push(e)
		}
		history.push(s)
		return selection;
	}

	selection.clear = function(){
		selection.add({type:dw.selection.clear})
	}

	return selection;
}

dw.selection.ctrl = 'ctrl'
dw.selection.shift = 'shift'
dw.selection.clear = 'clear'
