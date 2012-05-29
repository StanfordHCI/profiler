(function(){/**
 * @class The built-in Array class.
 * @name Array
 */

/**
 * Creates a new array with the results of calling a provided function on every
 * element in this array. Implemented in Javascript 1.6.
 *
 * @function
 * @name Array.prototype.map
 * @see <a
 * href="https:\\developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Objects/Array/Map">map</a>
 * documentation.
 * @param {function} f function that produces an element of the new Array from
 * an element of the current one.
 * @param [o] object to use as <tt>this</tt> when executing <tt>f</tt>.
 */
if (!Array.prototype.map) Array.prototype.map = function(f, o) {
  var n = this.length;
  var result = new Array(n);
  for (var i = 0; i < n; i++) {
    if (i in this) {
      result[i] = f.call(o, this[i], i, this);
    }
  }
  return result;
};

/**
 * Creates a new array with all elements that pass the test implemented by the
 * provided function. Implemented in Javascript 1.6.
 *
 * @function
 * @name Array.prototype.filter
 * @see <a
 * href="https:\\developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Objects/Array/filter">filter</a>
 * documentation.
 * @param {function} f function to test each element of the array.
 * @param [o] object to use as <tt>this</tt> when executing <tt>f</tt>.
 */
if (!Array.prototype.filter) Array.prototype.filter = function(f, o) {
  var n = this.length;
  var result = new Array();
  for (var i = 0; i < n; i++) {
    if (i in this) {
      var v = this[i];
      if (f.call(o, v, i, this)) result.push(v);
    }
  }
  return result;
};

/**
 * Executes a provided function once per array element. Implemented in
 * Javascript 1.6.
 *
 * @function
 * @name Array.prototype.forEach
 * @see <a
 * href="https:\\developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Objects/Array/ForEach">forEach</a>
 * documentation.
 * @param {function} f function to execute for each element.
 * @param [o] object to use as <tt>this</tt> when executing <tt>f</tt>.
 */
if (!Array.prototype.forEach) Array.prototype.forEach = function(f, o) {
  var n = this.length >>> 0;
  for (var i = 0; i < n; i++) {
    if (i in this) f.call(o, this[i], i, this);
  }
};

/**
 * Apply a function against an accumulator and each value of the array (from
 * left-to-right) as to reduce it to a single value. Implemented in Javascript
 * 1.8.
 *
 * @function
 * @name Array.prototype.reduce
 * @see <a
 * href="https:\\developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Objects/Array/Reduce">reduce</a>
 * documentation.
 * @param {function} f function to execute on each value in the array.
 * @param [v] object to use as the first argument to the first call of
 * <tt>t</tt>.
 */
if (!Array.prototype.reduce) Array.prototype.reduce = function(f, v) {
  var len = this.length;
  if (!len && (arguments.length == 1)) {
    throw new Error("reduce: empty array, no initial value");
  }

  var i = 0;
  if (arguments.length < 2) {
    while (true) {
      if (i in this) {
        v = this[i++];
        break;
      }
      if (++i >= len) {
        throw new Error("reduce: no values, no initial value");
      }
    }
  }

  for (; i < len; i++) {
    if (i in this) {
      v = f(v, this[i], i, this);
    }
  }
  return v;
};


/**
 * The top-level Datavore namespace. All public methods and fields should be
 * registered on this object. Note that core Datavore source is surrounded by an
 * anonymous function, so any other declared globals will not be visible outside
 * of core methods. This also allows multiple versions of Datavore to coexist,
 * since each version will see their own <tt>dv</tt> namespace.
 *
 * @namespace The top-level Datavore namespace, <tt>dv</tt>.
 */
dv = {};

/**
 * Datavore major and minor version numbers.
 *
 * @namespace Datavore major and minor version numbers.
 */
dv.version = {
  /**
   * The major version number.
   *
   * @type number
   * @constant
   */
  major: 0,

  /**
   * The minor version number.
   *
   * @type number
   * @constant
   */
  minor: 1
};

/**
 * @private Reports the specified error to the JavaScript console. Mozilla only
 * allows logging to the console for privileged code; if the console is
 * unavailable, the alert dialog box is used instead.
 *
 * @param e the exception that triggered the error.
 */
dv.error = function (e) {
  (typeof console == "undefined") ? alert(e) : console.error(e);
};

/**
 * @private Registers the specified listener for events of the specified type on
 * the specified target. For standards-compliant browsers, this method uses
 * <tt>addEventListener</tt>; for Internet Explorer, <tt>attachEvent</tt>.
 *
 * @param target a DOM element.
 * @param {string} type the type of event, such as "click".
 * @param {function} the event handler callback.
 */
dv.listen = function (target, type, listener) {
  listener = dv.listener(listener);
  return target.addEventListener
    ? target.addEventListener(type, listener, false)
    : target.attachEvent("on" + type, listener);
};

/**
 * @private Returns a wrapper for the specified listener function such that the
 * {@link dv.event} is set for the duration of the listener's invocation. The
 * wrapper is cached on the returned function, such that duplicate registrations
 * of the wrapped event handler are ignored.
 *
 * @param {function} f an event handler.
 * @returns {function} the wrapped event handler.
 */
dv.listener = function (f) {
  return f.$listener || (f.$listener = function (e) {
    try {
      dv.event = e;
      return f.call(this, e);
    } finally {
      delete dv.event;
    }
  });
};dv.array = function (n) {
  var a = Array(n);
  for (var i=n; --i >= 0;) { a[i] = 0; }
  return a;
};

dv.array_with_init = function (n, init) {
  var a = Array(n);
  for (var i=n; --i >= 0;) { a[i] = init; }
  return a;
};

dv.minv = function (x) {
  var m = Infinity,i = 0,l=x.length;
  for (;i < l;++i){
    v = x[i];
    if (v < m) m = v;
  }
  return m;
};

dv.maxv = function (x) {
  var m = -Infinity,i = 0,l=x.length;
  for (;i < l;++i){
    v = x[i];
    if (v > m) m = v;
  }
  return m;
};

dv.span = function (x) {
  var min = Infinity, max = -Infinity, v;
  for (var i = 0; i < x.length;++i){
    v = x[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
};



dv.rand = {};

dv.rand.uniform = function (min, max) {
  min = min || 0;
  max = max || 1;
  var delta = max - min;
  return function () {
    return min + delta * Math.random();
  }
};

dv.rand.integer = function (a, b) {
  if (b === undefined) {
    b = a;
    a = 0;
  }
  return function () {
    return a + Math.max(0, Math.floor(b*(Math.random()-0.001)));
  }
};

dv.rand.normal = function (mean, stdev) {
  mean = mean || 0;
  stdev = stdev || 1;
  var next = undefined;
  return function () {
    var x = 0, y = 0, rds, c;
    if (next !== undefined) {
      x = next;
      next = undefined;
      return x;
    }
    do {
      x = Math.random()*2-1;
      y = Math.random()*2-1;
      rds = x*x + y*y;
    } while (rds == 0 || rds > 1);
    c = Math.sqrt(-2*Math.log(rds)/rds);
    next = mean + y*c*stdev;
    return mean + x*c*stdev;
  }
};

/*** Sorting ****/

/*** Sorting ****/

dv.merge_sort =  function (array,comparison) {

  comparison = comparison || dv.merge_sort.stringCompare;

  if (array.length < 2)
    return array;
  var middle = Math.ceil(array.length/2);
  return dv.merge_sort.merge(dv.merge_sort(array.slice(0,middle),comparison),
      dv.merge_sort(array.slice(middle),comparison),
      comparison);
};


dv.merge_sort.merge = function (left,right,comparison) {
  var result = new Array();
  while((left.length > 0) && (right.length > 0))
  {
    if (comparison(left[0],right[0]) < 0)
      result.push(left.shift());
    else
      result.push(right.shift());
  }
  while(left.length > 0)
    result.push(left.shift());
  while(right.length > 0)
    result.push(right.shift());
  return result;
};


dv.merge_sort.stringCompare = function (left, right) {
  left = ""+left
  right = "" + right

  return dv.merge_sort.compare(left,right)
};

dv.merge_sort.compare = function (left, right) {
  if (left == right)
    return 0;
  else if (left < right)
    return -1;
  else
    return 1;
};

dv.merge_sort.numberCompare = function (left, right) {
  if (left===undefined&&right===undefined) return 0;
  if (left===undefined) return -1;
  if (right===undefined) return 1;

  leftNo = Number(left)
  rightNo = Number(right)
  if (isNaN(leftNo)&&isNaN(rightNo)) return dv.merge_sort.compare(left, right)
  else if (isNaN(leftNo)) return -1
  else if (isNaN(rightNo)) return 1
  return dv.merge_sort.compare(leftNo, rightNo)
};

dv.merge_sort.dateCompare = function (left, right) {
  leftNo = Number(left)
  rightNo = Number(right)
  if (isNaN(leftNo)&&isNaN(rightNo)) return dv.merge_sort.compare(left, right);
  else if (isNaN(leftNo)) return rightNo;
  else if (isNaN(rightNo)) return leftNo;
  return dv.merge_sort.compare(leftNo, rightNo);
};

dv.jq = function (e, opt) {
  opt = opt || {};
  var x = jQuery(document.createElement(e)), select_options = opt.select_options || [];

  d3.keys(select_options).forEach(function (o){
    var option = document.createElement("option");
    option.value = o;
    option.text = select_options[o];
    x[0].options.add(option)
  });

  return x;
};

dv.add_select_option = function(select, key, value){
	if(arguments.length < 3) value = key;
	var option = document.createElement("option");
	option.value = value;
	option.text = key;
	select[0].options.add(option);
};

dv.sort_multiple = function (a, fields, directions) {
  var idx = d3.range(a[0].length), l, r, i, fl = fields.length, directions = directions || [];
  idx.sort(function (x, y){
    for (i = 0; i < fl; ++i){
      l = a[fields[i]][x];
      r = a[fields[i]][y];
      if (l < r) return directions[i] === 1 ? 1 : -1;
      if (l > r) return directions[i] === 1 ? -1 : 1;
    }
    return 0;
  });

  var result = a.map(function (v, j){
    var col = dv.array(idx.length), f = a[j];
    for (i = 0; i < idx.length; ++i){
      col[i] = f[idx[i]]
    }
    return col;
  })
  result.idx = idx;
  return result;
};

dv.time = function (f, numreps) {
  numreps = numreps || 1000;
  var start = Date.now(), end, a = dv.array(numreps);
  a.push(f());
  console.log(Date.now()-start)
};


/**
 * @param {number} start
 * @param {number=} stop
 * @param {number=} step
 */
dv.range = function(start, stop, step) {
  if (arguments.length === 1) { stop = start; start = 0; }
  if (step == null) step = 1;
  if ((stop - start) / step == Infinity) throw new Error("infinite range");
  var range = [],
       i = -1,
       j;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j);
  else while ((j = start + step * ++i) < stop) range.push(j);
  return range;
};

dv.merge = function(obj1, obj2) {
  var merged = {};
  d3.keys(obj1).forEach(function(key) {
    merged[key] = obj1[key];
  })
  d3.keys(obj2).forEach(function(key) {
    merged[key] = obj2[key];
  })
  return merged;
};



dv.type = {
  nominal: "nominal",
  ordinal: "ordinal",
  numeric: "numeric",
  unknown: "unknown"
};

dv.table = function (input)
{
  var table = [];
  table.indices = {};
  /** Options
  * encoded: specify whether the input values have already been incoded
  * lut: the lut used if the values are already encoded.
  */
  table.addColumn = function (name, values, type, options) {
    options = options || {};
    type = type || dt.type.string();
    var encode = !options.encoded;
    var rle = false;
    var vals = values, raw = options.raw || values.slice(0, values.length), map, i, u, v, run = 0;



    if (typeof type === 'string') {
      if (type === dv.type.nominal) {
        type = dt.type.string();
      } else if (type === dv.type.ordinal) {
        type = dt.type.string();
      } else if (type === dv.type.numeric) {
        type = dt.type.number();
      } else {
        type = dt.type.string();
      }
    }

    if (encode) {

      vals = type.code(values);
    }


    if(rle) {
      vals.rle = rle;
      if (rle) {


        v = map[values[0]]; run = 1;
        for (i = 1; i < values.length; ++i) {
          u = map[values[i]];
          if (u !== v) {
            vals.push(v);
            vals.push(run);
            v = u; run = 1;
          } else { run += 1; }
        }
        vals.push(v);
        vals.push(run);
      }
    }

    vals.name = function(x) {
      var z;
      if(!arguments.length) {
        z = vals._name;
        if(z.charCodeAt(0) === 95) {
          return z.substr(1);
        }
        return z;
      } else {
        z = table.clean_name(x);
        vals._name = z;
        return vals;
      }
    }

    vals.raw = function() {
      return raw;
    }

    vals.name(name);
    if(options.encoded) vals.lut = options.lut;

    if(vals.lut) {
      vals.get = function(index) {
        return vals.lut[vals[index]];
      }
      vals.set_code = function(index, code) {
        vals[index] = code;
        raw[index] = vals.lut[code];
      }
      vals.set_code_and_raw = function(index, code, raw_value) {
        vals[index] = code;
        raw[index] = raw_value;
      }
      vals.get_raw = function(index) {
        return vals.lut[vals[index]]  || raw[index];
      }
    } else {
      vals.get = function(index) {
        return vals[index];
      }
      vals.set_code_and_raw = function(index, code, raw_value) {
        vals[index] = code;
        raw[index] = raw_value;
      }
      vals.set_code = function(index, code) {
        vals[index] = code;
        raw[index] = code;
      }
      vals.get_raw = function(index) {
        return vals[index] || raw[index];
      }
    }

    if(options.index === undefined){
	    vals.index = table.length;
			table.push(vals);
		}
		else{
			table.splice(options.index, 0, vals)
			table.updateIndices();
		}

    vals.copy = function() {
      var dummy_table = dv.table();
      return dummy_table.addColumn(vals._name, vals.slice(), vals.type,
          {encoded:vals.lut != undefined, lut:vals.lut, raw:vals.raw().slice()});
    }
    vals.system = options.system;
    vals.type = type;
    table[vals._name] = vals;
    return vals;
  }

  table.recode = function(new_types) {
    var old_index, new_type;
    table.map(function(col, i) {
      new_type = new_types[i];
      if(new_type.name() != col.type.name()) {
        old_index = col.index;
        table.removeColumn(col.index);
        table.addColumn(col.name(), col.raw(), new_type, {index:old_index});
      }
    })
  }

  table.clean_name = function(name) {
    if (parseInt(name)==name) name = '_'+name;
    var index = 0, original = name;
    while(table[name]) {
      index++;
      name = original + index;
    }
    return name;
  }

  table.updateIndices = function() {
    table.map(function(col, index) {
      col.index = index;
    })
  }

  table.removeColumn = function (col) {
    col = table[col] || null;
    if (col != null) {
      delete table[col.name()];
      table.splice(col.index, 1);
    }
    table.updateIndices();
    return col;
  }

  table.rows = function () { return table[0] ? table[0].length : 0; }

  table.cols = function () { return table.length; }

	table.slice = function(start, end, o) {
		var new_table = dv.table(), new_col;
		start = start || 0;
		if(end===undefined) end = table.rows()
	  table.map(function(col){
		  new_table.addColumn(col.name(), col.slice(start, end), col.type, {lut:col.lut, encoded:true, raw:col.raw().slice(start, end)})
		})
		return new_table;
	};

  table.row = function(index) {
    return table.map(function(c) {
      return c.get(index);
    })
  }

  /* Creates a shallow copy of a table, reusing columns. */
  table.copy_shallow = function() {
    var copy = dv.table();
    table.map(function(col) {
      copy.push(col);
    })
    return copy;
  }

  table.query = function (q) {
    var dims = [], sz = [1], hasDims = q.dims, filter_index = q.filter_index;

    if (hasDims) {
      sz = [];
      for (i = 0; i < q.dims.length; ++i) {
        var dim = q.dims[i], type = typeof dim;
        if (type === "string" || type === "number") {

          col = dv.categorical_bin(dim).array(table[dim], table[dim].lut);
        } else if (dim.binned) {
          col = dim;
        } else if (dim.array) {

          col = dim.array(table[dim.value]);
        }
        dims.push(col);
        sz.push(col.lut.length);
      }
    }

    var vals = q.vals,
      C = sz.reduce(function (a,b) { return a * b; }, 1),
      N = filter_index ? filter_index.length : table[0].length, p, col, v, udf, udf_result, name, expr,
      cnt, sum, ssq, min, max, list, dot,
      _cnt, _sum, _ssq, _min, _max, _dot, _list,
      ctx = {}, emap = {}, exp = [], expKeys = [], lut,
      z = 0, i = 0, j = 0, k=0, l=0, idx=0, len, slen = sz.length, initial_value;


    var star = false;

    for (i = 0; i < vals.length; ++i) {
      var req = vals[i].init();
      for (expr in req) {
        if (expr == "*") {
          req[expr].map(function (func) {
            if (func === 'list') {
              ctx[func] = d3.range(C).map(function(){return []});
            } else {
              ctx[func] = dv.array(C);
            }
          });


          star = true;
        }
        else if (expr == "^") {
						req[expr].map(function(func) {
							ctx[func.key] = dv.array(C);
							if (!emap[func.key]) {
								emap[func.key] = true;
								exp.push(func);
        		}
        	});
        }
        else {
          idx = table[expr].index;
          name = table[expr].name();
          req[expr].map(function (func) {
            initial_value = 0;
            if (func === 'max') {
              initial_value = -Infinity;
            } else if (func === 'min') {
              initial_value = Infinity;
            } else if (func === 'list') {
              initial_value = [];
            }
            ctx[func+"_"+name] = (ctx[func+"_"+idx] = dv.array_with_init(C, initial_value));
          });
          if (!emap[idx]) {
            emap[idx] = true;
            exp.push(idx);

          }
        }
      }
    }


    if (exp.length==0 && star) exp.push(-1);


    for (i = 0, p=[1]; i < slen; ++i) {
      p.push(p[i]*sz[i]);
    }




    for (j = 0, len=exp.length; j < len; ++j) {
      expr = exp[j];
      if(typeof expr==='object') {
        udf = true;
        udf_result = ctx[expr.key];
      }
      else {
        udf = false;
        cnt = ctx["cnt"]; _cnt = (cnt && j == 0);
        cnt_lt = ctx["cnt_lt_"+expr]; _cnt_lt = (cnt_lt && j == 0);
        cnt_if = ctx["cnt_if_"+expr]; _cnt_if = (cnt_if !== undefined);
        sum = ctx["sum_"+expr]; _sum = (sum !== undefined);
        ssq = ctx["ssq_"+expr]; _ssq = (ssq !== undefined);
        min = ctx["min_"+expr]; _min = (min !== undefined);
        max = ctx["max_"+expr]; _max = (max !== undefined);
        list = (expr===-1 ? ctx["list"] : ctx["list_"+expr]); _list = (list !== undefined);
        col = table[expr];
      }
outer:
      for (z = 0; z < N; ++z) {
        i = (filter_index ? filter_index[z] : z);
        for (idx=0, k=0; k<slen; ++k) {
          l = (hasDims ? dims[k][i] : 0);
          if (l < 0) continue outer;
          idx += p[k] * l;
        }
        if(udf) {
           udf_result[idx] += expr.map(table, i);
        }
        else {
          if (col) v = col[i];
          if (_cnt) cnt[idx] += 1;
          if (_sum && v) sum[idx] += v;
          if (_ssq && v) ssq[idx] += v*v;
          if (_min && v!==undefined && v < min[idx]) min[idx] = v;
          if (_max && v!==undefined && v > max[idx]) max[idx] = v;
          if (_dot && v && (w = extra_cols[0][idx])) dot[idx] += v*w;
          if (_list) {list[idx].push(col ? v : i); };
        }
      }

    }


    var result = [], stride = 1, s, val, code = q.code || false;

    for (i = 0; i < dims.length; ++i) {
      col = [];
      lut = dims[i].lut;
      s = sz[i];
      val = 0;
      for (j = 0, k=0, c=-1; j < C; ++j, ++k) {
        if (k == stride) { k = 0; val = (val + 1) % s; }
        col[j] = code ? lut[val] : val;
      }
      stride *= s;
      col.unique = lut.length;
      result.push(col);
    }


    vals.map(function (op) {
      var as = op.as(), r = op.done(ctx);
      if(as) result[as] = r;
      result.push(r);
    });

    return result;
  }

  table.debug = function(rows) {
    rows = rows || Math.min(table.rows(), 100);
    return dv.range(rows).map(function(r) {
      return table.map(function(c) {
        return c.get(r);
      }).join('\t')
    }).join('\n')
  }

  table.where = function (f) {
    var nrows = table.rows(),
      ncols = table.cols();


    var result = dv.table([]);
    for (var i = 0; i < ncols; ++i) {
      result.addColumn(table[i].name(), [], table[i].type, {encoded:true, lut:table[i].lut});





    }

    if (f.simple) {
      var col = table[f.field], v, lower = f.lower, upper = f.upper, ex = f.ex;
      for (var row=0, j = -1; row<nrows; ++row) {
        v = col[row];
        if (lower < v && v < upper && (ex || v != upper)){
          for (i = 0, ++j; i < ncols; ++i) {
            result[i][j] = table[i][row];
          }
        }
      }
    } else {
      for (var row = 0, j = -1; row < nrows; ++row) {
        if (f(table, row)) {
          for (i = 0, ++j; i < ncols; ++i) {
            result[i].set_code_and_raw(j, table[i][row], table[i].get_raw(row));
          }
        }
      }
    }
    return result;
  }

  table.schema = function() {
    return table.map(function(col) {
      return col.name();
    })
  }

  /** @private */


  function code(a) {
    var c = [], d = {}, v;
    for (var i = 0, len = a.length; i < len; ++i) {
      if (d[v=a[i]] === undefined) { d[v] = 1; c.push(v); }
    }
    return c.sort();
  };

  /** @private */


  function dict(lut) {
    return lut.reduce(function (a,b,i) { a[b] = i; return a; }, {});
  };


  if (input) {
    input.forEach(function (d) {
      table.addColumn(d.name, d.values, d.type);
    });
  }
  return table;
};


dv.noop = function () {};



dv.op = function(expr, o) {
  o = o || {};
  var op = {}, as = o.as;
  op.as = function (x) {
    if(!arguments.length) return as;
    as = x;
    return op;
  };


  op.value = expr;
  return op;
}

dv.count = function (expr, o) {
  o = o || {};
  var op = dv.op(expr, o);
  op.init = function () {
    return {"*":["cnt"]};
  }
  op.done = function (ctx) {return ctx["cnt"]; };
  op.value = expr;
  return op;
};

dv.pred_key = function (pred) {
  if (!pred) return '';
  return '_'+d3.keys(pred).map(function (k) {
    return k+'_'+pred[k].name;
  }).join('_')
};

dv.min = function (expr, o) {
  o = o || {};
  var op = dv.op(expr, o);
  op.init = function () {
    var o = {}; o[expr] = ["min"]; return o;
  }
  op.done = function (ctx) { return ctx["min_"+expr]; };
  op.value = expr;
  return op;
};

dv.max = function (expr, o) {
  o = o || {};
  var op = dv.op(expr, o);
  op.init = function () {
    var o = {}; o[expr] = ["max"]; return o;
  }
  op.done = function (ctx) { return ctx["max_"+expr]; };
  op.value = expr;
  return op;
};

dv.sum = function (expr, o) {
  o = o || {};
  var op = dv.op(expr, o);
  op.init = function () {
    var o = {}; o[expr] = ["sum"]; return o;
  }
  op.done = function (ctx) { return ctx["sum_"+expr]; };
  op.value = expr;
  return op;
};

dv.avg = function (expr, o) {
  o = o || {};
  var op = dv.op(expr, o);
  op.init = function () {
    var o = {"*":["cnt"]}; o[expr] = ["sum"]; return o;
  };
  op.done = function (ctx) {
    var akey = "avg_"+expr, avg = ctx[akey];
    if (!avg) {
      var sum = ctx["sum_"+expr], cnt = ctx["cnt"];
      ctx[akey] = (avg = sum.map(function (v,i) { return v/cnt[i]; }));
    }
    return avg;
  };
  op.value = expr;
  return op;
};

dv.variance = function (expr, o) {
  o = o || {};
  var op = dv.op(expr, o), adj = o.sample ? 1 : 0;
  op.init = function () {
    var o = {"*":["cnt"]}; o[expr] = ["sum","ssq"]; return o;
  };
  op.done = function (ctx) {
    var cnt = ctx["cnt"], sum = ctx["sum_"+expr], ssq = ctx["ssq_"+expr];
    var akey = "avg_"+expr, avg = ctx[akey];
    if (!avg) {
      ctx[akey] = (avg = sum.map(function (v,i) { return v/cnt[i]; }));
    }
    return ssq.map(function (v,i) { return (v - avg[i]/cnt[i]) / (cnt[i]-adj); });
  };
  op.value = expr;
  return op;
};

dv.stdev = function (expr, o) {
  var op = dv.variance(expr, o), end = op.done;
  op.done = function (ctx) {
    var dev = end(ctx);
    for (var i = 0; i < dev.length; ++i) { dev[i] = Math.sqrt(dev[i]); }
    return dev;
  }
  return op;
};

dv.list = function (expr, o) {
  var op = dv.op(expr, o);
  op.init = function () {
    var o = {}; o[expr] = ["list"]; return o;
  }
  op.done = function (ctx) { return expr === "*" ? ctx["list"]: ctx["list_"+expr]; };
  op.value = expr;
  return op;
};

/**Use list instead with * indicating indices */
dv.index = function (expr) {
  var op = {};
  op.init = function () {
    return {"^":["index"]};
  }
  op.done = function (ctx) {return ctx["index"]; };
  op.value = expr;
  return op;
};



dv.categorical_bin = function(expr) {
  var op = {}
  op.array = function(values, original_lut) {
    var N = values.length, val, idx, i,
        a = [],
        lut = original_lut.slice(), unique = lut.length,
        missing = dt.MISSING, error = dt.ERROR;
    a.lut = lut;
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val === missing)
        idx = unique;
      else if (val === error)
        idx = unique + 1;
      else
        idx = val;
      a.push(idx);
    }
    lut.push(missing)
    lut.push(error)
    return a;
  };
  op.key = [expr];
  op.value = expr;
  return op;
}

dv.bin = function (expr, step, min, max) {
  var op = {};
  op.array = function (values) {
    var N = values.length, val, idx, i,
      minv = min, maxv = max, minb = false, maxb = false;
    if (minv === undefined) { minv = Infinity; minb = true; }
    if (maxv === undefined) { maxv = -Infinity; maxb = true; }
    if (minb || maxb) {
      for (i = 0; i < N; ++i) {
        val = values[i];
        if (minb && val < minv) minv = val;
        if (maxb && val > maxv) maxv = val;
      }
      if (minb) minv = Math.floor(minv / step) * step;
      if (maxb) maxv = Math.ceil(maxv / step) * step;
    }

    var a = [], lut = (a.lut = []),
      range = (maxv - minv), unique = Math.ceil(range/step), missing = dt.MISSING, error = dt.ERROR;
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val === missing)
        idx = unique;
      else if (val === error)
        idx = unique + 1;
      else if (val < minv || val > maxv)
        idx = -1;
      else if (val == maxv)
        idx = unique-1;
      else

        idx = ~~((values[i]-minv)/step);

      a.push(idx);
    }
    for (i = 0; i < unique; ++i) {

      lut.push(minv + i*step);
    }
    lut.push(missing)
    lut.push(error)
    return a;
  };
  op.key = [expr,step,min,max].join("|");
  op.value = expr;
  return op;
};

