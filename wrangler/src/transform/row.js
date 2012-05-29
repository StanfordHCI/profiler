dw.row = function(formula){

	var t = dw.transform();
	dw.ivar(t, [
		{name:'formula', initial:formula || ''}
	])

  t.valid_filter = function() {
    return t._formula && t._formula.length;
  }

	t.description_length = function(){
			return t._formula.length;

			if(t._conditions.length===0){
				return 0;
			}
			if(t._conditions.length === 1){
				switch(t._conditions[0].name){
					case dw.row.INDEX:
						return 1
					case dw.row.EMPTY:
						return 2;
					default:
						break
				}
			}
			return 3;
	}

	t.description = function(){

		return t._formula;
		if(t._conditions.length === 1){
			switch(t._conditions[0].name){
				case dw.row.INDEX:
				case dw.row.CYCLE:
				case dw.row.EMPTY:
					return t._conditions[0].description({simple:true})
				default:
					break
			}
		}

		return [
			' rows where ' + t._conditions.map(function(c){return c.description()}).join(' and ')
		]
	}

	t.valid_columns = function(tables){
		var conds = t._conditions, cond, v;
		for(var i = 0; i < conds.length; ++i){
			cond = conds[i];
			v = cond.valid_columns(tables)
			if(!v.valid){
				return v;
			}
		}
		return {valid:true}
	}

  t.tester = function(tables) {
    var formula = t._formula,
        expression, table, result, filter_predicate;

    if (formula && formula.length) {
      expression = dw.parser.parse(formula);
      table = t.getTable(tables);
	    result = expression.evaluate(table);
  		filter_predicate = function(table, row) {
  		  return result[row];
  		}
    } else {
      filter_predicate = function(table, row) {
  		  return true;
  		}
    }
		return {test:filter_predicate};
  }

	t.test = function(tables, row){
		var conds = t._conditions, cond;
		for(var i = 0; i < conds.length; ++i){
			cond = conds[i];
			if(!cond.test(tables, row)){
				return 0;
			}
		}
		return 1;
	}
	t.name = dw.transform.ROW;
	return t;
}

dw.row.fromFormula = function(formula){

	if(formula===''){
		return dw.row([])
	}

	var preds = formula.split(/ & /g)
	var index;
	preds = preds.map(function(pred){
		if(pred === 'row is empty'){
			return dw.empty();
		}
		if(index = pred.indexOf( 'index in (') != -1){

			var indices = pred.substring(index+9, pred.length-1);
			indices = indices.split(/,/g).map(function(i){return Number(i)-1});
			return dw.rowIndex(indices);
		}

		var match = pred.match(/\=|<\=|>\=|!=|is null|is not|matches role|matches type|like/)
		var op = match[0], index = match.index, cond, lhs = pred.substr(0, index).replace(/^ */, '').replace(/ *$/,''), rhs = pred.substr(index+op.length).replace(/^ * /,'').replace(/ *$/, '');




		switch(rhs){
			case 'a number':
				rhs = dw.number();
				break
			case 'a date':
				rhs = dw.date();
				break
			case 'a string':
				rhs = dw.string();
				break;
			case 'a integer':
				rhs = dw.integer();
				break;
			default:
				if(rhs[0]==="'") rhs = rhs.substring(1, rhs.length-1);
				else rhs = Number(rhs)
		}


		switch(op){
			case "=":
				cond = dw.eq(lhs, rhs, true);
				break;
			case "<":
				cond = dw.lt(lhs, rhs, true);
				break;
			case "<=":
				cond = dw.le(lhs, rhs, true);
				break;
			case ">":
				cond = dw.gt(lhs, rhs, true);
				break;
			case ">=":
				cond = dw.ge(lhs, rhs, true);
				break;
			case "!=":
				cond = dw.neq(lhs, rhs, true);
				break;
			case "is null":
				cond = dw.is_null(lhs);
				break;
			case "matches role":
				cond = dw.matches_role(lhs);
				break;
			case "is not":

				cond = dw.matches_type(lhs, rhs);
				break;
			case "matches type":

				cond = dw.matches_type(lhs);
				break;
			case "~":
				cond = dw.like(lhs, rhs, true);
				break;
			default:
				throw "Invalid row predicates"
		}
		return cond;
	})

	return dw.row(preds);
}

