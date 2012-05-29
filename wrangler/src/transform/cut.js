dw.cut = function(column){
	var t = dw.textPattern(column);
	t._drop = true;
	t.transform = function(values){
		if(values[0]===undefined) return []
		if(t._positions && t._positions.length){
			var val = ""+values[0]
			var indices = t._positions;
			var startIndex = indices[0], endIndex = indices[1] || indices[0];
			var splitValues = [];
			splitValues.push(val.substring(0,startIndex) + val.substring(endIndex))
			splitValues.stats = [{splits:[{start:startIndex, end:endIndex}]}]
			return splitValues;
		}
		else{
			var val;
			var z = [];
			for(var v = 0; v < values.length; ++v){
				val = values[v];
				var params = {which:t._which, max_splits:t._max, before:t._before,after:t._after,on:t._on,ignore_between:t._ignore_between}
				var cuts = dw.regex.match(val, params);
				var cutValues = [];
				cutValues.stats = [];
				for(var i = 0; i < cuts.length; ++i){
					if(i%2==0){
						cutValues.push(cuts[i].value)
					}
					else{
						cutValues.stats.push({splits:[{start:cuts[i].start, end:cuts[i].end}]})
					}
				}
				z.push(cutValues.join(''));
				if(!v) z.stats = cutValues.stats;
			}
			return z;
		}
	}
	t.description = function(){
		var cutStart = (t._column && t._column.length) ? 'Cut from' : 'Cut';
		var description = [
			cutStart,
			dw.column_clause(t, t._column, 'column')
		]
		regex = t.match_description();
		description = description.concat(regex)
		return description;
	}
	t.name = dw.transform.CUT;
	return t;
}
