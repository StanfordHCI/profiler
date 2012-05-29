dp.tick.quarter = function() {
  var months = ['Q1', 'Q2','Q3','Q4'];
  return function(d, i) {
    return months[i];
  }
}();