dv.binRLE = function (expr, step, min, max) {
  var op = {};
  op.array = function (values) {
    if (op.cached) return op.cached;
    var N = values.length, val, i, idx, pidx = -2, cnt = 0,
      minv = min, maxv = max, minb = false, maxb = false;
    if (minv === undefined) { minv = Infinity; minb = true; }
    if (maxv === undefined) { maxv = -Infinity; maxb = true; }
    if (minb || maxb) {
      for (i = 0; i < N; ++i) {
        val = values[i];
        if (minb && val < minv) minv = val;
        if (maxb && val > maxv) maxv = val;
      }
      if (minb) minv = Math.floor(minv / step) * step;
      if (maxb) maxv = Math.ceil(maxv / step) * step;
    }

    var a = [], lut = (a.lut = []),
      range = (maxv - minv), unique = Math.ceil(range/step);
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val < minv || val > maxv)
        idx = -1;
      else if (val == maxv)
        idx = unique-1;
      else
        idx = Math.floor(unique*(values[i]-minv)/range);
      if (idx === pidx) {
        cnt += 1;
      } else if (pidx > -2) {
        a.push(pidx);
        a.push(cnt);
        pidx = idx;
        cnt = 1;
      } else {
        pidx = idx;
        cnt = 1;
      }
    }
    if (cnt > 0) { a.push(pidx); a.push(cnt); }
    for (i = 0; i < unique; ++i) {

      lut.push(minv + i*step);
    }
    a.rle = true;
    op.cached = a;
    return a;
  };
  op.key = [expr,step,min,max].join("|");
  op.value = expr;
  return op;
};

