dp.suggestion.extreme = function(data, opt) {
  var counts, numeric_columns,
      min, max, small, big, other, zscore,
      extreme_entropy, bin;


  numeric_columns = data.filter(function(col) {
    var type = col.type.name();
    return type === 'number' || type === 'int';
  })

  counts = numeric_columns.map(function(col) {
    other = small = big = 0;
    zscore = dp.outlier.zscore({table:data, field:col.name(), deviations:1.8})
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
          return 0;
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
    return {group:"Extreme", col:count.col, bin:bin, text:text, entropy: dp_stats_entropy([count.other, count.big, count.small])}
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
