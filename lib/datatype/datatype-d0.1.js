(function(){

/**
 * The top-level Datavore namespace. All public methods and fields should be
 * registered on this object. Note that core Datavore source is surrounded by an
 * anonymous function, so any other declared globals will not be visible outside
 * of core methods. This also allows multiple versions of Datavore to coexist,
 * since each version will see their own <tt>dv</tt> namespace.
 *
 * @namespace The top-level Datavore namespace, <tt>dv</tt>.
 */
dt = {};

dt.type = {
  nominal: "nominal",
  ordinal: "ordinal",
  numeric: "numeric",
  geo: "geo",
  geo_world: "geo_world",
  datetime: "datetime",
  unknown: "unknown"
};

dt.VALID = 'valid';
dt.MISSING = undefined;
dt.ERROR = null;

dt.min = function(array) {
  var i = -1,
      n = array.length,
      a,
      b;
  while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
  while (++i < n) if ((b = array[i]) != null && a > b) a = b;
  return a;
};dt.max = function(array) {
  var i = -1,
      n = array.length,
      a,
      b;
  while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
  while (++i < n) if ((b = array[i]) != null && b > a) a = b;
  return a;
};dt.minmax = function(array) {
  var i = -1,
      n = array.length,
      min, max,
      v;
  while (++i < n && ((min = array[i]) == null || min != min)) min = undefined;
  max = min;
  while (++i < n) {
    if ((v = array[i]) != null) {
       if (v > max) {
          max = v;
       } else if (v < min) {
          min = v;
       }
    }
  }
  return [min, max];
};dt.registry = function(types) {
  types = types || [];
  var registry = [];


  registry.register = function(type) {
    registry.push(type);
    registry[type.name()] = type;
    return registry;
  };

  var t;
  for(t = 0; t < types.length; ++t) {
    registry.register(types[t]);
  }

  return registry;

};

dt.registry.default_registry = function() {
  return dt.registry([dt.geo.us_state_name(), dt.geo.world_country_name(), dt.type.date.date(), dt.type.date.time(), dt.type.number(), dt.type.integer(), dt.type.string()]);
};
dt.type.composite = function(types) {

  var datatype = dt.type.datatype();

  stats = datatype.stats();

  datatype.update_stats = function(values) {
    if(values.length != types.length) console.error('# of values must match # of types.');
    for(var i = 0; i < values.length; ++i) {
      types[i].update_stats(values[i])
    }
    stats.count++;
  }

  datatype.debug = function() {
    var x = {types:types.map(function(t) {
      return t.debug();
    }),
    stats:stats};
    return x;
  }


  return datatype;
};
dt.is_missing = function(v) {
  return v === undefined || (''+v).replace(/[ \t\n]/g, '').length === 0;
};
dt.type.datatype = function(options) {
  options = options || {}
  var datatype = {}, constraints = options.constraints || [], name = options.name, type = options.type, stats = options.stats || {};
  stats.count = stats.count || 0;

  datatype.parse = function(v) {
    return v;
  }

  datatype.test = function(v) {
    for(var c = 0; c < constraints.length; ++c) {
      if(!constraints[c].test(v)) return false;
    }
    return true;
  }

  datatype.stats = function(v) {
    if(!arguments.length) return stats;
    stats = v;
    return datatype;
  }

  datatype.constraints = function(v) {
    if(!arguments.length) return constraints;

    constraints = v;
    return datatype;
  }

  datatype.transform = function(target_type) {

  };

  datatype.update_stats = function(value) {
    var stat, val;
    if(stat = stats.lengths) {
      val = stat[value.length];
      stat[value.length] = (val ? (val + 1) : 1);
    }
    if(stat = stats.frequency) {
      val = stat[value];
      stat[value] = (val ? (val + 1) : 1);
    }
    stats.count++;
  };

  datatype.debug = function() {
    var x = {name:name, stats:stats};
    return JSON.stringify(x);
  }

  datatype.name = function(v) {
    if(!arguments.length) return name;
    name = v;
    return datatype;
  };

  datatype.type = function(v) {
    if(!arguments.length) return type;
    type = v;
    return datatype;
  };



  datatype.code = function(values) {
    var vals = [], map,
        i, parsed,
        missing = dt.MISSING, error = dt.ERROR;
    vals.lut = datatype.create_lookup_table(values);
    map = dict(vals.lut);
    for (i = 0; i < values.length; ++i) {
      parsed = datatype.parse(values[i]);
      if (parsed === missing || parsed === error) {
        vals.push(parsed)
      } else {
        vals.push(map[parsed]);
      }
    }
    return vals;
  };

  datatype.create_lookup_table = function(values) {
    var codes = [], code_dict = {},
        i, v,
        missing = dt.MISSING, error = dt.ERROR;
    for (i = 0, len = values.length; i < len; ++i) {
      v = values[i];
      v = datatype.parse(v);
      if (v !== missing && v !== error) {
        if (code_dict[v] === undefined) { code_dict[v] = 1; codes.push(v); }
      }
    }
    codes.sort();
    return codes;
  }

  /** @private */
  function dict(lut) {
    return lut.reduce(function (a,b,i) { a[b] = i; return a; }, {});
  };

  if(name) datatype.name(options.name);
  if(type) datatype.type(options.type);
  return datatype;
};dt.type.primitive = function(options) {
  var datatype = dt.type.datatype(options);
  datatype.test = function(v) {
    var x = datatype.parse(v);
    return (x != dt.MISSING && x != dt.ERROR);
  };
  return datatype;
};
dt.type.uncoded_primitive = function(options) {
  var datatype = dt.type.primitive(options);


  datatype.code = function(values) {
    var vals = [],
        i, v;
    for (i = 0, len = values.length; i < len; ++i) {
      v = values[i];
      v = datatype.parse(v);
      vals.push(v);
    }
    return vals;
  };

  return datatype;
};
dt.type.bool = function() {

  var datatype = dt.type.uncoded_primitive({name:'bool', type:dt.type.numeric, stats:{lengths:{},frequency:{}}});

  datatype.parse = function(v) {
    var n;
    if(dt.is_missing(v)) return dt.MISSING;
    if (v === 1 || v === 0) {
      return v;
    }
    v = (v+"").toUpperCase();
    if (/^Y(ES)*|T(RUE)*$/.test(v)) {
      return 1;
    } else if (/^N(O)*|F(ALSE)*$/.test(v)) {
      return 0;
    }
    return dt.ERROR;
  }

  return datatype;

};
dt.type.integer = function() {

  var datatype = dt.type.uncoded_primitive({name:'int', type:dt.type.numeric, stats:{lengths:{},frequency:{}}});

  datatype.parse = function(v) {
    var n;
    if(dt.is_missing(v)) return dt.MISSING;
    n = parseInt(v);
    if(n !== Number(v)) return dt.ERROR;
    return n;
  }

  return datatype;

};
dt.type.number = function() {
  var datatype = dt.type.uncoded_primitive({name:'number', type:dt.type.numeric});

  datatype.parse = function(v) {
    if(dt.is_missing(v)) return dt.MISSING;
    if(isNaN(v)) return dt.ERROR;
    return Number(v);
  }

  return datatype;
};

dt.type.string = function() {
  var datatype = dt.type.primitive({name:'string', type:dt.type.nominal});

  datatype.parse = function(v) {
    if(dt.is_missing(v)) return dt.MISSING;
    return v;
  };

  return datatype;
};
dt.type.whitespace = function() {
  var datatype = dt.type.primitive({name:'whitespace', type:dt.type.nominal});

  datatype.parse = function(v) {
    if(dt.is_missing(v)) return dt.MISSING;

    return v;
  };

  return datatype;
};dt.math = function() {
  var math = {};


  return math;	
};
dt.math.expression = function(children) {
	var exp = {},
		children = children || [];

	exp.children = function(x) {
		if(!arguments.length) return children;
		children = x;
		return exp;
	};

	exp.evaluate = function(table) {
		var c, values = [], child;
    values = children.map(function(c) {
      return c.evaluate(table);
    })





		return exp.transform(values, table);
	};

	return exp;
};
dt.math.constant = function(v) {
	
	var constant = dt.math.expression();
	constant.transform = function(values) {
		return v;
	}
	return constant;
	
}
dt.math.variable = function(v) {
	
	var variable = dt.math.expression();
	variable.transform = function(values, table) {
		return 4;
	}
	return variable;
	
}
dt.math.add = function(children) {
	
	var add = dt.math.expression(children);

	add.transform = function(values) {
		return values[0]+values[1];
	}
	
	return add;
	
};
dt.math.multiply = function(children) {
	
	var add = dt.math.expression(children);
	
	add.transform = function(values) {
		return values[0]*values[1];
	}
	
	return add;
	
}
dt.math.subtract = function(children) {
	
	var subtract = dt.math.expression(children);

	subtract.transform = function(values) {
		return values[0]-values[1];
	}
	
	return subtract;
	
};
dt.math.divide = function(children) {
	
	var divide = dt.math.expression(children);

	divide.transform = function(values) {
		return values[0] / values[1];
	}
	
	return divide;
	
};
dt.math.negate = function(children) {
	
	var add = dt.math.expression(children);
	
	add.transform = function(values) {
		return -1*values[0];
	}
	
	return add;
	
}
dt.math.parse = function(formula) {
	return new MathProcessor().parse(formula);
}

dt.parser = PEG.buildParser(' \
start \
  = additive \
 \
additive \
  = left:multiplicative "+" right:additive { return dt.math.add([left, right]); } \
  / left:multiplicative "-" right:additive { return dt.math.subtract([left, right]); } \
  / multiplicative \
 \
multiplicative \
  = left:primary "*" right:multiplicative { return dt.math.multiply([left, right]); } \
  / left:primary "/" right:multiplicative { return dt.math.divide([left, right]); } \
  / "-" primary:primary {return dt.math.negate([primary])} \
  / primary \
 \
primary \
  = integer \
  / variable \
  / "(" additive:additive ")" { return additive; } \
 \
integer "integer" \
  = digits:[0-9]+ { return dt.math.constant(parseInt(digits.join(""), 10)); } \
variable "variable" \
  = chars:([a-zA-Z][a-zA-Z0-9]*) { return dt.math.variable(chars.join("")); } \
');
dt.math.univariate = function(formula, alias) {
	var fn = {},
		alias = alias || 'x';

	var expression = dt.math.parse(formula);

	fn.alias = function(x) {
		if(!arguments.length) return alias;
		alias = x;
		return fn;
	}

	fn.expression = function(x) {
		if(!arguments.length) return expression;
		expression = x;
		return fn;
	}


	fn.evaluate = function(x){
		var vals = {};
		vals[alias] = x;
		return expression.evaluate(vals)
	}
	
	return fn;
};
dt.math.bivariate = function(formula, xalias, yalias) {
	var fn = {},
		alias = xalias || 'x',
		alias = yalias || 'y';

	var expression = dt.math.parse(formula);

	fn.xalias = function(x) {
		if(!arguments.length) return xalias;
		xalias = x;
		return fn;
	}

	fn.yalias = function(x) {
		if(!arguments.length) return yalias;
		yalias = x;
		return fn;
	}

	fn.expression = function(x) {
		if(!arguments.length) return expression;
		expression = x;
		return fn;
	}

	fn.evaluate = function(x, y){
		var vals = {};
		vals[xalias] = x;
		vals[yalias] = y;
		return expression.evaluate(vals);
	}
	
	return fn;
};


dt.type.date = function(formats) {

  var datatype = dt.type.uncoded_primitive({name:'date', type:dt.type.ordinal, stats:{lengths:{},frequency:{}}}),
      formats = formats || dt.type.date.default_formats;

  datatype.parse = function(v) {
    var n, i, v = v + '';
    if(dt.is_missing(v)) return dt.MISSING;
    for (i = 0; i < formats.length; ++i) {
      n = formats[i].parse(v);
      if (n) {
        return n;
      }
    }
    return dt.ERROR;
  }

  datatype.formats = function(x) {
    if(!arguments.length) return formats;
    formats = x.map(function(f) {
      return d3.time.format(f);
    });
    return datatype;
  }

  datatype.formats(formats);

  return datatype;

};

dt.type.date.default_formats = ['%a', '%A', '%b', '%B', '%c',
    '%d', '%e', '%H', '%I', '%j', '%m', '%M', '%p', '%S', '%U', '%w',
    '%W', '%x', '%X', '%y', '%Y', '%z'];dt.day = function(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

dt.year = function(date) {
  return new Date(date.getFullYear(), 0, 1);
};

dt.year_difference = function(x, y) {
  return x.getFullYear() - y.getFullYear();
}

dt.day_difference = function(x, y) {
  return (x - y) / 86400000
}

dt.day_add = function(x, days) {
  return x - days * -86400000
}

dt.hour = function(date) {
  return new Date(2000, 0, 1, date.getHours(), 0, 0);
};

dt.hour_difference = function(x, y) {
  return (x - y) / 3600000
}

dt.hour_add = function(x, hours) {
  return x - hours * -3600000
}

dt.month_year = function(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

dt.month_year_difference = function(x, y) {
  var year_diff = x.getFullYear() - y.getFullYear(),
      month_diff = x.getMonth() - y.getMonth();

  if (year_diff >= 0) {
    if (month_diff >= 0) {
      return 12 * year_diff + month_diff;
    }
    return 12 * year_diff - month_diff;
  }

  if (month_diff <= 0) {
    return 12 * year_diff + month_diff;
  }
  return 12 * year_diff - month_diff;

};

dt.month_year_add = function(x, monthyears) {
  return new Date(x.getFullYear() + Math.floor(monthyears / 12), x.getMonth() + monthyears % 12, 1) - 0
};
dt.type.date.time = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_time_formats;

  datatype.formats(formats);
  datatype.name('year')
  return datatype;

};

dt.type.date.default_time_formats = ['%X', '%H:%M'];

dt.type.date.second = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_second_formats;

  datatype.formats(formats);
  datatype.name('second')
  return datatype;

};

dt.type.date.default_second_formats = ['%S'];
dt.type.date.minute = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_minute_formats;

  datatype.formats(formats);
  datatype.name('minute')
  return datatype;

};

dt.type.date.default_minute_formats = ['%M'];

dt.type.date.hour = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_hour_formats;

  datatype.formats(formats);
  datatype.name('hour')
  return datatype;

};

