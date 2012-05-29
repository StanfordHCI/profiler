

dt.type.date.day = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_day_formats;

  datatype.formats(formats);
  datatype.name('day')
  return datatype;

};

dt.type.date.default_day_formats = ['%d', '%e'];