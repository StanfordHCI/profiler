dw.textPattern = function(column){
	var t = dw.map(column);
	dw.ivar(t, [
		{name:'on', initial:undefined},{name:'before', initial:undefined},{name:'after', initial:undefined},{name:'ignore_between', initial:undefined}, {name:'quote_character', initial:undefined},
		{name:'which', initial:1},{name:'max', initial:1}
	])
	dw.ivara(t, [{name:'positions', initial:undefined}])


	t.well_defined = function(){
		return ((t._positions && !t._on && !t._before && !t._after) || (!t._positions && (t._on || t._before || t._after))) && !t._row;
	}

	t.description_length = function(){
		if(t._positions) return 0;
		var score = dw.regex.description_length(t._on)+ dw.regex.description_length(t._before) + dw.regex.description_length(t._after)



		return score;

	}


	t.check_validity = function(tables){
		var x = t.valid_columns(tables);
		if(x.valid) {

			if(t.well_defined()){
				return {valid:true}
			}
			else{
				return {valid:false, errors:['Must define split criteria']}
			}
		}
		else{
			return x;
		}
	}

	t.match_description = function(options){
		options = options || {}
		var description = [];

		if(t._positions){
			return [
				'between positions',
				dw.column_clause(t, t._positions, options)
			]
		}


		if(t._on && t._on.toString()!="/.*/"){

			description = description.concat(
				[
					'on',
					dw.regex_clause(t,'on', options)
				]

			)
		}
		if(t._before && !t._after){
			description = description.concat(
				[
					'before',
					dw.regex_clause(t, 'before', options)
				]
			)
		}
		if(t._after && !t._before){
			description = description.concat(
				[
					'after',
					dw.regex_clause(t, 'after', options)
				]
			)
		}
		if(t._after && t._before){
			description = description.concat(
				[
					'between',
					dw.regex_clause(t, 'after', options),
					'and',
					dw.regex_clause(t, 'before', options)
				]
			)
		}
		return description;
	}

	return t;
}