dt.type.date.default_hour_formats = ['%I', '%I %p', '%H'];

dt.type.date.day = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_day_formats;

  datatype.formats(formats);
  datatype.name('day')
  return datatype;

};

dt.type.date.default_day_formats = ['%d', '%e'];

dt.type.date.date = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_full_date_formats;

  datatype.formats(formats);
  datatype.name('full_date')
  return datatype;

};

dt.type.date.default_full_date_formats = ['%Y-%m-%d', '%m-%d-%Y', '%m/%d/%Y', '%Y-%m', '%m-%Y', '%m/%Y', '%d-%b-%Y'];dt.type.date.month = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_month_formats;

  datatype.formats(formats);
  datatype.name('month')
  return datatype;

};

dt.type.date.default_month_formats = ['%m', '%b', '%B'];

dt.type.date.year = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_year_formats;

  datatype.formats(formats);
  datatype.name('year')
  return datatype;

};

dt.type.date.default_month_formats = ['%y', '%Y'];dt.geo = function() {
  var geo = {};
  return geo;
};
dt.geo.states_to_fips = {
  "alabama": "1",
  "alaska": "2",
  "arizona": "4",
  "arkansas": "5",
  "california": "6",
  "colorado": "8",
  "connecticut": "9",
  "delaware": "10",
  "district of columbia": "11",
  "florida": "12",
  "georgia": "13",
  "hawaii": "15",
  "idaho": "16",
  "illinois": "17",
  "indiana": "18",
  "iowa": "19",
  "kansas": "20",
  "kentucky": "21",
  "louisiana": "22",
  "maine": "23",
  "maryland": "24",
  "massachusetts": "25",
  "michigan": "26",
  "minnesota": "27",
  "mississippi": "28",
  "missouri": "29",
  "montana": "30",
  "nebraska": "31",
  "nevada": "32",
  "new hampshire": "33",
  "new jersey": "34",
  "new mexico": "35",
  "new york": "36",
  "north carolina": "37",
  "north dakota": "38",
  "ohio": "39",
  "oklahoma": "40",
  "oregon": "41",
  "pennsylvania": "42",
  "rhode island": "44",
  "south carolina": "45",
  "south dakota": "46",
  "tennessee": "47",
  "texas": "48",
  "utah": "49",
  "vermont": "50",
  "virginia": "51",
  "washington": "53",
  "west virginia": "54",
  "wisconsin": "55",
  "wyoming": "56"
};

