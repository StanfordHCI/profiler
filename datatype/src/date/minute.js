
dt.type.date.minute = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_minute_formats;

  datatype.formats(formats);
  datatype.name('minute')
  return datatype;

};

dt.type.date.default_minute_formats = ['%M'];