dw.row.INDEX = 'rowIndex'
dw.row.CYCLE = 'rowCycle'
dw.row.EMPTY = 'empty'
dw.row.IS_NULL = 'is_null'
dw.row.IS_VALID = 'is_valid'
dw.row.MATCHES_ROLE = 'is_role'
dw.row.MATCHES_TYPE = 'is_type'
dw.row.STARTS_WITH = 'starts_with'
dw.row.LIKE = 'like'
dw.row.EQUALS = 'eq'
dw.row.NOT_EQUALS = 'neq'
dw.row.CONTAINS = 'contains'
dw.rowIndex = function(indices){
	var t = dw.transform();
	dw.ivara(t, [
		{name:'indices', initial:indices || []}
	])
	t.test = function(table, row){

		return t._indices.indexOf(row) != -1
	}

  t.formula = function() {
    return indices.map(function(i) { return 'index() = ' + i}).join(' or ')
  }

	t.description = function(o){
		o = o || {}, indices = t._indices;

		var simple = o.simple || false;
		if(simple){

			return (indices.length === 1 ? (indices[0]===-1 ? '' : 'row ') : 'rows ') + indices.map(function(i){return i===-1?'header':(i+1)}).join(',')
		}
		else{



			return 'index in (' + indices.map(function(i){return i+1}).join(',') + ')'
		}
	}

	t.valid_columns = function(){
		return {valid:true};
	}

	t.name = dw.row.INDEX;

	return t;
}

dw.rowCycle = function(cycle, start, end){
	var t = dw.transform();

	dw.ivar(t, [
		{name:'cycle', initial:cycle != undefined ? cycle : 1},
		{name:'start', initial:start || 0},
		{name:'end', initial:end}
	])



	t.test = function(table, row){
		var e = t.end(), s = t.start();
		if((s === undefined || row >= s) && (e === undefined || row <= e))
		return (row-s) % t.cycle() === 0;
	}
	t.description = function(o){
		o = o || {}, indices = t._indices;

		var simple = o.simple || false;
		if(simple){

			var qualifier = '';

			if(t.start() && t.end()!=undefined){
				qualifier = ' between ' + (t.start()+1) + ',' + (t.end()+1);
			}
			else if(t.start()){
				qualifier = ' starting with ' + (t.start()+1);
			}
			else if(t.end()){
				qualifier = ' before ' + (t.end()+1);
			}


			return 	' every ' + t.cycle() + ' rows ' + qualifier
		}
		else{

			var qualifier = '';

			if(t.start() && t.end()!=undefined){
				qualifier = ' between ' + (t.start()+1) + ',' + (t.end()+1);
			}
			else if(t.start()){
				qualifier = ' after ' + (t.start()+1);
			}
			else if(t.end()){
				qualifier = ' before ' + (t.end()+1);
			}


			return 'every ' + t.cycle() + ' rows' + qualifier;
		}
	}

	t.valid_columns = function(){
		return {valid:true};
	}

	t.name = dw.row.CYCLE;

	return t;
}

dw.vcompare = function(lcol, value){
	var t = dw.transform();

	dw.ivar(t, [
		{name:'lcol', initial:lcol},{name:'value', initial:value}
	])


	t.test = function(table, row){
		return t.compare(table[t._lcol][row], value)
	}

	t.description = function(){
		return dw.display_name(t._lcol) + " " + t._op_str + " '"  + t._value + "'";
	}

	t.valid_columns = function(tables){
		if(tables[0][lcol])
			return {valid:true};
		return {valid:false, errors:['Invalid left hand side']}
	}

	return t;
}

dw.ccompare = function(lcol, rcol){
	var t = dw.transform();

	dw.ivar(t, [
		{name:'lcol', initial:lcol},{name:'rcol', initial:rcol}
	])


	t.test = function(table, row){
		return t.compare(table[lcol][row], table[rcol][row])
	}

	t.description = function(){
		return dw.display_name(t._lcol) + " " + t._op_str + " "  + t._rcol;
	}

	t.valid_columns = function(tables){
		if(tables[0][lcol] && tables[0][rcol])
			return {valid:true};
		return {valid:false, errors:['Invalid comparison']}
	}


	return t;
}

dw.compare = function(lcol, rcol, value){



	var t = value ? dw.vcompare(lcol, rcol) : dw.ccompare(lcol, rcol);
	t.default_transform = function(){
		return dw[t.name](lcol, rcol, value)
	}
	return t;
}

dw.eq = function(l, r, v){

	var t = dw.compare(l ,r, v);

	t._op_str = '='

	t.compare = function(a, b){
		return a === b;
	}

	t.name = dw.row.EQUALS;

	return t;
}

