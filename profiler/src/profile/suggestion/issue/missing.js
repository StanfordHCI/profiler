dp.suggestion.missing = function(data, opt) {
  var counts,
      valid, error, missing,
      missing_entropy, bin;

  counts = data.map(function(col) {
    valid = error = missing = 0;
    col.map(function(v) {
      if (v === dt.MISSING) {
        missing++;
      } else if (v === dt.ERROR) {
        error++;
      } else {
        valid++;
      }
    })
    return {col:col.name(), missing:missing, error:error, valid:valid}
  })

  missing_entropy = counts.map(function(count) {
    bin = function() {
      var b = data[count.col].map(function(v) {
        if (v === dt.MISSING) {
          return 1;
        } else {
          return 0;
        }
      })
      b.lut = ['non-missing', 'missing']
      return b;
    }
    text = function() {
      return count.col;
    }
    return {group:'Missing', col:count.col, bin:bin, text:text, entropy: dp_stats_entropy([count.valid + count.error, count.missing])}
  })

  return missing_entropy.filter(function(v) {
    return v.entropy != 0;
  }).sort(function(a, b) {
    if (a.col === 'Release Location') {
      return 1;
    }
    if (b.col === 'Release Location') {
      return -1
    }
    if (a.entropy > b.entropy) {
      return -1;
    }
    return 1;
  })

};
