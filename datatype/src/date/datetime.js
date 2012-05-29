
dt.type.date.time = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_time_formats;

  datatype.formats(formats);
  datatype.name('year')
  return datatype;

};

dt.type.date.default_time_formats = ['%X', '%H:%M'];