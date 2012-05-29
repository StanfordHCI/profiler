playground = {};

playground.parse_transform = function(text) {
  // TODO: better syntax checking?
  var transform = eval(text);
  return transform;
};
