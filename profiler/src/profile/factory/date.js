
dp.factory.date = function() {
  var factory = {};


  factory.default_type = function(data, opt) {
    opt = opt || {};
    var min = opt.min,
        max = opt.max, minmax;

    if (min == undefined) {
      minmax = dt.minmax(data);
      min = minmax[0];
    }
    if (max == undefined) {
      minmax = minmax || dt.minmax(data);
      max = minmax[1];
    }

    if (max - min < 86400000) {
      return 'hour';
    }
    if (false) {

      return 'month';
    } else {
      return 'year'
    }
  }




  factory.query = function(type) {
    return dp.query[type];
  }

  factory.ticks = function(type, options) {
    return dp.tick[type];
  }

  return factory;
};
