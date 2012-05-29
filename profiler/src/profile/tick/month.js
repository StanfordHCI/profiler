dp.tick.month = function() {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mar', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return function(d, i) {
    return months[i];
  }
}();