dt.geo.us_state_names = [];
dt.geo.us_fips_codes = [];
for(var x in dt.geo.states_to_fips) {
  dt.geo.us_state_names.push(x);
  dt.geo.us_fips_codes.push(dt.geo.states_to_fips[x]);
};
dt.geo.us_state_name = function () {
  var geo = dt.type.datatype({type:dt.type.geo}),
      us = dt.dictionary(dt.geo.us_state_names.map(function(x){return x.toLowerCase();})).transform(dt.lowercase),
      code = dt.lookup(dt.geo.states_to_fips).transform(dt.lowercase);

  geo.test = function(v) {
    var x = geo.parse(v);
    return x != dt.MISSING && x != dt.ERROR;
  };

  geo.code = function(values) {
    var vals = [], map,
        i, geo_lookup, lut = [];
    geo_lookup = code.lut();
    vals.lut = geo_lookup.inverted;
    for (i = 0; i < values.length; ++i) {
      vals.push(geo.parse(values[i]));
    }
    return vals;
  };

  geo.parse = function(v) {
    if(dt.is_missing(v)) {
      return dt.MISSING;
    }
    v = code.lookup(v);
    if(v) {
      return +v;
    }
    return dt.ERROR;
  };

  return geo;
};
dt.geo.us_fips_code = function () {

  var geo = {},
    us = dt.dictionary(dt.geo.us_fips_codes).transform();

  geo.test = function(v) {
    return us.test(v);
  };

  geo.code = function(v) {
    return v;
  };

  geo.decode = function(v) {
    return v;
  }

  return geo;
};
dt.geo.countries_to_iso2 = {
  "AFGHANISTAN":"AF",
  "ÅLAND ISLANDS":"AX",
  "ALBANIA":"AL",
  "ALGERIA":"DZ",
  "AMERICAN SAMOA":"AS",
  "ANDORRA":"AD",
  "ANGOLA":"AO",
  "ANGUILLA":"AI",
  "ANTARCTICA":"AQ",
  "ANTIGUA AND BARBUDA":"AG",
  "ARGENTINA":"AR",
  "ARMENIA":"AM",
  "ARUBA":"AW",
  "AUSTRALIA":"AU",
  "AUSTRIA":"AT",
  "AZERBAIJAN":"AZ",
  "BAHAMAS":"BS",
  "BAHRAIN":"BH",
  "BANGLADESH":"BD",
  "BARBADOS":"BB",
  "BELARUS":"BY",
  "BELGIUM":"BE",
  "BELIZE":"BZ",
  "BENIN":"BJ",
  "BERMUDA":"BM",
  "BHUTAN":"BT",
  "BOLIVIA, PLURINATIONAL STATE OF":"BO",
  "BONAIRE, SINT EUSTATIUS AND SABA":"BQ",
  "BOSNIA AND HERZEGOVINA":"BA",
  "BOTSWANA":"BW",
  "BOUVET ISLAND":"BV",
  "BRAZIL":"BR",
  "BRITISH INDIAN OCEAN TERRITORY":"IO",
  "BRUNEI DARUSSALAM":"BN",
  "BULGARIA":"BG",
  "BURKINA FASO":"BF",
  "BURUNDI":"BI",
  "CAMBODIA":"KH",
  "CAMEROON":"CM",
  "CANADA":"CA",
  "CAPE VERDE":"CV",
  "CAYMAN ISLANDS":"KY",
  "CENTRAL AFRICAN REPUBLIC":"CF",
  "CHAD":"TD",
  "CHILE":"CL",
  "CHINA":"CN",
  "CHRISTMAS ISLAND":"CX",
  "COCOS (KEELING) ISLANDS":"CC",
  "COLOMBIA":"CO",
  "COMOROS":"KM",
  "CONGO":"CG",
  "CONGO, THE DEMOCRATIC REPUBLIC OF THE":"CD",
  "COOK ISLANDS":"CK",
  "COSTA RICA":"CR",
  "CÔTE DIVOIRE":"CI",
  "CROATIA":"HR",
  "CUBA":"CU",
  "CURAÇAO":"CW",
  "CYPRUS":"CY",
  "CZECH REPUBLIC":"CZ",
  "DENMARK":"DK",
  "DJIBOUTI":"DJ",
  "DOMINICA":"DM",
  "DOMINICAN REPUBLIC":"DO",
  "ECUADOR":"EC",
  "EGYPT":"EG",
  "EL SALVADOR":"SV",
  "EQUATORIAL GUINEA":"GQ",
  "ERITREA":"ER",
  "ESTONIA":"EE",
  "ETHIOPIA":"ET",
  "FALKLAND ISLANDS (MALVINAS)":"FK",
  "FAROE ISLANDS":"FO",
  "FIJI":"FJ",
  "FINLAND":"FI",
  "FRANCE":"FR",
  "FRENCH GUIANA":"GF",
  "FRENCH POLYNESIA":"PF",
  "FRENCH SOUTHERN TERRITORIES":"TF",
  "GABON":"GA",
  "GAMBIA":"GM",
  "GEORGIA":"GE",
  "GERMANY":"DE",
  "GHANA":"GH",
  "GIBRALTAR":"GI",
  "GREECE":"GR",
  "GREENLAND":"GL",
  "GRENADA":"GD",
  "GUADELOUPE":"GP",
  "GUAM":"GU",
  "GUATEMALA":"GT",
  "GUERNSEY":"GG",
  "GUINEA":"GN",
  "GUINEA-BISSAU":"GW",
  "GUYANA":"GY",
  "HAITI":"HT",
  "HEARD ISLAND AND MCDONALD ISLANDS":"HM",
  "HONDURAS":"HN",
  "HONG KONG":"HK",
  "HUNGARY":"HU",
  "ICELAND":"IS",
  "INDIA":"IN",
  "INDONESIA":"ID",
  "IRAN, ISLAMIC REPUBLIC OF":"IR",
  "IRAQ":"IQ",
  "IRELAND":"IE",
  "ISLE OF MAN":"IM",
  "ISRAEL":"IL",
  "ITALY":"IT",
  "JAMAICA":"JM",
  "JAPAN":"JP",
  "JERSEY":"JE",
  "JORDAN":"JO",
  "KAZAKHSTAN":"KZ",
  "KENYA":"KE",
  "KIRIBATI":"KI",
  "KOREA, DEMOCRATIC PEOPLES REPUBLIC OF":"KP",
  "KOREA, REPUBLIC OF":"KR",
  "KUWAIT":"KW",
  "KYRGYZSTAN":"KG",
  "LAO PEOPLES DEMOCRATIC REPUBLIC":"LA",
  "LATVIA":"LV",
  "LEBANON":"LB",
  "LESOTHO":"LS",
  "LIBERIA":"LR",
  "LIBYAN ARAB JAMAHIRIYA":"LY",
  "LIECHTENSTEIN":"LI",
  "LITHUANIA":"LT",
  "LUXEMBOURG":"LU",
  "MACAO":"MO",
  "MACEDONIA, THE FORMER YUGOSLAV REPUBLIC OF":"MK",
  "MADAGASCAR":"MG",
  "MALAWI":"MW",
  "MALAYSIA":"MY",
  "MALDIVES":"MV",
  "MALI":"ML",
  "MALTA":"MT",
  "MARSHALL ISLANDS":"MH",
  "MARTINIQUE":"MQ",
  "MAURITANIA":"MR",
  "MAURITIUS":"MU",
  "MAYOTTE":"YT",
  "MEXICO":"MX",
  "MICRONESIA, FEDERATED STATES OF":"FM",
  "MOLDOVA, REPUBLIC OF":"MD",
  "MONACO":"MC",
  "MONGOLIA":"MN",
  "MONTENEGRO":"ME",
  "MONTSERRAT":"MS",
  "MOROCCO":"MA",
  "MOZAMBIQUE":"MZ",
  "MYANMAR":"MM",
  "NAMIBIA":"NA",
  "NAURU":"NR",
  "NEPAL":"NP",
  "NETHERLANDS":"NL",
  "NEW CALEDONIA":"NC",
  "NEW ZEALAND":"NZ",
  "NICARAGUA":"NI",
  "NIGER":"NE",
  "NIGERIA":"NG",
  "NIUE":"NU",
  "NORFOLK ISLAND":"NF",
  "NORTHERN MARIANA ISLANDS":"MP",
  "NORWAY":"NO",
  "OMAN":"OM",
  "PAKISTAN":"PK",
  "PALAU":"PW",
  "PALESTINIAN TERRITORY, OCCUPIED":"PS",
  "PANAMA":"PA",
  "PAPUA NEW GUINEA":"PG",
  "PARAGUAY":"PY",
  "PERU":"PE",
  "PHILIPPINES":"PH",
  "PITCAIRN":"PN",
  "POLAND":"PL",
  "PORTUGAL":"PT",
  "PUERTO RICO":"PR",
  "QATAR":"QA",
  "RÉUNION":"RE",
  "ROMANIA":"RO",
  "RUSSIA":"RU",
  "RUSSIAN FEDERATION":"RU",
  "RWANDA":"RW",
  "SAINT BARTHÉLEMY":"BL",
  "SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA":"SH",
  "SAINT KITTS AND NEVIS":"KN",
  "SAINT LUCIA":"LC",
  "SAINT MARTIN (FRENCH PART)":"MF",
  "SAINT PIERRE AND MIQUELON":"PM",
  "SAINT VINCENT AND THE GRENADINES":"VC",
  "SAMOA":"WS",
  "SAN MARINO":"SM",
  "SAO TOME AND PRINCIPE":"ST",
  "SAUDI ARABIA":"SA",
  "SENEGAL":"SN",
  "SERBIA":"RS",
  "SEYCHELLES":"SC",
  "SIERRA LEONE":"SL",
  "SINGAPORE":"SG",
  "SINT MAARTEN (DUTCH PART)":"SX",
  "SLOVAKIA":"SK",
  "SLOVENIA":"SI",
  "SOLOMON ISLANDS":"SB",
  "SOMALIA":"SO",
  "SOUTH AFRICA":"ZA",
  "SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS":"GS",
  "SPAIN":"ES",
  "SRI LANKA":"LK",
  "SUDAN":"SD",
  "SURINAME":"SR",
  "SVALBARD AND JAN MAYEN":"SJ",
  "SWAZILAND":"SZ",
  "SWEDEN":"SE",
  "SWITZERLAND":"CH",
  "SYRIAN ARAB REPUBLIC":"SY",
  "TAIWAN, PROVINCE OF CHINA":"TW",
  "TAJIKISTAN":"TJ",
  "TANZANIA, UNITED REPUBLIC OF":"TZ",
  "THAILAND":"TH",
  "TIMOR-LESTE":"TL",
  "TOGO":"TG",
  "TOKELAU":"TK",
  "TONGA":"TO",
  "TRINIDAD AND TOBAGO":"TT",
  "TUNISIA":"TN",
  "TURKEY":"TR",
  "TURKMENISTAN":"TM",
  "TURKS AND CAICOS ISLANDS":"TC",
  "TUVALU":"TV",
  "UGANDA":"UG",
  "UKRAINE":"UA",
  "UNITED ARAB EMIRATES":"AE",
  "UNITED KINGDOM":"GB",
  "UNITED STATES":"US",
  "UNITED STATES MINOR OUTLYING ISLANDS":"UM",
  "URUGUAY":"UY",
  "UZBEKISTAN":"UZ",
  "VANUATU":"VU",
  "VATICAN CITY STATE":"VA",
  "VENEZUELA, BOLIVARIAN REPUBLIC OF":"VE",
  "VIET NAM":"VN",
  "VIRGIN ISLANDS, BRITISH":"VG",
  "VIRGIN ISLANDS, U.S.":"VI",
  "WALLIS AND FUTUNA":"WF",
  "WESTERN SAHARA":"EH",
  "YEMEN":"YE",
  "ZAMBIA":"ZM",
  "ZIMBABWE":"ZW"
};

