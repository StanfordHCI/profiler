dt.is_missing = function(v) {
  return v === undefined || (''+v).replace(/[ \t\n]/g, '').length === 0;
};
