dt.capitalize = function(v) {
  return v!=undefined ? (v = ''+v, v.length ? v[0].toUpperCase() + v.slice(1) : v) : v;
};
