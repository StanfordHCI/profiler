upload = {};

upload.upload_text = function(text, opt) {
  opt = opt || {};
  var parser = dw.io.inference(text);
  return parser.parse(text);
}
