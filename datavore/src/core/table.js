


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