dv.quantile = function (expr, n) {
  function search(array, value) {
    var low = 0, high = array.length - 1;
    while (low <= high) {
      var mid = (low + high) >> 1, midValue = array[mid];
      if (midValue < value) low = mid + 1;
      else if (midValue > value) high = mid - 1;
      else return mid;
    }
    var i = -low - 1;
    return (i < 0) ? (-i - 1) : i;
  }

  var op = {};
  op.array = function (values) {

    var i, d = values.sorted;
    if (!d) {
      var cmp;
      if (values.type && values.type === "numeric") {
        cmp = function (a,b) { return a-b; }
      } else {
        cmp = function (a,b) { return a<b ? -1 : a>b ? 1 : 0; }
      }
      values.sorted = (d = values.slice().sort(cmp));
    }

    var q = [d[0]], a = [], lut = (a.lut = []);
    for (i = 1; i <= n; ++i) {
      q[i] = d[~~(i * (d.length - 1) / n)];
      lut.push(i-1);
    }

    for (i = 0; i < values.length; ++i) {
      a.push(Math.max(0, search(q, values[i])-1));
    }
    return a;
  }
  op.value = expr;
  return op;
};

dv.month = function (expr) {
  var op = {};
  op.array = function (values) {
    var N = values.length, val, idx, i;

    var a = [], lut = (a.lut = []),
      unique = 12, missing = dt.MISSING, error = dt.ERROR;
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val === missing)
        idx = unique;
      else if (val === error)
        idx = unique + 1;
      else
        idx = val.getMonth();
      a.push(idx);
    }
    for (i = 0; i < unique; ++i) {
      lut.push(i);
    }
    lut.push(missing)
    lut.push(error)
    return a;
  };
  op.key = [].join("|");
  op.value = expr;
  return op;
};

