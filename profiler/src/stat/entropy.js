
dp.stat.entropy = function(table, field, bins) {
  var dims = [dp_stats_dim(table, field, bins)],
    vals = [dv.count('*')],
    data = table.query({dims: dims, vals: vals});

  return dp_stats_entropy(data[1]);
};

dp.stat.perplexity = function(table, field, bins) {
  return Math.pow(2, dp.stat.entropy(table, field, bins));
};

dp.stat.mutual = function(table, field1, field2, bins) {
  var dims = [dp_stats_dim(table, field1, bins),
        dp_stats_dim(table, field2, bins)],
    vals = [dv.count('*')],
    data = table.query({dims: dims, vals: vals, code: false});
  return dp_stats_mutual(data, false);
};

dp.stat.mutual_binned = function(table, x, y) {
  var vals = [dv.count('*')],
      data = table.query({dims:[x, y], vals: vals, code:false});
  return dp_stats_mutual(data, false)
}

dp.stat.normalized_mutual_binned = function(table, x, y) {
  if(!table) {
      table = dv.table();
      table.addColumn("dummy", y.slice(), "nominal", {encoded:true, lut:y[0].lut})
  }
  var vals = [dv.count('*')],
      data = table.query({dims:[x, y], vals: vals, code:false});

   return dp_stats_normalized_mutual(data, true)
}

dp.stat.mutualdist = function(table, field1, field2, bins) {
  var dims = [dp_stats_dim(table, field1, bins),
        dp_stats_dim(table, field2, bins)],
    vals = [dv.count('*')],
    data = table.query({dims: dims, vals: vals, code: false});
  return dp_stats_mutual(data, true);
};

function dp_stats_dim(table, field, bins) {
  if (table[field].type === dp.type.numeric) {
    bins = bins || 20;
    bins = dv_bins(table[field], bins);
    return dv.bin(field, bins[2], bins[0], bins[1]);
  } else {
    return field;
  }
}

function dp_stats_entropy(x) {
  var i, p, s = 0, H = 0;
  for (i = 0; i < x.length; ++i) {
    s += x[i];
  }
  if (s == 0) return 0;
  for (i = 0; i < x.length; ++i) {
    p = x[i] / s;
    if (p > 0) H += p * Math.log(p) / Math.LN2;
  }
  return -H;
};

dp.stat.normalized_entropy = function(x) {
  var i, p, s = 0, H = 0;
  if (x.length <= 1) return 1;
  for (i = 0; i < x.length; ++i) {
    s += x[i];
  }
  if (s == 0) return 0;
  for (i = 0; i < x.length; ++i) {
    p = x[i] / s;
    if (p > 0) H += p * Math.log(p);
  }
  return -H / Math.log(x.length);
};

function dp_stats_mutual(data, dist) {
  var dist = dist || false,
    x = data[0], y = data[1], z = data[2],
    px = dv.array(x.unique),
    py = dv.array(y.unique),
    i, s = 0, t, N = z.length, p, I = 0;
  for (i = 0; i < N; ++i) {
    px[x[i]] += z[i];
    py[y[i]] += z[i];
    s += z[i];
  }
  t = 1 / (s * Math.LN2);
  for (i = 0; i < N; ++i) {
    if (z[i] == 0) continue;
    p = (s * z[i]) / (px[x[i]] * py[y[i]]);
    I += z[i] * t * Math.log(p);
  }
  if (dist) {
    px = dp_stats_entropy(px);
    py = dp_stats_entropy(py);
    return 1.0 - I / (px > py ? px : py);
  } else {
    return I;
  }
};
dp.stat.test_stats_normalized_mutual = function(data, dist) {
  var dist = dist || false,
    x = data[0], y = data[1], z = data[2],
    px = dv.array(x.unique),
    py = dv.array(y.unique),
    i, s = 0, t, N = z.length, p, I = 0;
  for (i = 0; i < N; ++i) {
    px[x[i]] += z[i];
    py[y[i]] += z[i];
    s += z[i];
  }
  t = 1 / (s * Math.LN2);
  for (i = 0; i < N; ++i) {
    if (z[i] == 0) continue;
    p = (s * z[i]) / (px[x[i]] * py[y[i]]);
    I += z[i] * t * Math.log(p);
  }
  if (dist) {
    px = dp_stats_entropy(px);
    py = dp_stats_entropy(py);
    return 1.0 - I / (px > py ? px : py);
  } else {
    return I;
  }
};

function dp_stats_normalized_mutual(data, dist) {
  var dist = dist || false,
    x = data[0], y = data[1], z = data[2],
    px = dv.array(x.unique),
    py = dv.array(y.unique),
    i, s = 0, t, N = z.length, p, I = 0;
  for (i = 0; i < N; ++i) {
    px[x[i]] += z[i];
    py[y[i]] += z[i];
    s += z[i];
  }
  t = 1 / (s * Math.LN2);
  for (i = 0; i < N; ++i) {
    if (z[i] == 0) continue;
    p = (s * z[i]) / (px[x[i]] * py[y[i]]);
    I += z[i] * t * Math.log(p);
  }
  if (dist) {
    px = dp_stats_entropy(px);
    py = dp_stats_entropy(py);
    return 1.0 - (I / (px > py ? px : py));
  } else {
    px = dp_stats_entropy(px);
    py = dp_stats_entropy(py);
    return I / Math.sqrt(px * py);
  }
};
