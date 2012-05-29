enable_proactive = false;
enable_hyperactive = false;

dw.engine = function(options){
	var engine = {}, options = options || {}, transform_set = options.transform_set || dw.engine.transform_set, corpus = options.corpus || dw.corpus(), workingTransform;

	dw.ivar(engine, [{name:'table', initial:undefined}]);
	dw.ivara(engine, [{name:'inputs', initial:[]}]);

	engine.run = function(k){
		var params = inferSelection().concat(inferRow()).concat(inferCol()).concat(inferEdit());

		var inferredTransforms = inferTransforms(params, k);
		var promotes = filterInputs([dw.engine.promote, dw.engine.param]);





		if (enable_proactive &&
				inferredTransforms.length==1 &&
				((promotes.length==0 && inferredTransforms[0]===undefined) ||
				 (promotes.length > 0))) {
			var nRows = engine._table.rows();
			var nCols = engine._table.cols();

			var stateScore = dw.calc_state_score(engine._table);
			var numUniques = dw.num_unique_elts(engine._table);
			var potentialSuggestions = [];









			var colsToDelSet = {};

			var emptyColNames = [];

			for (var c = 0; c < nCols; c++) {
				var col = engine._table[c];









				var onlyEmptyRowsMissing = true;

				var numMissing = 0;
				for (var r = 0; r < nRows; r++) {
					var elt = col[r];
					if (dw.is_missing(elt)) {
						numMissing++;

						if (onlyEmptyRowsMissing) {
							var rowContents = engine._table.row(r);
							var rowIsEmpty = (rowContents.filter(dw.is_missing).length == rowContents.length);
							if (!rowIsEmpty) {
								onlyEmptyRowsMissing = false;
							}
						}
					}
				}


				if (numMissing == nRows) {

					emptyColNames.push(col.name());



				}
				else {

					if (numMissing >= (nRows / 2)) {

					}

					var hasCommas = false;
					var hasColons = false;
					var hasPipes = false;
					var hasTabs = false;

					col.forEach(function(elt) {
						if (elt) {

							var commas = elt.match(/,/g);
							var colons = elt.match(/\:/g);
							var pipes = elt.match(/\|/g);
							var tabs = elt.match(/\t/g);






							if (commas) hasCommas = true;
							if (colons) hasColons = true;
							if (pipes) hasPipes = true;
							if (tabs) hasTabs = true;
						}
					});








					/* nix this suggestion for now since Jeff thinks it's too brittle
						 and might result in false positives like important rows hidden
						 'below the fold' being erroneously deleted


					if (numMissing > 0 && !onlyEmptyRowsMissing) {


						var nullEltsStr = col.map(dw.is_missing).join();
						if (colsToDelSet[nullEltsStr] === undefined) {
							potentialSuggestions.push(dw.filter().row(dw.row(dw.is_null(col.name))));

							colsToDelSet[nullEltsStr] = 1;
						}
					}
					*/
				}
			}















			for (var r = 0; r < nRows; r++) {
				var rowElts = engine._table.row(r);
				var numMissing = rowElts.filter(dw.is_missing).length;
				var pctMissing = numMissing / rowElts.length;


				if (pctMissing > 0.5 && pctMissing < 1) {





				}
			}





			var foldColNames = engine._table.slice_cols(1, engine._table.cols()).map(function(e) {return e.name()});





			var numFoldedColumns = foldColNames.length;




			if (nRows > 1 && numFoldedColumns > 1) {



				var allHeaderNamesMeaningful = true;

				for (var i = 1; i < nCols; i++) {
					if (!engine._table[i].nameIsMeaningful) {
						allHeaderNamesMeaningful = false;
						break;
					}
				}

				if (allHeaderNamesMeaningful && dw.is_slice_all_valid_and_unique(engine._table[0], 0)) {
					potentialSuggestions.push(dw.fold(foldColNames).keys([-1]));
				}

				if (dw.is_slice_all_valid_and_unique(engine._table[0], 1)) {
					potentialSuggestions.push(dw.fold(foldColNames).keys([0]));
				}
			}
			if (nRows > 2 && numFoldedColumns > 2 &&
					dw.is_slice_all_valid_and_unique(engine._table[0], 2)) {
				potentialSuggestions.push(dw.fold(foldColNames).keys([0, 1]));
			}
			if (nRows > 3 && numFoldedColumns > 3 &&
					dw.is_slice_all_valid_and_unique(engine._table[0], 3)) {
				potentialSuggestions.push(dw.fold(foldColNames).keys([0, 1, 2]));
			}



			if (nCols >= 3 && nCols <= 5) {


				for (var c1 = 0; c1 < nCols; c1++) {
					for (var c2 = 0; c2 < nCols; c2++) {

						if (c1 == c2) {
							continue;
						}

						otherColsIndices = [];
						for (var i = 0; i < nCols; i++) {
							otherColsIndices.push(i);
						}
						otherColsIndices.splice(otherColsIndices.indexOf(c1), 1);
						otherColsIndices.splice(otherColsIndices.indexOf(c2), 1);

						var c1Col = engine._table[c1];
						var c2Col = engine._table[c2];
						var otherCols = otherColsIndices.map(function(c) {return engine._table[c]});

						var c1Summary = dw.summary(c1Col);
						var c2Summary = dw.summary(c2Col);
						var otherColsSummaries = otherCols.map(dw.summary);



						if (c1Summary.missing.length > 0) {
							continue;
						}
						if (otherColsSummaries.filter(function(e) {return (e.missing.length > 0)}).length > 0) {
							continue;
						}



						if (c1Summary.bparse.length > 0) {
							continue;
						}
						if (otherColsSummaries.filter(function(e) {return (e.bparse.length > 0)}).length > 0) {
							continue;
						}

						potentialSuggestions.push(dw.unfold(c1Col.name()).measure(c2Col.name()));
					}
				}
			}



			var scoredCandidates = [];

			for (var i = 0; i < potentialSuggestions.length; i++) {
				var tableCopy = engine._table.slice();
				var curSuggestion = potentialSuggestions[i];
				curSuggestion.apply([tableCopy]);

				var transformType = curSuggestion.description()[0];




				if (transformType == "Unfold") {
					var measureCol = engine._table[curSuggestion._measure];






					var endIdx = tableCopy.cols();

					var flattenedSubmatrix = [];
					for (var c = nCols - 2; c < endIdx; c++) {
						var col = tableCopy[c];


						for (var r = 0; r < tableCopy.rows(); r++) {
							flattenedSubmatrix.push(col[r]);
						}
					}

					var measureColStats = dw.get_column_stats(measureCol, nRows);


					var flattenedSubmatrixStats = dw.get_column_stats(flattenedSubmatrix, flattenedSubmatrix.length);


					var measureColScore = (1 - measureColStats.colHomogeneity) +
																(measureColStats.numMissing / nRows);
					var flattenedSubmatrixScore = (1 - flattenedSubmatrixStats.colHomogeneity) +
																				(flattenedSubmatrixStats.numMissing / flattenedSubmatrix.length);

					/*
					console.log(curSuggestion.description().map(function(e) {
						if (e.description) {
							return e.description();
						}
						else {
							return e;
						}}).join(' '), measureColScore, flattenedSubmatrixScore, flattenedSubmatrixScore - measureColScore);
					*/


					if (flattenedSubmatrixScore <= measureColScore) {
						scoredCandidates.push([flattenedSubmatrixScore - measureColScore, curSuggestion]);
					}
				}
				else {
					var newScore = dw.calc_state_score(tableCopy);
					var newNumUniques = dw.num_unique_elts(tableCopy);

					/*
					console.log(curSuggestion.description().map(function(e) {
						if (e.description) {
							return e.description();
						}
						else {
							return e;
						}}).join(' '), newScore, stateScore - newScore, 'Data loss:', numUniques-newNumUniques);
					*/

					if (newScore < stateScore) {
						scoredCandidates.push([stateScore - newScore, curSuggestion]);
					}
				}
			}


			scoredCandidates.sort(function(a, b) {return b[0] - a[0];});

			params = scoredCandidates.map(function(e) {return e[1];});




			var promotes = filterInputs([dw.engine.promote, dw.engine.param]);
			var promote = promotes[promotes.length-1];
			var workingTransform = (promote && promote.transform);

			if (workingTransform) {

				params.unshift(workingTransform);



				params = params.filter(function(t, i){
					if(i===0 || t===undefined) return true;
					if(params[0] && t.equals(params[0])){
						return false;
					}
					return true;
				});
			}
			else {

				params.unshift(undefined);
			}

			return params;
		}


		return inferredTransforms.slice(0, k);
	}

	engine.input = function(input){
		engine._inputs.push(input)
		return engine;
	}

	engine.restart = function(){

	}

	engine.promoted_transform = function(){
		var promotes = filterInputs([dw.engine.promote, dw.engine.param, dw.engine.filter]), promote = promotes[promotes.length-1];
		return promote && promote.transform;
	}

	var inferTransforms = function(params, k){

		var promotes = filterInputs([dw.engine.promote, dw.engine.param]), promote = promotes[promotes.length-1], transforms = [], tset=transform_set.slice(0);

		workingTransform = (promote && promote.transform)

		if(workingTransform){
			tset = tset.filter(function(t){return t.name!=workingTransform.name})
			tset.unshift(workingTransform)
		}

		transforms = transforms.concat(tset.reduce(function(tforms, t){
			return tforms.concat(params.filter(function(p){return !p.is_transform}).reduce(function(acc, p){
					return acc.concat(inferTransformParameterSet(t, p));
			}, []))
		}, []))

		transforms = params.filter(function(p){return p.is_transform}).concat(transforms)
		transforms = transforms.concat(inferMissing()).concat(inferBadType()).concat(inferBadRole()).concat(inferValid())
		transforms = sortTransforms(transforms)

		/* Hack because working transform is just the first suggestion */
    if (workingTransform) {
      transforms.unshift(workingTransform)
    }

		transforms = varyTransforms(transforms)
		transforms = transforms.slice(0, k).filter(function(t, i){
			if(i===0 || t===undefined) return true;

			if(transforms[0] && t.equals(transforms[0])){
				return false;
			}

			return true;
		})



		if(transforms.length === 1 && transforms[0]===undefined){
			var type = getFilterType();
			if(type)
				transforms = [dw[type]()];
		}

		return transforms;


	}

	var varyTransforms = function(transforms){
		var counts = {}, all_counts = {}, remaining_counts = {}, current, currentCount, filterType = getFilterType(), variedTransforms = [],
			exemptName = filterType || (workingTransform && workingTransform.name), maxCount = Math.max(Math.ceil(Math.min(6, transforms.length)*.33), 6);



		var total_count = 0;

		for(var i = 0; i < transforms.length; ++i){
			current = transforms[i];
			if(current===undefined){

			}
			else{
				currentCount = all_counts[current.name] || 0;
				if(current.name === exemptName){
					total_count++;
				}
				else{
					all_counts[current.name] = ++currentCount;
					if(currentCount <= maxCount){
						total_count++;
					}
				}
			}
		}

		/* Change 6 to a variable to control number of suggestions...here 6 is max number of suggestions*/
		var remaining_count = 6 - total_count;


		for(var i = 0; i < transforms.length; ++i){
			current = transforms[i];
			if(current === undefined){
				variedTransforms.push(current)
			}
			else{
				currentCount = counts[current.name] || 0;
				if(current.name === exemptName){
					variedTransforms.push(current);
				}
				else{
					counts[current.name] = ++currentCount;
					if(currentCount <= maxCount){
						variedTransforms.push(current)
					}
					else{
						if(remaining_count > 0){
							remaining_count--;
							variedTransforms.push(current)
						}
					}
				}
			}
		}
		return variedTransforms;
	}

	var getFilterType = function(){
		var filters = filterLatestInputs(dw.engine.filter), filter = filters[filters.length-1], filterType = (filter ? filter.transform : undefined);
		return filterType;
	}

	var sortTransforms = function(transforms){
		var inputs = getSelectionRecords();
		transforms.forEach(function(t){
			t.weights = {};
			t.weights.tf = corpus.frequency(t, {inputs:inputs});
			t.weights.td = transformDifficulty(t)
			t.weights.tdl = transformDescriptionLength(t)
			if(workingTransform) t.weights.wts = workingTransform.similarity(t)
		})

		var aw, bw, filterType = getFilterType();


		transforms.sort(function(a, b){
			aw = a.weights; bw = b.weights;
			if(workingTransform){
				if(a.name === workingTransform.name && b.name != workingTransform.name) return -1;
				if(b.name === workingTransform.name && a.name != workingTransform.name) return 1;
				if(a.name === workingTransform.name && b.name === workingTransform.name){
					var as = aw.wts, bs = bw.wts;
					if(as > bs) return -1;
					if(bs > as) return 1;
				}

			}

			if(filterType){
				if(a.name === filterType && b.name != filterType) return -1;
				else if(b.name === filterType && a.name != filterType) return 1;
			}



			if(aw.td > bw.td) return -1; if(bw.td > aw.td) return 1;
			if(aw.tf > bw.tf) return -1; if(bw.tf > aw.tf) return 1;
			if(aw.tdl < bw.tdl) return -1; if(bw.tdl < aw.tdl) return 1;
			return 0;
		})

		return transforms

	}


	var transformDescriptionLength = function(t){
		return t.description_length();
	}

	var transformDifficulty = function(t){
		switch(t.name){
			case dw.transform.SPLIT:
			case dw.transform.CUT:
			case dw.transform.EXTRACT:
			case dw.transform.FILTER:
				return 1;
			default:
				return 0;
		}
	}




	var inferTransformParameterSet = function(transform, param){



		if(param.is_transform) return [param]

		var t = transform.clone();

		var keys = d3.keys(param), p, neededParams;




		for(var i = 0; i < keys.length; ++i){
			p = keys[i];

			if(!t.has_parameter(p)) return [];
			try{
				t[p](param[p]);
			}
			catch(e){
				console.error(e)
			}

		}






		neededParams = t.enums().filter(function(x){return keys.indexOf(x)===-1})
		var top = corpus.top_transforms({transform:t, given_params:keys, needed_params:neededParams, table:engine._table})

		var promoted = engine.promoted_transform();
		if(promoted && promoted === t.name){
			return top.slice(0, 30);
		}
		else{
			return top.slice(0, 30).filter(function(x){return x.well_defined(engine._table)})
		}



	}

	var inferMissing = function(){
		var inputs = filterLatestInputs(dw.engine.missing_bar), col, candidates = [];


		if(inputs.length){
			col = inputs[inputs.length-1].col;

			candidates.push(dw.fill(engine._table[col].name()))
			candidates.push(dw.fill(engine._table[col].name()).direction(dw.UP))
			candidates.push(dw.filter(dw.is_null(engine._table[col].name())))
		}

		return candidates;
	}

	var inferValid = function(){
		var inputs = filterLatestInputs(dw.engine.valid_bar), col, candidates = [];

		if(inputs.length){
			col = inputs[inputs.length-1].col;
			candidates.push(dw.filter(dw.is_valid(engine._table[col].name())))
		}

		return candidates;
	}

	var inferBadRole = function(){
		var inputs = filterLatestInputs(dw.engine.bad_role_bar), col, candidates = [];

		if(inputs.length){
			col = inputs[inputs.length-1].col;
			candidates.push(dw.filter(dw.matches_role(engine._table[col].name())))
		}

		return candidates;
	}

	var inferBadType = function(){
		var inputs = filterLatestInputs(dw.engine.bad_type_bar), col, candidates = [];

		if(inputs.length){
			col = inputs[inputs.length-1].col;
			candidates.push(dw.filter(dw.matches_type(engine._table[col].name(), engine._table[col].type)))
		}

		return candidates;
	}

	var inferRow = function(){
		var inputs = filterLatestInputs(dw.engine.row), parameters = [], rows, candidates;


		if(inputs.length){
			rows = inputs[inputs.length-1].rows
		 	candidates = dw.row_inference().candidates(engine.table(), inputs[inputs.length-1].rows);
			parameters = candidates;

		}

		return parameters;
	}

	var inferEdit = function(){
		var inputs = filterLatestInputs(dw.engine.edit), parameters = [], rows, candidates;


		if(inputs.length){
			candidates = dw.edit_inference().candidates(engine.table(), inputs);
			parameters = candidates;
		}



		return parameters;
	}

	var inferCol = function(){
		var inputs = filterLatestInputs(dw.engine.col), parameters = [], names;
		if(inputs.length){

			names = inputs[inputs.length-1].cols.map(function(c){
				return engine._table[c].name()
			});

			if(names.length	 > 0){
				parameters.push({column:names})
				if(names.length === 2){
					parameters.push({column:[names[0]], measure:names[1]})
					parameters.push({column:[names[1]], measure:names[0]})
				}
			}
		}

		return parameters;
	}

	var getSelectionRecords = function(inputs){
		inputs = inputs || filterLatestInputs(dw.engine.highlight);

		if(inputs && inputs.length){
			var selection, row, col, text, start, end, position, records, table = engine.table();
			return inputs.map(function(input, i){
				row = input.position.row, col = input.position.col, text = engine._table[col].get_raw(row), start = input.selection.startCursor, end = input.selection.endCursor;
				return {type:dw.engine.highlight, params:dw.regex.record(text, start, end, table[col].name(), row, table)};
			})
		}

		inputs =  filterLatestInputs(dw.engine.row);
		if(inputs && inputs.length){
			return inputs.map(function(i){
				return {type:dw.engine.row, params:{rows:i.rows, table: engine.table()}}
			})
		}

		inputs =  filterLatestInputs(dw.engine.col);
		if(inputs && inputs.length){
			return inputs.map(function(i){
				return {type:dw.engine.col, params:{cols:i.cols, table: engine.table()}}
			})
		}
	}



	var inferSelection = function(){

		var inputs = filterLatestInputs(dw.engine.highlight),
			selection, row, col, text, start, end, position, records, table = engine.table();

		if(!inputs.length) return []




		records = inputs.map(function(input, i){
			row = input.position.row, col = input.position.col, text = engine._table[col].get_raw(row), start = input.selection.startCursor, end = input.selection.endCursor;
			return dw.regex.record(text, start, end, table[col].name(), row, table);
		})



		var candidates = dw.regex().candidates(records);


		if(inputs.length === 1 || candidates.length < 2){
			candidates.unshift({positions:[inputs[inputs.length-1].selection.startCursor, inputs[inputs.length-1].selection.endCursor]})
		}

		var startRecord = records.length-1;

		while(candidates.length<3 && startRecord > 0){
			candidates = dw.regex().candidates(records.slice(records.length-startRecord))
			startRecord-=1;
		}




		var column = inputs[inputs.length-1].position.col
		column = engine._table[column].name();
		candidates.forEach(function(c){
			c.column = column
		})

		candidates = candidates.concat(dw.row_inference().candidates(engine.table(), records, {type:dw.engine.highlight}))



		return candidates;
	}

	var filterLatestInputs = function(type, o){
		var o = o || {}, inputs = engine._inputs, clear_index = inputs.length-1, clearTypes = o.clear_types || [type, dw.engine.filter, dw.engine.promote, dw.engine.param];
		while(clear_index >= 0){
			if(clearTypes.indexOf(inputs[clear_index].type)===-1){
				break;
			}
			clear_index--;
		}

		return engine._inputs.slice(clear_index+1).filter(function(i){
			return i.type === type;
		})
	}




	var filterInputs = function(type, o){

		var o = o || {}, inputs = engine._inputs, clear_index = inputs.length-1, clearTypes = o.clear_types || [dw.engine.execute, dw.engine.clear];

		if(typeOf(type)!='array') type = [type];

		while(clear_index >= 0){
			if(clearTypes.indexOf(inputs[clear_index].type)!=-1){
				break;
			}
			clear_index--;
		}

		return engine._inputs.slice(clear_index+1).filter(function(i){
			return type.indexOf(i.type)!=-1;
		})
	}


	return engine;
}

