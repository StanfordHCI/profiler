dt.day = function(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

dt.year = function(date) {
  return new Date(date.getFullYear(), 0, 1);
};

dt.year_difference = function(x, y) {
  return x.getFullYear() - y.getFullYear();
}

dt.day_difference = function(x, y) {
  return (x - y) / 86400000
}

dt.day_add = function(x, days) {
  return x - days * -86400000
}

dt.hour = function(date) {
  return new Date(2000, 0, 1, date.getHours(), 0, 0);
};

dt.hour_difference = function(x, y) {
  return (x - y) / 3600000
}

dt.hour_add = function(x, hours) {
  return x - hours * -3600000
}

dt.month_year = function(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

dt.month_year_difference = function(x, y) {
  var year_diff = x.getFullYear() - y.getFullYear(),
      month_diff = x.getMonth() - y.getMonth();

  if (year_diff >= 0) {
    if (month_diff >= 0) {
      return 12 * year_diff + month_diff;
    }
    return 12 * year_diff - month_diff;
  }

  if (month_diff <= 0) {
    return 12 * year_diff + month_diff;
  }
  return 12 * year_diff - month_diff;

};

dt.month_year_add = function(x, monthyears) {
  return new Date(x.getFullYear() + Math.floor(monthyears / 12), x.getMonth() + monthyears % 12, 1) - 0
};