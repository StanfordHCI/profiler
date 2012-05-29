/*New column positions*/
dw.INSERT_RIGHT = 'right';
dw.INSERT_END = 'end';

/*Result*/
dw.ROW = 'row';
dw.COLUMN = 'column';

dw.clause = {
	column: 'column',
	regex: 'regex',
	input: 'input',
	array: 'array',
	select: 'select'
};

dw.status = {
	active: 'active',
	inactive: 'inactive',
	deleted: 'deleted',
	invalid: 'invalid'
}

dw.transform = function(column){
	var t = {};

	t.is_transform = true;

	dw.ivara(t, {name:'column', initial:(column!=undefined)?column:[]})
	dw.ivar(t, [{name:'table', initial:0},{name:'status', initial:dw.status.active},{name:'drop', initial:false}])
	t.getTable = function(tables){
		return tables[t.table()]
	}


	t.show_details = false;

	t.active = function(){
		return t._status === dw.status.active;
	}

	t.inactive = function(){
		return t._status === dw.status.inactive;
	}

	t.deleted = function(){
		return t._status === dw.status.deleted;
	}

	t.invalid = function(){
		return t._status === dw.status.invalid;
	}

	t.toggle = function(){
		t.active() ? t.status(dw.status.inactive) : t.status(dw.status.active);
	}

	t.delete_transform = function(){
		t._status = dw.status.deleted;
	}

	t.errors = [];

	t.invalidate = function(errors){
		t._status = dw.status.invalid;
		t.errors = errors;
	}

	t.validate = function(){
		t._status = dw.status.active;
		t.errors = []
	}

	t.errorMessage = function(){
		return t.errors.join('\n')
	}

	t.columns = function(table){
		if(t._column && t._column.length)
			return t._column.map(function(c){
				return table[c];
			})
		return table.map(function(c){return c})

	}

	t.has_parameter = function(p){
		return t[p] != undefined;
	}

	t.well_defined = function(table){
		return true;
	}

	t.params = function(){
		return d3.keys(t).filter(function(k){return k[0]==='_'})
	}

	t.enums = function() {
		return [];
	}


	t.param_equals = function(l, r){

		if(l===undefined || r === undefined) return l === r;
		ktype = typeOf(l);
		switch(ktype){
			case 'function':
				return l.toString() === r.toString();
			case 'array':
				if(l.length!=r.length) return false;
				for(var i = 0; i < l.length; ++i){
					if(!t.param_equals(l[i], r[i])) return false;
				}
				return true;
			case 'object':
				if(l.equals) return l.equals(r);
				return l.toString() === r.toString();
			case 'number':
			case 'string':
			case 'boolean':
				return l === r;
			default:
				return l === r;
		}
	}

	t.similarity = function(other){
		var nameShift = (t.name!=other.name) ? -1 : 0;
		var tkeys = t.params(), okeys = other.params(), l, r, ktype, equalCount=0;
		for(var i = 0; i < tkeys.length; ++i){
			l = t[tkeys[i]], r = other[okeys[i]];
			if(t.param_equals(l, r)){
				equalCount++;
			}
		}
		return nameShift+(equalCount/tkeys.length);
	}

	t.equals = function(other){
		if(t.name!=other.name) return false;
		var tkeys = t.params(), okeys = other.params(), l, r, ktype;
		for(var i = 0; i < tkeys.length; ++i){
			l = t[tkeys[i]], r = other[okeys[i]];
			if(!t.param_equals(l, r)){
				return false;
			}
		}
		return true;
	}

	t.check_validity = function(tables){
		return t.valid_columns(tables)
	}

	t.valid_columns = function(tables){
		var table = t.getTable(tables);
		var columns = t.columns(table).filter(function(c){return c===undefined});
		if(columns.length){
			return {valid:false, errors : ['Invalid columns']}
		}
		return {valid:true}

	}

	t.clone_param = function(param){
			var ktype = typeOf(param);
			switch(ktype){
				case 'function':
					return param
				case 'array':
					return param.map(function(p){return t.clone_param(p)})
				case 'object':
					if(param.clone) return param.clone();
					return param;
				case 'number':
				case 'string':
				case 'boolean':
					return param;
				default:
					return param;
			}
	}


	t.default_transform = function(){
		return dw.transform.create(t.name)
	}

	t.clone = function(){
		var other = t.default_transform(),
				tkeys = t.params(), param;
		for(var i = 0; i < tkeys.length; ++i){
			param = t[tkeys[i]];
			other[tkeys[i]] = t.clone_param(param);
		}
		return other;
	}

	t.description_length = function(){
		return 0;
	}

	t.comment = function(){
		var clauses = t.description();

		return clauses.map(function(clause){
			if(typeOf(clause)==='string')
				return clause

			return clause.description();

		}).join(' ')


	}

	t.sample_apply = function(tables){
		return t.apply(tables, {max_rows:1000, warn:true})
	}


	var parse_javascript_parameter = function(x){
		if(x===true) return 'true'
		if(x===false) return 'false'
		if(x===undefined) return 'undefined'

		if(typeOf(x)==='object' ||typeOf(x)==='function'){
			if(x.is_transform){
				return x.as_javascript();
			}
			return dw.JSON.stringify(x.toString().replace(/^\/|\/$/g,''))
		}

		if(typeOf(x)==='array'){
			return '['+x.map(parse_javascript_parameter)+']'
		}
		return dw.JSON.stringify(x)
	}

	t.displayed_parameters = function () {
	  return dw.metadata.displayed_parameters(t);
	}

	t.constructor_parameters = function () {
	  return dw.metadata.constructor_parameters(t);
	}

	t.translate_wrapper = function(table_name, schema, table_query, toDelete) {
    return t.translate(schema, table_query || table_name, toDelete)
	}

	t.translate = function() {
    alert('Runtime exception: unimplemented method');
	}

	t.as_javascript = function() {
  	var constructor, params, seperator = '', format_whitespace = '',
  	    constructor_param = t.constructor_parameters()[0];
		if (constructor_param != undefined) {
      constructor_param = parse_javascript_parameter(t['_' + constructor_param]);
		} else {
		  constructor_param = ''
		}
		constructor = 'dw.' + t.name + '(' + constructor_param  + ')';
		params = t.displayed_parameters().map(function(p){
			return '.' + p.name + '(' + parse_javascript_parameter(t['_'+p.name]) + ')' + seperator
		}).join(format_whitespace)

		return constructor + params;

	};

	return t;
}