dt.geo.world_country_names = [];
dt.geo.world_country_iso2s = [];

for(var x in dt.geo.countries_to_iso2) {
  dt.geo.world_country_iso2s.push(dt.geo.countries_to_iso2[x]);
  dt.geo.world_country_names.push(x);
};
dt.geo.world_country_name = function () {
  var geo = dt.type.datatype({type:dt.type.geo_world}),
      us = dt.dictionary(dt.geo.world_country_names.map(function(x){return x.toUpperCase();})).transform(dt.uppercase),
      code = dt.lookup(dt.geo.countries_to_iso2).transform(dt.uppercase);

  geo.test = function(v) {
    var x = geo.parse(v);
    return x != dt.MISSING && x != dt.ERROR;
  };

  geo.parse = function(v) {
    if(dt.is_missing(v)) return dt.MISSING;
    v = code.lookup(v);
    if(v) return v;
    return dt.ERROR;
  };

  return geo;
};
dt.geo.world_country_iso2 = function() {
  return dt.type.datatype({
    constraints:[dt.dictionary(dt.geo.world_country_iso2s).transform(dt.uppercase)]
    });
};
dt.lowercase = function(v) {
  return v!=undefined ? (''+v).toLowerCase() : v;
};

dt.uppercase = function(v) {
  return v!=undefined ? (''+v).toUpperCase() : v;
};

