dw.corpus = function(){
	var corpus = {};

	/*Todo: update this with live feed to corpus*/
	corpus.frequency = function(transform, o){
		o = o || {};
		var inputs = o.inputs || [], input = inputs[inputs.length-1];

		if(input){
			switch(input.type){
				case dw.engine.highlight:
					if(input && input.params.start!=undefined){
						if(input.params.end - input.params.start > 1){
							switch(transform.name){
								case dw.transform.SPLIT:

									return 9;

								case dw.transform.EXTRACT:

									return 24;

								case dw.transform.CUT:

									return 10;

								case dw.transform.FILTER:

										return 8;
							}
						}
					}
					break;
				case dw.engine.row:
					var t = dw.row(dw.empty().formula()).tester([input.params.table]);

					for(var i = 0; i < input.params.rows.length; ++i){
						if(t.test(input.params.table, input.params.rows[i])){
							if(transform.name===dw.transform.FILL){
								return 0;
							}
						}
					}


					if(transform.name===dw.transform.SET_NAME){
						var rows = input.params.rows;
						if(rows.length === 1 && rows[0] < 4){
							if(!dw.row(dw.empty().percent_valid(80)).test(input.params.table, rows[0])){
								return 40
							}
						}

					}

			}
		}





		switch(transform.name){
			case dw.transform.SPLIT:

				return 35;

			case dw.transform.EXTRACT:

				return 32;

			case dw.transform.CUT:

				return 28;

			case dw.transform.DROP:

				return 13;

			case dw.transform.FOLD:

				return 12;

			case dw.transform.UNFOLD:
				if(input && input.params.table.length > 3){
					return 0;
				}

				return 8;


				case dw.transform.SET_NAME:

					return 4;

						case dw.transform.SHIFT:

							return 5;

			case dw.transform.FILL:

				return 21;

			case dw.transform.MERGE:

				return 3;

				case dw.transform.COPY:

					return 6;



			case dw.transform.FILTER:

				return 25;
		}

	}

	corpus.top_transforms = function(o, k){
		o = o || {};
		var transform = o.transform, given_params = o.given_params, needed_params = o.needed_params, table = o.table;

		switch(transform.name){
			case dw.transform.FILL:
				if(given_params.indexOf('column')===-1&&needed_params.indexOf('direction')!=-1){
					var column = transform.column(), row = transform.row();
					if(column && column.length!=1 && row){
						return [transform.clone().direction(dw.RIGHT),/*transform.clone().direction(dw.LEFT),*/ transform.clone().direction(dw.DOWN), transform.clone().direction(dw.UP)]
					}
					else{
						return [transform.clone().direction(dw.DOWN),transform.clone().direction(dw.UP),/*transform.clone().direction(dw.LEFT),*/ transform.clone().direction(dw.RIGHT)]
					}
				}
				else{
					return [transform.clone().direction(dw.DOWN),transform.clone().direction(dw.UP),/*transform.clone().direction(dw.LEFT),*/ transform.clone().direction(dw.RIGHT)]
				}
				return [transform.clone()]
			case dw.transform.FOLD:
				if(given_params.indexOf('keys')===-1)
					return [transform.clone().keys([-1]),transform.clone().keys([0]),transform.clone().keys([0,1]),transform.clone().keys([0,1,2])]

				if(given_params.indexOf('column')===-1){
					return [transform.clone()].concat(get_columns(table, [dt.type.integer(), dt.type.string()]).map(function(c){return transform.clone().column(c)}))
				}

				return [transform.clone()]

			case dw.transform.UNFOLD:
				if(given_params.indexOf('measure')===-1){

					return get_columns(table, [dt.type.integer(), dt.type.number(), dt.type.string()]).map(function(c){return transform.clone().measure(c)})


				}
				return [transform.clone()]

			default:
				return [transform.clone()]
		}
	}

	get_columns = function(table, type_hierarchy, count){
		var cols = table.slice(0);
		cols.map(function(c){})
		cols.sort(function(a, b){
			var aindex = type_hierarchy.indexOf(a.type.name())
			var bindex = type_hierarchy.indexOf(b.type.name())

			if(aindex===-1) aindex = 1000000;
			if(bindex===-1) bindex = 1000000;

			if(aindex < bindex) return -1;
			if(bindex < aindex) return -1;

			return 0;
		})
		return cols.slice(0, count).map(function(c){return c.name()})
	}
	return corpus;
}