dw.engine.transform_set = [
	dw.split(),

	dw.extract(),
	dw.cut(),
	dw.fill(),
	dw.fold(),
	dw.merge(),
	dw.filter(),
	dw.drop(),
	dw.unfold(),
	dw.promote(),


	dw.copy()
]

dw.engine.highlight = 'text_select';
dw.engine.edit = 'text_edit';
dw.engine.row = 'row_select';
dw.engine.col = 'col_select';
dw.engine.filter = 'type_select';
dw.engine.transform = 'transform_select';
dw.engine.execute = 'execute_transform';
dw.engine.promote = 'promote_transform';
dw.engine.clear = 'clear_transform';
dw.engine.missing_bar = 'missing';
dw.engine.bad_type_bar = 'bparse';
dw.engine.bad_role_bar = 'brole';
dw.engine.valid_bar = 'bvalid';

dw.engine.param = 'param_edit';




dw.calc_state_score = function(table) {
	var sumHomo = 0;
	var totalDelims = 0;
	var totalMissing = 0;
	var totalElts = 0;
	var nCols = table.cols();

	for (var c = 0; c < nCols; c++) {
		var col = table[c];
		var colStats = dw.get_column_stats(col, table.rows());

		sumHomo += colStats.colHomogeneity;




		totalElts += table.rows();

		totalMissing += colStats.numMissing;
		totalDelims += colStats.numDelims;
	}



	var avgHomo = sumHomo / nCols;
	var pctMissing = totalMissing / totalElts;


	var avgDelims = 0;
	if (totalMissing < totalElts) {
		avgDelims = totalDelims / (totalElts - totalMissing);
	}





	var stateScore = (1-avgHomo) + pctMissing + avgDelims;



	return stateScore;
}





