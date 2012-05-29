dp.suggestion.primary = function(data, opt) {
  var counts = [{col:'Title'}], extreme_entropy;

  extreme_entropy = counts.map(function(count) {
    bin = function() {
      return undefined;
    }
    text = function() {
      return count.col;
    }
    return {group:'Schema', col:count.col, bin:data[count.col], text:text, vis_type:'grouped_bar'}
  })
  return extreme_entropy;
};
