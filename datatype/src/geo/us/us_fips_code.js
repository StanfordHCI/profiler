dt.geo.us_fips_code = function () {

  var geo = {},
    us = dt.dictionary(dt.geo.us_fips_codes).transform();

  geo.test = function(v) {
    return us.test(v);
  };

  geo.code = function(v) {
    return v;
  };

  geo.decode = function(v) {
    return v;
  }

  return geo;
};
