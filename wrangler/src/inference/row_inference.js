dw.row_inference = function(){
	var r = {};

	r.candidates = function(table, records, o){

		o = o || {}
		var type = o.type || dw.engine.row, candidates = [];

		if(records.length){
			switch(type){
				case dw.engine.row:

					var index = dw.row(dw.rowIndex(records).formula());
					candidates.push({row:index})
					candidates.push({keys:records})
					if(records.length===1){
						candidates.push({header_row:records[0]})
					}
          candidates = candidates.concat(enumerateEmpty(table, records))
          candidates = candidates.concat(enumerateRowEquals(table, records))


					return candidates;

				case dw.engine.highlight:
          return [];
					records = records.filter(function(r){return r.text.length > 0});

					candidates = candidates.concat(enumerateEquals(table, records))
					candidates = candidates.concat(enumerateStartsWith(table, records))
					candidates = candidates.concat(enumerateContains(table, records))

					return candidates;
			}
		}


		return []

	}


	var enumeratePromote = function(table, records, o){
		var candidates = [];
		if(records.length === 1){
			var r = records[0];
			if(r < 5){

			}
		}
		return candidates.map(function(c){return {row:c}});
	}


	var enumerateRowEquals = function(table, records, o){
		var candidates = [];
		if(records.length){
			table.forEach(function(col){
				var val = col.get_raw(records[records.length-1]);
				if(val)
          candidates = candidates.concat([dw.row(col.name() + " = '" + val + "'")])

				else{
          candidates = candidates.concat([dw.row(col.name() + " is missing ")])

				}
			})
		}

		candidates = candidates.filter(function(c){
			var tester = c.tester([table])
			for(var i = 0; i < records.length; ++i){
				if(tester.test(table, records[i])===0){
					return false;
				}
			}
			return true;
		})
		return candidates.map(function(c){return {row:c}});
	}

	var enumerateRowCycle = function(table, records, o){

		if(records.length >= 2){
			var sortedRecords = records.slice().sort(function(a,b){return a-b > 0});
			var difference = sortedRecords[1]-sortedRecords[0];

			if(difference===1) return [];

			for(var i = 1; i < sortedRecords.length - 1; ++i){
				if(sortedRecords[i+1]-sortedRecords[i]!=difference){
					return []
				}
			}

			var all = dw.row(dw.rowCycle(difference, sortedRecords[0]%difference))



			var t = [all].reverse()

			return t.map(function(x){return {row:x}})

		}

		return [];




	}


	var enumerateEquals = function(table, records, o){
		if(records.length > 0){
			var record = records[records.length-1];
			if(record.start === 0 && record.end === record.text.length){
				var t = dw.row(dw.eq(record.col, record.text.substring(record.start, record.end), true));
				return [{row:t}]

			}
		}
		return []
	}



	var enumerateStartsWith = function(table, records, o){

		if(records.length > 0){
			var record = records[records.length-1];

			if(record.start === 0){
				var t = dw.row(dw.starts_with(record.col, record.text.substring(record.start, record.end), true));
				return [{row:t}]
			}
		}
		return []

	}

	var enumerateContains = function(table, records, o){

		if(records.length > 0){
			var record = records[records.length-1];
			var t = dw.row(dw.contains(record.col, record.text.substring(record.start, record.end), true));
			return [{row:t}]

		}
		return []

	}


	var enumerateIsNull = function(table, records, o){

	}



	var enumerateEmpty = function(table, records, o){
		var t = dw.row(dw.empty().formula()).tester([table]);
		for(var i = 0; i < records.length; ++i){
			if(!t.test(table, records[i])){
				return []
			}
		}
		return [{row:dw.row(dw.empty().formula())}]
	}


	return r;
}
