dt.type.date.month = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_month_formats;

  datatype.formats(formats);
  datatype.name('month')
  return datatype;

};

dt.type.date.default_month_formats = ['%m', '%b', '%B'];