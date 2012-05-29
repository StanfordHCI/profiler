dw.split = function(column){
	var t = dw.textPattern(column);

	t._drop = true;
	t.transform = function(values){
		if(t._positions && t._positions.length){
			if(values[0]===undefined) return []
			var val = ""+values[0]
			var indices = t._positions;
			var startIndex = indices[0], endIndex = indices[1] || indices[0];
			var splitValues = [];
			splitValues.push(val.substring(0, startIndex))
			splitValues.push(val.substring(endIndex))
			splitValues.stats = [{splits:[{start:startIndex, end:endIndex}]}]
			return splitValues;
		}
		else{
			var ignore_between, qc;
			if((qc = t._quote_character) != undefined){
				ignore_between = new RegExp(qc+'[^'+qc+']*'+qc);
			}
			var params = {which:t._which, max_splits:t._max, before:t._before,after:t._after,on:t._on,ignore_between:ignore_between || t._ignore_between}
			var splits = dw.regex.match(values[0], params);



			var splitValues = [];
			splitValues.stats = [];
			for(var i = 0; i < splits.length; ++i){
				if(i%2==0){
					splitValues.push(splits[i].value)
				}
				else{
					splitValues.stats.push({splits:[{start:splits[i].start, end:splits[i].end}]})
				}
			}


			return splitValues;
		}
	}

	t.description = function(table){

		var description = [
			'Split',
			dw.column_clause(t, t._column, 'column', {editor_class:'none'})
		]


		if(Number(t._max) === 0){

			description = description.concat(dw.select_clause(t, {select_options:{'0':'repeatedly','1':'once'},param:'max'}))
		}
		regex = t.match_description();


		description = description.concat(regex)

		if(t._result === dw.ROW){
			description = description.concat(' into ')
			description = description.concat(dw.select_clause(t, {select_options:{'row':'rows'}, param:'result'}))
		}



		return description;

	}



	t.name = dw.transform.SPLIT;

	return t;
}