dv.quarter = function (expr) {
  var op = {};
  op.array = function (values) {
    var N = values.length, val, idx, i;

    var a = [], lut = (a.lut = []),
      unique = 4, missing = dt.MISSING, error = dt.ERROR;
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val === missing)
        idx = unique;
      else if (val === error)
        idx = unique + 1;
      else
        idx = ~~(val.getMonth() / 4);
      a.push(idx);
    }
    for (i = 0; i < unique; ++i) {
      lut.push(i);
    }
    lut.push(missing)
    lut.push(error)
    return a;
  };
  op.key = [].join("|");
  op.value = expr;
  return op;
};


dv.year = function (expr, min, max) {
  var op = {};
  op.array = function (values) {
    var N = values.length, val, idx, i;

    var a = [], lut = (a.lut = []),
      unique = max - min + 1, missing = dt.MISSING, error = dt.ERROR;
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val === missing)
        idx = unique;
      else if (val === error)
        idx = unique + 1;
      else
        idx = val.getFullYear() - min;

        if (idx < 0) idx += 1900
      a.push(idx);
    }
    for (i = 0; i < unique; ++i) {
      lut.push(i);
    }
    lut.push(missing)
    lut.push(error)
    return a;
  };
  op.key = [].join("|");
  op.value = expr;
  return op;
};


