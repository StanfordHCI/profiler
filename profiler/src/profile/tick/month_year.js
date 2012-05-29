dp.tick.month_year = function() {
  return function(d, i) {
    return [d.getMonth()+1, d.getFullYear()].join('/');
  }
}();