dt.capitalize = function(v) {
  return v!=undefined ? (v = ''+v, v.length ? v[0].toUpperCase() + v.slice(1) : v) : v;
};
dt.lookup = function(lut) {
  var lookup = {},
      lut = lut || {}, transform;

  lookup.transform = function(x) {
    if (!arguments.length) return transform;
    transform = x;
    return lookup;
  };

  lookup.lut = function(x) {
    if (!arguments.length) return lut;
    lut = {};
    invert = [];
    for (v in x) {
      lut[v] = x[v];
      invert[x[v]] = v;
    }
    lut.inverted = invert;
  	return lut;
  };

  lookup.invert = function(v) {
    return invert[v];
  }

  lookup.lookup = function(v) {
    if(transform) v = transform(v);
    return lut[v];
  };

  lookup.lut(lut)

  return lookup;
};
dt.range = function() {
  var range = {},
      lower = 0, upper = 1, closed_lower = true, closed_upper = true;

  range.bounds = function(x) {
    if (!arguments.length) return [lower, upper];
    lower = x[0];
    upper = x[1];
	return range;
  };

  range.closed = function(x) {
    if (!arguments.length) return [closed_lower, closed_upper];
	if(arguments.length === 1) {
		closed_upper = closed_lower = x;
	}
	else{
      closed_lower = x[0];
      closed_upper = x[1];
	}
	return range;
  };


  range.test = function(v) {
    return v >= lower && (closed_lower || v != lower) && v <= upper && (closed_upper || v != upper);
  };

  return range;
};
dt.dictionary = function(values) {
  var dictionary = {},
      values = values || [], lut = {}, transform;

  dictionary.transform = function(x) {
    if (!arguments.length) return transform;
    transform = x;
    return dictionary;
  };

  dictionary.values = function(x) {
    if (!arguments.length) return values;
    lut = {};
    values = x.map(function(v){
      lut[v] = 1;
      return v;
    });
  	return dictionary;
  };


  dictionary.test = function(v) {
    if(transform) v = transform(v);
    return lut[v] != undefined;
  };

  dictionary.values(values);

  return dictionary;
};
dt.length = function(x) {
  var constaint = {},
      lower = 0, upper = 1, closed_lower = true, closed_upper = true;

  constaint.length = function(x) {
    if (!arguments.length) return [lower, upper];
    if (!x.length) x = [x, x];
    else if (x.length===1) x.push(x[0])
    lower = x[0];
    upper = x[1];
  	return constraint;
  };

  constraint.test = function(v) {
    return v.length <= max && v.length >= min;
  };

  constraint.length(x);

  return constraint;
};
dt.regex = function(pattern) {
  var regex = {};

  regex.pattern = function(x) {
    if (!arguments.length) return pattern;
    pattern = x;
  	return regex;
  };

  regex.test = function(v) {
    v = ""+v;
    var m = v.match(pattern);
    return (m != null) && (m[0].length === v.length);
  };

  return regex;
};
dt.number = function() {
  var pattern = {};

  pattern.regex = function(x) {
    if (!arguments.length) return pattern;
    pattern = x;
  	return regex;
  };

  return regex;
};
dt.inference = {};

