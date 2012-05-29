

dt.type.date.second = function(formats) {

  var datatype = dt.type.date(formats),
      formats = formats || dt.type.date.default_second_formats;

  datatype.formats(formats);
  datatype.name('second')
  return datatype;

};

dt.type.date.default_second_formats = ['%S'];