dw.transform.create = function(name){
	return dw[name]()
}

dw.transform.SPLIT = 'split';
dw.transform.EXTRACT = 'extract';
dw.transform.CUT = 'cut';
dw.transform.MERGE = 'merge';
dw.transform.FOLD = 'fold';
dw.transform.UNFOLD = 'unfold';
dw.transform.FILL = 'fill';
dw.transform.FILTER = 'filter';
dw.transform.DROP = 'drop';
dw.transform.ROW = 'row';
dw.transform.COPY = 'copy';
dw.transform.LOOKUP = 'lookup';
dw.transform.TRANSLATE = 'translate';
dw.transform.EDIT = 'edit';
dw.transform.SORT = 'sort';
dw.transform.TRANSPOSE = 'transpose';
dw.transform.STRING = 'string';
dw.transform.INT = 'int';
dw.transform.NUMBER = 'number';
dw.transform.DATE = 'date';
dw.transform.SET_TYPE = 'set_type';
dw.transform.SET_ROLE = 'set_role';
dw.transform.SET_NAME = 'set_name';
dw.transform.PROMOTE = 'promote';
dw.transform.WRAP = 'wrap';
dw.transform.MARKDOWN = 'markdown';


/** Metadata of transforms */

dw.transform.type = {
  'cut':1,
  'derive':1,
  'drop':1,
  'extract':1,
  'fill':1,
  'filter':1,
  'fold':1,
  'merge':1,
  'split':1
}

dw.transform.types = [];
for(var x in dw.transform.type) {
  dw.transform.types.push(x);
}