dv.month_year = function (expr, min, max) {
  var op = {};
  op.array = function (values) {
    var N = values.length, val, idx, i;

    var a = [], lut = (a.lut = []),
      missing = dt.MISSING, error = dt.ERROR,
      diff = dt.month_year_difference, day_add = dt.month_year_add, unique = ~~diff(max, min) + 1;
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val === missing)
        idx = unique;
      else if (val === error)
        idx = unique + 1;
      else {
        idx = ~~diff(val, min);
      }
      a.push(idx);
    }
    for (i = 0; i < unique; ++i) {
      lut.push(day_add(min, i));
    }
    lut.push(missing)
    lut.push(error)
    return a;
  };
  op.key = [].join("|");
  op.value = expr;
  return op;
};


dv.day = function (expr, min, max) {
  var op = {};
  op.array = function (values) {
    var N = values.length, val, idx, i;

    var a = [], lut = (a.lut = []),
      missing = dt.MISSING, error = dt.ERROR,
      diff = dt.day_difference, day_add = dt.day_add, unique = ~~diff(max, min) + 1;
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val === missing)
        idx = unique;
      else if (val === error)
        idx = unique + 1;
      else {
        idx = ~~diff(val, min);
      }
      a.push(idx);
    }
    for (i = 0; i < unique; ++i) {
      lut.push(day_add(min, i));
    }
    lut.push(missing)
    lut.push(error)
    return a;
  };
  op.key = [].join("|");
  op.value = expr;
  return op;
};

