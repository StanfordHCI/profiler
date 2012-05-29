dw.wrangle = function(){
	var w = [];

	w.apply = function(tables){
		if(typeOf(tables)==='string'){
			tables = dv.table(tables)
		}
		if(typeOf(tables)!='array'){
			tables = [tables]
		}
		w.forEach(function(t){

			if(t.active() || t.invalid()){
				var status = t.check_validity(tables);
				if(status.valid){
					t.sample_apply(tables);








					t.validate();
				}
				else{
					t.invalidate(status.errors);
				}
			}


		})


		return w;
	}

  w.translate = function(table_name, schema, toDelete) {
    var table_query = undefined;

    w.forEach(function(t){
      result = t.translate_wrapper(table_name, schema, table_query, toDelete);
      table_query = result.query;
      schema = result.schema;
    })
    return table_query;
  }

	w.add = function(t){
		w.push(t)
		return w;
	}

	return w;
}
