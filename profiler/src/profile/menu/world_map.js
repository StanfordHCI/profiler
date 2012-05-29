dp.menu.world_map = function(container, fields, opt) {
  var world_map = dp.menu.menu(container, fields, [], opt);

  world_map.initUI();
  world_map.update();

  return world_map;
};
