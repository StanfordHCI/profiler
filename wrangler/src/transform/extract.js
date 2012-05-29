dw.extract = function(column){
	var t = dw.textPattern(column);
	t.transform = function(values){
		if(values[0]===undefined) return []
		if(t._positions && t._positions.length){
			var val = ""+values[0]
			var indices = t._positions;
			var startIndex = indices[0], endIndex = indices[1] || indices[0];
			var splitValues = [];
			if(endIndex <= val.length){
				splitValues.push(val.substring(startIndex, endIndex))
				splitValues.stats = [{splits:[{start:startIndex, end:endIndex}]}]
			}
			return splitValues;
		}
		else{
			var params = {which:t._which, max_extracts:t._max, before:t._before,after:t._after,on:t._on,ignore_between:t._ignore_between}
			var extracts = dw.regex.match(values[0], params);
			var extractValues = [];
			extractValues.stats = [];
			for(var i = 0; i < extracts.length; ++i){
				if(i%2==1){
					extractValues.push(extracts[i].value)
					extractValues.stats.push({splits:[{start:extracts[i].start, end:extracts[i].end}]})
				}
			}



			return extractValues;
		}
	}

	t.description = function(){

		var description = [
			'Extract from',
			dw.column_clause(t, t._column, 'column', {editor_class:'none'})
		]

		regex = t.match_description({editor_class:'extract'});

		description = description.concat(regex)


		return description;

	}

	t.name = dw.transform.EXTRACT;

	return t;
}
