dp.suggestion.error = function(data, opt) {
  var counts,
      valid, error, missing,
      error_entropy, bin;

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

  error_entropy = counts.map(function(count) {
    bin = function() {
      var b = data[count.col].map(function(v) {
        if (v === dt.ERROR) {
          return 1;
        } else {
          return 0;
        }
      })
      b.lut = ['non-error', 'error']
      return b;
    }
    text = function() {
      return count.col;
    }
    return {group:'Error', col:count.col, bin:bin, text:text, entropy: dp_stats_entropy([count.valid + count.missing, count.error])}
  })

  return error_entropy.filter(function(v) {
    return v.entropy != 0;
  }).sort(function(a, b) {
    if (a.entropy < b.entropy) {
      return -1;
    }
    return 1;
  })

};
