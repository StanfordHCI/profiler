dw.markdown = function(column){
	var t = dw.map(column);
	t._update = true
	t.transform = function(values){

		return values.map(function(v){
			var strInputCode = v;
	 	 	strInputCode = strInputCode.replace(/&(lt|gt);/g, function (strMatch, p1){
	 		 	return (p1 == "lt")? "<" : ">";
	 		});
	 		var strTagStrippedText = strInputCode.replace(/<\/?[^>]+(>|$)/g, "");
	 		return strTagStrippedText;
		})




	}


	t.description = function(){
		return [
			'Remove markup from',
			dw.column_clause(t, t._column, 'column')
		]
	}

	t.well_defined = function(table){
		return t._column.length > 1;
	}

	t.name = dw.transform.MARKDOWN;

	return t;
}