dv.hour = function (expr, min, max) {
  var op = {};
  op.array = function (values) {
    var N = values.length, val, idx, i;

    var a = [], lut = (a.lut = []),
      missing = dt.MISSING, error = dt.ERROR,
      diff = dt.hour_difference, hour_add = dt.hour_add, unique = ~~diff(max, min) + 1;
    for (i = 0; i < N; ++i) {
      val = values[i];
      if (val === missing)
        idx = unique;
      else if (val === error)
        idx = unique + 1;
      else {
        idx = ~~diff(dt.hour(val), min);
      }
      a.push(idx);
    }
    for (i = 0; i < unique; ++i) {
      lut.push(hour_add(min, i));
    }
    lut.push(missing)
    lut.push(error)
    return a;
  };
  op.key = [].join("|");
  op.value = expr;
  return op;
};

dv.partition_results = function (results, dims, count_col, opt) {
  opt = opt || {};
  var clean = results.map(function () {return []}),
    dirty = results.map(function () {return []}), i, c, N = results[0].length, D = dims.length, is_clean, C = results.length, num_clean=0, num_dirty=0,
    summaries = dims.map(function () {return {missing:0, error:0, valid:0}}), filter_zero = opt.filter_zero || false,
    missing = (opt.missing != undefined) ? opt.missing : dt.MISSING,
    error = (opt.error != undefined) ? opt.error : dt.ERROR;

  for (i = 0; i < N; ++i) {
    is_clean = true;
    for (j = 0; j < D; ++j) {
      if (results[j][i] === missing) {
        is_clean = false;
        summaries[j].missing += results[count_col][i]
      } else if (results[j][i] === error) {
        is_clean = false;
        summaries[j].error += results[count_col][i]
      }
      else{
        summaries[j].valid += results[count_col][i]
      }
    }
    if (is_clean) {
      if(!filter_zero || results[j][i]) {
        for (j = 0; j < C; ++j) {
          clean[j][num_clean] = results[j][i]
        }
        num_clean++;
      }
    }
    else{
      for (j = 0; j < C; ++j) {
        dirty[j][num_dirty] = results[j][i]
      }
      num_dirty++;
    }
  }

  return {clean:clean, dirty:dirty, summaries:summaries}
};

dv.result_order = {
  DESC:1,
  ASC:-1
};

dv.graph = function (N, src, trg) {
  var G = [], _links;
  G.nodes = N;
  G.edges = src.length;
  G.source = src;
  G.target = trg;

  G.init = function () {
    var i, u, v, links = [];
    for (i = 0; i < N; ++i) {
      links.push([]);
    }
    for (i = 0; i < src.length; ++i) {
      u = src[i];
      v = trg[i];
      links[u].push(v);
      links[v].push(u);
    }
    _links = links;
  }

  G.neighbors = function (n) {
    return _links[n];
  }

  G.init();
  return G;
};



dv.graph.indegree = function (g) {
  var i, N=g.nodes, E=g.edges, trg=g.target, deg = dv.array(N);
  for (i = 0; i < E; ++i) deg[trg[i]] += 1;
  return deg;
};

dv.graph.outdegree = function (g) {
  var i, N=g.nodes, E=g.edges, src=g.source, deg = dv.array(N);
  for (i = 0; i < E; ++i) deg[src[i]] += 1;
  return deg;
};

dv.graph.degree = function (g) {
  var i, N=g.nodes, E=g.edges, src=g.source, trg=g.target, deg = dv.array(N);
  for (i = 0; i < E; ++i) {
    deg[src[i]] += 1;
    deg[trg[i]] += 1;
  }
  return deg;
};

/**
 * Calculates betweenness centrality measures for nodes in an unweighted graph.
 * The running time is O(|V|*|E|).
 * The algorithm used is due to Ulrik Brandes, as published in the
 * <a href="http:\\www.inf.uni-konstanz.de/algo/publications/b-fabc-01.pdf">
 * Journal of Mathematical Sociology, 25(2):163-177, 2001</a>.
 */
dv.graph.bc = function (g) {
  var N = g.nodes, links, stack, queue,
    i, j, n, v, w, s, sn, sv, sw, len;


  function score() {
    var s = {};
    s.centrality = 0;
    s.reset = function () {
      s.predecessors = [];
      s.dependency = 0;
      s.distance = -1;
      s.paths = 0;
      return s;
    }
    return s.reset();
  }


  for (n = 0, s=[]; n < N; ++n) {
    s.push(score());
  }


  for (n = 0; n < N; ++n) {
    for (i = 0; i < N; ++i) { s[i].reset(); }
    sn = s[n];
    sn.paths = 1;
    sn.distance = 0;

    stack = [];
    queue = [n];

    while (queue.length > 0) {
      v = queue.shift();
      stack.push(v);
      sv = s[v];

      links = g.neighbors(v);
      for (i = 0, len=links.length; i < len; ++i) {
        w = links[i];
        sw = s[w];
        if (sw.distance < 0) {
          queue.push(w);
          sw.distance = sv.distance + 1;
        }
        if (sw.distance == sv.distance + 1) {
          sw.paths += sv.paths;
          sw.predecessors.push(sv);
        }
      }
    }
    while (stack.length > 0) {
      sw = stack.pop();
      for (i = 0, len=sw.predecessors.length; i < len; ++i) {
        sv = sw.predecessors[i];
        sv.dependency += (sv.paths/sw.paths) * (1+sw.dependency);
      }
      if (sw !== sn) sw.centrality += sw.dependency;
    }
  }
  return s.map(function (sc) { return sc.centrality; });
};



