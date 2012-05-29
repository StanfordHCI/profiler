dp.tick.hour = function() {
  return function(d, i) {
    var hrs = d.getHours();
    var ampm = "AM";
    if(hrs > 12) {
      ampm = "PM";
      hrs -= 12;
    }
    else if(hrs == 0) {
      hrs = 12;
    }
    else if(hrs == 12) {
      ampm = "PM";
    }
    return hrs + ":00 " + ampm;
  }
}();