dw.get_column_stats = function(col, nRows) {
	var numMissing = 0;
	var numDates = 0;
	var numNumbers = 0;
	var numStrings = 0;

	var numCommas = 0;
	var numColons = 0;
	var numPipes = 0;
	var numTabs = 0;


	for (var r = 0; r < nRows; r++) {
		var elt = col[r];







		if (dw.is_missing(elt)) {
			numMissing++;
		}
		else if (dw.date_parse(elt)) {
			numDates++;
		}
		else if (!isNaN(Number(elt))) {
			numNumbers++;
		}










		if (elt) {
			var commas = elt.match(/,/g);
			var colons = elt.match(/\:/g);
			var pipes = elt.match(/\|/g);
			var tabs = elt.match(/\t/g);






			if (commas) numCommas += commas.length;
			if (colons) numColons += colons.length;
			if (pipes) numPipes += pipes.length;
			if (tabs) numTabs += tabs.length;
		}
	}
	numStrings = nRows - numMissing - numNumbers - numDates;

	var numRealElts = nRows - numMissing;


	var colHomogeneity = 0;


	var pctDates = numDates / nRows;
	var pctNumbers = numNumbers / nRows;
	var pctStrings = numStrings / nRows;


	/*
	if (numRealElts > 0) {
		var pctDates = numDates / numRealElts;
		var pctNumbers = numNumbers / numRealElts;
		var pctStrings = numStrings / numRealElts;
	}
	*/

	colHomogeneity = pctDates*pctDates + pctNumbers*pctNumbers + pctStrings*pctStrings;

	return {colHomogeneity: colHomogeneity,
					numMissing:     numMissing,
					numDelims:      numCommas+numColons+numPipes+numTabs};
}