dw.neq = function(l, r, v){

	var t = dw.compare(l ,r, v);

	t._op_str = '!='

	t.compare = function(a, b){
		return a != b;
	}

	t.name = dw.row.NOT_EQUALS;

	return t;
}


dw.starts_with = function(l, r, v){
	var t = dw.compare(l ,r, v);

	t._op_str = 'starts with'

	t.compare = function(a, b){
		a = ""+a
		b = ""+b

		return a.indexOf(b)==0;
	}

			t.name = dw.row.STARTS_WITH;

	return t;
}

dw.like = function(l, r, v){
	var t = dw.compare(l ,r, true);
	t._op_str = '~'
	t.compare = function(a, b){
		a = ""+a
		b = ""+b
		return a.match(b)!=null;
	}

	t.name = dw.row.LIKE;

	return t;
}


dw.contains = function(l, r, v){
	var t = dw.compare(l ,r, v);

	t._op_str = 'contains'

	t.compare = function(a, b){
		a = ""+a
		b = ""+b

		return a.indexOf(b)!=-1;
	}

	t.name = dw.row.CONTAINS;

	return t;
}

dw.is_null = function(l, r, v){
	var t = dw.compare(l ,r, true);

	t._op_str = 'is null'

	t.compare = function(a, b){
		return dw.is_missing(a);
	}

	t.description = function(){

		return dw.display_name(t._lcol) + ' ' +  t._op_str;


	}
		t.name = dw.row.IS_NULL;
	return t;
}



dw.matches_role = function(lcol){
	var t = dw.transform();

	dw.ivar(t, [
		{name:'lcol', initial:lcol}
	])

	t.test = function(table, row){
		return (table[lcol].wrangler_role.parse(table[lcol][row])===undefined);
	}

	t.description = function(){
		return dw.display_name(t._lcol) + ' does not match role';
	}
	t.name = dw.row.MATCHES_ROLE;


	t.valid_columns = function(tables){
		if(tables[0][lcol])
			return {valid:true};
		return {valid:false, errors:['Invalid comparison']}
	}


	return t;
}

dw.matches_type = function(lcol, type){
	var t = dw.transform();
	dw.ivar(t, [
		{name:'lcol', initial:lcol},
		{name:'type', initial:type}
	])


	t.test = function(table, row){
		var wt = t._type || table[lcol].wrangler_type;
		return !wt || (wt.parse(table[t._lcol][row])===undefined);
	}

	t.description = function(){
		return dw.display_name(t._lcol) + ' is not a ' + type.name;
	}

	t.valid_columns = function(tables){
		if(tables[0][lcol])
			return {valid:true};
		return {valid:false, errors:['Invalid comparison']}
	}


		t.name = dw.row.MATCHES_TYPE;
	return t;
}




dw.is_missing = function(v){
	return v == undefined || (''+v).replace(/[ \t\n]/g, '').length === 0;
}

dw.empty = function(){
	var t = dw.transform();

	dw.ivar(t, [
		{name:'percent_valid', initial:0},
		{name:'num_valid', initial:0}
	])

  t.formula = function() {
    return "empty()"
  }

	t.test = function(table, row){
		var v;

		var total = table.cols();
		var num_missing = 0;
		var percent_valid = t.percent_valid();
		var num_valid = t.num_valid();

		for(var c = 0; c < total; ++c){
			v = (table[c][row])
			if (dw.is_missing(v)) num_missing++;

			if ((num_missing >= (total - num_valid)) ||
					(num_missing / total) >= ((100 - percent_valid) / 100)) {
				return 1;
			}
		}

		return 0;
	}

	t.description = function(o){
		o = o || {};
		var simple = o.simple || false;

		var percent_valid = t.percent_valid();
		var num_valid = t.num_valid();

		if(simple){
			if (percent_valid > 0) {
				return 'rows with <= ' + percent_valid + '% values'
			}
			else if (num_valid > 0) {
				return 'rows with <= ' + num_valid + ' values'
			}
			else {
				return 'empty rows'
			}
		}
		else{
			if (percent_valid > 0) {
				return ' row is (sort of) empty '
			}
			else if (num_valid > 0) {
				return ' row is (sort of) empty '
			}
			else {
				return ' row is empty '
			}
		}
	}
	t.valid_columns = function(tables){
			return {valid:true};
	}
	t.name = dw.row.EMPTY;
	return t;
}