dv.cluster = {};

dv.cluster.merge = function (a, b, p, n) {
  var m = {i:(+a),j:(+b),prev:p,next:n};
  if (p) p.next = m;
  if (n) n.prev = m;
  return m;
};

dv.cluster.community = function (g) {
  var edge = dv.cluster.merge, merges=edge(-1,-1), merge=merges,
    dQ, maxDQ = 0, Q = 0, zsum = 0, scores=[], N = g.nodes, M = g.edges,
    Z, z, w, x, y, v, na, tmp, i, j, k, xy, yx, xk, yk, ky,
    E = edge(-1,-1), e = E, maxEdge = edge(0,0), a = dv.array(N),
    src = g.source, trg = g.target;

  for (i = 0; i < M; ++i) {
    u = src[i], v = trg[i];
    if (u != v) zsum += 2;
  }
  zsum = 1/zsum;


  z = dv.array(N*N);
  for (i = 0; i < M; ++i) {
    u = src[i], v = trg[i];
    if (u == v) continue;
    w = zsum;
    z[u*N+v] += w;
    z[v*N+u] += w;
    a[u] += w;
    a[v] += w;
    e = edge(u, v, e);
  }

  for (i = 0; i < N-1 && E.next; ++i) {
    maxDQ = -Infinity;
    maxEdge.i = 0; maxEdge.j = 0;

    for (e=E.next; e; e=e.next) {
      x = e.i; y = e.j;
      if (x == y) continue;

      xy = x*N+y; yx = y*N+x;
      dQ = z[xy] + z[yx] - 2*a[x]*a[y];

      if (dQ > maxDQ) {
        maxDQ = dQ;
        maxEdge.i = x;
        maxEdge.j = y;
      }
    }


    x = maxEdge.i; y = maxEdge.j;
    if (y < x) { tmp = y; y = x; x = tmp; }

    xy = x*N; yx = y*N;
    for (k = 0, na = 0; k < N; ++k) {
      xk = xy+k; yk = yx+k;
      v = z[xk] + z[yk];
      if (v != 0) {
        na += v;
        z[xk] = v;
        z[yk] = 0;
      }
    }

    for (k = 0; k < N; ++k) {
      kx = k*N+x; ky = k*N+y;
      v = z[kx] + z[ky];
      if (v != 0) {
        z[kx] = v;
        z[ky] = 0;
      }
    }

    a[x] = na;
    a[y] = 0;


    for (e=E.next; e; e=e.next) {
      if ((e.i == x && e.j == y) || (e.i == y && e.j == x)) {
        e.prev.next = e.next;
        if (e.next) e.next.prev = e.prev;
      } else if (e.i == y) {
        e.i = x;
      } else if (e.j == y) {
        e.j = x;
      }
    }

    Q += maxDQ;
    scores.push(Q);
    merge = edge(x, y, merge);
  }
};

































































































dv.cluster.groups = function (mergelist, idx) {
  var merges = mergelist.merges,
    scores = mergelist.scores,
    map = {}, groups, gid=1,
    max, i, j, e, k1, k2, l1, l2;

  if (idx === undefined || idx < 0) {
    for (i = 0,idx=-1,max=-Infinity; i < scores.length; ++i) {
      if (scores[i] > max) { max = scores[idx=i]; }
    }
  }

  for (i = 0, e=merges.next; i <= idx; ++i, e=e.next) {
    k1 = e.i; k2 = e.j;
    if ((l1 = map[k1]) === undefined) {
      l1 = [k1];
      map[k1] = l1;
    }
    if ((l2 = map[k2]) === undefined) {
      l1.push(k2);
    } else {
      for (j = 0; j < l2.length; ++j) l1.push(l2[j]);
      delete map[k2];
    }
  }

  groups = dv.array(merges.length+1);
  for (k1 in map) {
    l1 = map[k1];
    for (i = 0; i < l1.length; ++i) {
      groups[l1[i]] = gid;
    }
    ++gid;
  }

  return groups;
};/* Matrix API
 rows
 cols
 nnz
 sum (?)
 sumsq (?)
 clone
 like(rows, cols)
 init(rows, cols)
 get(i, j)
 set(i, j)
 scale(s)
 multiply(mat)
 visitNonZero(func)
 visit(func)
*/
dv.matrix = {};

dv.matrix.dense = function (rows, cols, vals) {
  var A = {}, _v = [], _c = cols, _r = rows;

  A.values = function () { return _v; }

  A.init = function (rows, cols, vals) {
    A.rows = (_r = rows);
    A.cols = (_c = cols);
    _v = [];
    if (vals) {
      for (var i = 0; i < (rows*cols); ++i) {
        _v.push(vals[i]);
      }
    } else {
      for (var i = 0; i < (rows*cols); ++i) { _v.push(0); }
    }
  }
  A.clone = function () { return dv.matrix.dense(_r, _c, _v); }
  A.like = function (rows, cols) { return dv.matrix.dense(_r, _c); };

  A.get = function (i,j) { return _v[i*_c + j]; }
  A.set = function (i,j,v) { _v[i*_c + j] = v; }

  A.scale = function (s) {
    for (var i = 0; i < _v.length; ++i) { _v[idx] *= s; }
  }
  A.multiply = function (B) {
    if (_c !== B.rows) {
      dv.error("Incompatible matrix dimensions");
      return null;
    }
    var rows = _r, cols = B.cols, i, j, k, v, z;
    z = A.like(rows, cols);
    for (i = 0; i < rows; ++i) {
      for (j = 0, v=0; j < cols; ++j) {
        for (k=0; k<_c; ++k) {
          v += A.get(i,k) * B.get(k,j);
        }
        if (v) z.set(i,j,v);
      }
    }
    return z;
  }

  A.visitNonZero = function (f) {
    var k0, k, i, j;
    for (i = 0; i < _r; ++i) {
      k0 = i*_c;
      for (j = 0; j < _c; ++j) {
        k = k0 + j;
        u = _v[k];
        if (u) {
          v = f(i,j,u);
          _v[k] = v;
        }
      }
    }
  }

  A.visit = function (f) {
    var k0, k, i, j;
    for (i = 0; i < _r; ++i) {
      k0 = i*_c;
      for (j = 0; j < _c; ++j) {
        k = k0 + j;
        u = _v[k];
        v = f(i,j,u);
        _v[k] = v;
      }
    }
  }

  A.init(rows, cols, vals);
  return A;
};

