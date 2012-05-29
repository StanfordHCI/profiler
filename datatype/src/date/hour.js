

dt.type.date.hour = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_hour_formats;

  datatype.formats(formats);
  datatype.name('hour')
  return datatype;

};

dt.type.date.default_hour_formats = ['%I', '%I %p', '%H'];