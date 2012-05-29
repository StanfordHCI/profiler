


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