/**
Sparse matrix definition.
*/
dv.matrix.sparse = function (rows, cols, vals) {
  var A = {}, _v = {}, _c = cols, _r = rows;

  A.values = function () { return _v; }

  A.init = function (rows, cols, vals) {
    A.rows = (_r = rows);
    A.cols = (_c = cols);
    _v = [];
    if (vals) {
      for (idx in vals) {
        _v[idx] = vals[idx];
      }
    }
  }
  A.clone = function () { return dv.matrix.sparse(_r, _c, _v); }
  A.like = function (rows, cols) { return dv.matrix.sparse(rows,cols); };

  A.get = function (i,j) {
    var v = _v[i*_c + j];
    return (v === undefined) ? 0 : v;
  }
  A.set = function (i,j,v) {
    var k = i*_c + j;
    if (v == 0) {
      delete _v[k];
    } else {
      _v[k] = v;
    }
  }

  A.scale = function (s) {
    for (var idx in _v) { _v[idx] *= s; }
  }
  A.multiply = function (B) {
    if (_c !== B.rows) {
      dv.error("Incompatible matrix dimensions");
      return null;
    }
    var rows = _r, cols = B.cols, i, j, k, v, z;
    z = A.like(rows, cols);
    for (i = 0; i < rows; ++i) {
      for (j = 0, v=0; j < cols; ++j) {
        for (k=0; k<_c; ++k) {
          v += A.get(i,k) * B.get(k,j);
        }
        if (v) z.set(i,j,v);
      }
    }
    return z;
  }

  A.visitNonZero = function (f) {
    var i, j, k, u, v, idx;
    for (idx in _v) {
      k = (+idx);
      j = k % _c;
      i = (k-j) / _c;
      u = _v[k];
      v = f(i,j,u);
      if (v==0) {
        delete _v[k];
      } else {
        _v[k] = v;
      }
    }
  }

  A.visit = function (f) {
    var k0, k, u, v, i, j;
    for (i = 0; i < _r; ++i) {
      k0 = i*_c;
      for (j = 0; j < _c; ++j) {
        k = k0 + j;
        u = _v[k];
        u = u ? (+u) : 0;
        v = f(i,j,u);
        if (v==0) {
          delete _v[k];
        } else {
          _v[k] = v;
        }
      }
    }
  }

  A.init(rows, cols, vals);
  return A;
};

dv.view = function (table, options)
{
  var view = [],
      table = table, idx = options.indices, i, dims = options.dims;

  table.map(function(c, i) {
    column_view = idx.map(function(index) {
      return c[index];
    })
    view[i] =  column_view;
    view[c.name] = column_view;
  })

  view.index = function() {
    if(!arguments.length) return idx;
  }

  view.dims = function() {
    if(!arguments.length) return dims;
  }

  view.materialize = function() {
    var mat = dv.table();
    var cols = table.map(function(c, i) {
      var col = [];
      idx.map(function(index) {
        col.push(c.get_raw(index))
      })
      mat.addColumn(c.name(), col, c.type)
    })
    return mat;
  }

  view.query = function(q) {

    var query_table = q.table || table;
    q.filter_index = idx;
    return table.query(q);
  }
  return view;
};

dv.partition = function (table, dims)
{
  var partition = {},
      partition_query = {dims:dims||[], vals:[dv.list("*")]},
      query_result = table.query(partition_query),
      views = [];


  query_result[dims.length].map(function(d, i) {

    views.push(dv.view(table, {indices:d,
      dims:query_result.slice(0, dims.length).map(function(x) {
        return x[i];
      })}));
  })

  partition.views = function() {
    return views;
  }

  partition.query = function(q) {
    var query_table = q.table || table, view_result,
        dims_length = dims.length,
        query_cols = dims_length + (q.bins ? q.bins.length : 0) + (q.vals ? q.vals.length : 0),
        query_rows = query_table.rows(),
        view_row, col, idx, original_row, view_dims,
        query_result = dv.array_with_init(query_cols, undefined);

    query_result.map(function(c, i) {
      query_result[i] = dv.array_with_init(query_rows, undefined);
    })

    views.forEach(function(view) {
        view_result = view.query(q);
        view_dims = view.dims();
        idx = view.index();
        for (view_row = 0; view_row < idx.length; ++view_row) {
          original_row = idx[view_row];
          for (col = 0; col < dims_length; ++col) {
            query_result[col][original_row] = view_dims[col];
          }
          for (col = 0; col < view_result.length; ++col) {
            query_result[dims_length+col][original_row] = view_result[col][0];
          }
        }
      })
      return query_result;
    }

    return partition;
};
csvToArray = function (strData, strDelimiter) {

  strDelimiter = (strDelimiter || ",");


  var objPattern = new RegExp(
    ("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ), "gi");


  var arrData = [[]];


  var arrMatches = null;



  while (arrMatches = objPattern.exec( strData )){
    var strMatchedDelimiter = arrMatches[ 1 ];
    if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)){
      arrData.push( [] );
    }
    if (arrMatches[ 2 ]){
      var strMatchedValue = arrMatches[ 2 ].replace(
        new RegExp( "\"\"", "g" ),
        "\""
        );
    } else {
      var strMatchedValue = arrMatches[ 3 ];
    }

    arrData[ arrData.length - 1 ].push( strMatchedValue );
  }


  return( arrData );
};


isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};



parseField = function (inarray, i, numRows) {
  var type = "";
  var numNumeric = 0;
  for (var j = 1; j < numRows; j++) {
	if (isNumber(inarray[j][i])) {
	  numNumeric++;
	}
  }

  if (numNumeric / numRows > 0.7) {
	type = "numeric";
  }
  else {
	type = "nominal";
  }
  return type;
};



arrayToProfilerJSON = function (inarray) {
  var numFields = inarray[0].length;
  var numRows = inarray.length;



  var jsonData = new Array();
  for (var i = 0; i < numFields; i++) {
    jsonData.push(new Object());
    var fieldName = inarray[0][i];
    jsonData[i].name = fieldName;
    jsonData[i].values = new Array();
    for (var j = 1; j < numRows; j++) {
      jsonData[i].values.push(inarray[j][i]);
    }
    jsonData[i].type = parseField(inarray, i, numRows);
  }
  return jsonData;
};})();