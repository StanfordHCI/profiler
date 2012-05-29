dw.edit = function(column){
	var t = dw.textPattern(column);
	t._update = true;
	dw.ivar(t, [{name:'to', initial:undefined},{name:'update_method', initial:undefined}])




	t.transform = function(values){
		var mapper;
		if(t._to != undefined){
			mapper = function(){return t._to;};
		}
		else if(t._update_method){

			switch(t._update_method){
				case dw.edit.upper:
					mapper = function(v){
						if(v!=undefined){}
							return v.toUpperCase();
					}
					break
				case dw.edit.lower:
					mapper = function(v){
						if(v!=undefined){
							return v.toLowerCase();
						}

					}
					break
				case dw.edit.capitalize:
					mapper = function(v){
						if(v!=undefined)
							if(v.length >= 1)
								return v[0].toUpperCase()+v.substr(1);
						}
					break
				case dw.edit.uncapitalize:
					mapper = function(v){
						if(v!=undefined)
							if(v.length >= 1)
								return v[0].toLowerCase()+v.substr(1);
						}
					break
				default:
					throw('Illegal update update_method');
			}
		}

		return values.map(function(v){return v!=undefined?''+v:undefined}).map(mapper);

	}

	t.description = function(){

		var description = [
			'Edit',
			dw.column_clause(t, t._column, 'column', {editor_class:'none'})
		]

		regex = t.match_description();


		description = description.concat(regex)

		if(t._row){
			description.push(dw.row_clause(t, t._row, 'row'))
		}

		if(t._to != undefined){
			description.push(' to \'')
			description.push(dw.input_clause(t, 'to'));
			description.push('\'')
		}

		else if(t._update_method){
			description.push(dw.select_clause(t, {select_options:{'LOWER':' to lowercase','CAPITALIZE':' capitalize','UNCAPITALIZE':' uncapitalize', 'UPPER':'to uppercase'}, param:'update_method'}))
		}



		return description;

	}

	t.well_defined = function(){

		return (t._column.length===1 && (t._to != undefined || t._update_method != undefined));
	}



	t.name = dw.transform.EDIT;

	return t;
}

dw.edit.upper = 'UPPER';
dw.edit.lower = 'LOWER';
dw.edit.capitalize = 'CAPITALIZE';
dw.edit.uncapitalize = 'UNCAPITALIZE';