/** Abstract parent inference class */
dt.inference.inference = function(registry) {
  var inference = {};
  registry = registry || dt.registry.default_registry();

  inference.registry = function(x) {
    if(!arguments.length) return registry;
    registry = x;
    return inference;
  };

  inference.infer_types = function(table, opt) {
    var type, types;
    return table.map(function(col) {
      type = inference.infer_column_type(col.raw(), opt);
      return type;
    })
  };

  return inference;
};
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

dt.inference.simple = function(registry) {
  var inference = dt.inference.inference(registry);

  inference.infer_column_type = function(column, opt) {
    opt = opt || {};
    var c, t, registry = inference.registry(), type_counts, val,
        registry_length = registry.length, column_length = column.length, registry
        sample_size = Math.min(column_length, opt.sample_size || 100), non_missing_count = 0;

    type_counts = dv.array(registry.length);
    for (c = 0; c < sample_size; ++c) {
      val = column[c];
      if (dt.is_missing(val)) {
        continue;
      }

      non_missing_count++;

      for (t = 0; t < registry_length; ++t) {
        type = registry[t];
        if (type.test(val)) {
          type_counts[t]++;
        }
      }
    };




    for (t = 0; t < type_counts.length; ++t) {
      if(type_counts[t] && type_counts[t] >= .8*non_missing_count) {
        return registry[t];
      }
    };
    return dt.type.string();
  }
  return inference;
};


dt.inference.mdl = function(type, num_types) {
  /* plogm + AvgValLenlog|ξ| + f * p * logMaxLen
   * + log|values of length len(wi,j) that satisfy ds| / |values of length len(wi.j )| */
}})();