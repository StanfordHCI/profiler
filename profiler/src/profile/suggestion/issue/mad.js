dp.median = function(data) {
  data.sort(function(a, b) {
    if (a < b) return -1;
    if (b < a) return 1;
    return 0;
  })
  var length = data.length;
  if (length % 2) {
    return data[(length - 1) / 2]
  }
  return (data[length / 2] + data[(length / 2) - 1] / 2)
}
dp.residuals = function(data, x) {
  return data.map(function(d) {
    var v = d - x;
    return v < 0 ? -v : v;
  })
}

dp.hampel = function(data) {
  var missing = dt.MISSING, error = dt.ERROR;
  var filtered_data = data.filter(function(c) {
    return c != missing && c != error;
  })

  var median = dp.median(filtered_data);
  var median_residuals = dp.residuals(filtered_data, median);
  var mad = dp.median(median_residuals);


  var std = 2;
  var cutoff = 1.4826 * std * mad;
  return [median - cutoff, median + cutoff];
}



dp.suggestion.hampel = function(data, opt) {
  var counts, numeric_columns,
      min, max, small, big, other, zscore,
      extreme_entropy, bin;


  numeric_columns = data.filter(function(col) {
    var type = col.type.name();
    return type === 'number' || type === 'int';
  })

  counts = numeric_columns.map(function(col) {
    other = small = big = 0;
    zscore = dp.hampel(data[col.name()])
    min = zscore[0];
    max = zscore[1];
    bin = [];
    col.map(function(v) {
      if (v === dt.MISSING || v === dt.ERROR) {
        other++;
      }
      else if (v > max) {
        big++;
      } else if (v < min) {
        small++;
      } else {
        other++;
      }
    })
    bin.lut = ['non-extreme', 'small', 'big'];
    return {col:col.name(), bin:bin, big:big, small:small, other:other, min:min, max:max}
  })

  extreme_entropy = counts.map(function(count) {
    bin = function() {

      var minv = count.min, maxv = count.max;
      var b = data[count.col].map(function(v) {
        if (v === dt.MISSING || v === dt.ERROR) {
          return 1;
        }
        else if (v > maxv) {
          return 2;
        } else if (v < minv) {
          return 1;
        } else {
          return 0
        }
      })
      b.lut = ['non-extreme', 'small', 'big'];
      return b;
    }
    text = function() {
      return count.col;
    }
    routines = ['Hampel', 'z-score']
    return {group:"Extreme", routines:routines, col:count.col, bin:bin, text:text, entropy: dp_stats_entropy([count.other, count.big, count.small])}
  })

  return extreme_entropy.filter(function(v) {
    return v.entropy != 0;
  }).sort(function(a, b) {
    if (a.entropy < b.entropy) {
      return 1;
    }
    return 1;
  })

};
