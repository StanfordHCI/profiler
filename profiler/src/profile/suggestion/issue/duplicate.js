dp.suggestion.duplicate = function(data, opt) {
  var counts, duplicate_columns,
      min, max, small, big, other, zscore,
      extreme_entropy, bin;


  duplicate_columns = data.filter(function(col) {
    var type = col.type.type();
    return type === 'nominal';
  })

  counts = duplicate_columns.map(function(col) {
    return {col:col.name()}
  })

  extreme_entropy = counts.map(function(count) {
    bin = function() {
      return undefined;
    }
    text = function() {
      return count.col;
    }
    return {group:'Inconsistent', routines:['Levenshtein'], data:data, col:count.col, bin:function(){return data[count.col]}, text:text, vis_type:'grouped_bar'}
  })
  return extreme_entropy;
};
