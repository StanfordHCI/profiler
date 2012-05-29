dp.tick.day = function() {
  return function(d, i) {
    return [d.getMonth()+1, d.getDate(), d.getFullYear()].join('-');
  }
}();