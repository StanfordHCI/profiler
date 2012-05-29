dt.structure = function(opt) {
  opt = opt || {};

  var structure = [],
      token_regex = /([a-zA-Z]+)|([0-9]+)|(\s+)|([^a-zA-Z0-9])/g,
      tokens,
      registry = opt.registry || dt.registry();


  structure.update_values = function(values) {
    var i;
    for(i = 0; i < values.length ; ++i) {
      structure.parse_value(values[i]);
    }
    return structure;
  }

  structure.registry = function(v) {
    if(!arguments.length) return registry;
    registry = v;
    return structure;
  }

  structure.parse_value = function(value) {
    if(!value.length) return;
    var tokens = value.match(token_regex), token, code,
        t, types = [], type, structured_type;

    for(t = 0; t < tokens.length; ++t) {
      token = tokens[t];
      code = token.charCodeAt(0);
      if((code > 64 && code < 91) || (code > 96 && code < 123)) {
  			type = dt.type.string();
  		} else if(code > 47 && code < 58){
  			type = dt.type.integer();
  		} else if(code > 8 && code < 14){
    		type = dt.type.whitespace();
    	}
  		else {
  			type = dt.type.symbol();
  		}
  		types.push(type)
    }


    var type_key = types.map(function(t){
      return t.name();
    }).join('*');


    structured_type = registry[type_key];
    if(!structured_type) {
      if(types.length > 1) {
        structured_type = dt.type.composite(types).name(type_key);
      } else {
        structured_type = type;
      }
      registry.register(structured_type);
    }
    structured_type.update_stats(tokens);
  }

  return structure;
};