dw.num_unique_elts = function(table) {
	var numUniques = 0;
	var uniques = {};
	for (var c = 0; c < table.cols(); c++) {
		var col = table[c];
		for (var r = 0; r < table.rows(); r++) {
			var elt = col[r];

			if (!dw.is_missing(elt) && uniques[elt] != 1) {
				numUniques++;
				uniques[elt] = 1;
			}
		}
	}

	return numUniques;
}



dw.is_slice_all_valid_and_unique = function(lst, i) {
	lst = lst.slice(i);
	var uniques = {};
	lst.forEach(function(e) {

		if (dw.is_missing(e)) {
			return false;
		}
		uniques[e] = 1;
	});
	var numUniques = 0;
	for (e in uniques) numUniques++;
	return (numUniques == lst.length);
}

dw.summary = function(col){
	var type = col.type || dt.type.string(), badParse = [], badRole = [], missing = [], valid = [], unique = {};

	for(var i = 0; i < col.length; ++i){
		var v = col.get(i);
		var vwrap = {index:i, value:v}
		if(dt.is_missing(v)){
			missing.push(i)
		}
		else if(type.parse(v)===undefined){
			badParse.push(i)
		}
		else{
			valid.push(i)
		}
		unique[v] = 1;
	}

	return {missing:missing, bparse:badParse, brole:badRole, valid:valid, unique:unique};
};
