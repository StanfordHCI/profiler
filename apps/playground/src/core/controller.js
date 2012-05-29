playground.controller = function (opt) {

  opt = opt || {};
  var controller = [],
      data = opt.data, wrangler = opt.wrangler || dw.wrangle(), editor,
      table_container = dv.jq('div').attr('id', 'playground_table_container'),
      profiler_container_id = 'profiler_container',
      profiler_container = dv.jq('div').attr('id', profiler_container_id),
      after_table_container = dv.jq('div').attr('id', 'playground_after_table_container'),
      suggestion_container = opt.suggestion_container,
      ontransform, transformed_data, wrangler_controller = dw.controller({data:data}),
      profiler_controller = dp.controller({data:data}),
      wrangler_view, profiler_view, db, schema,
      onupload = opt.onupload, parent = opt.parent || '#app_container';

  db = dp.profile(data, profiler_container, {
    on_data_update:function(params) {
      schema.data(params.data);
      schema.update();
    }
  });

  function execute_transform(transform) {
    wrangler_controller.execute_transform(transform)
    // wrangler.push(transform);
    // update_transformed_data();
    controller.initUI();
  };

  function edit_formula() {

  };

  function select_transform_type() {

  };

  function select_profiler_suggestion(suggestion) {
    wrangler_view.initUI();
  }

  function select_suggestion(suggestion) {
    editor.select({transform:suggestion})
  }

  var update_transformed_data = function() {
    transformed_data = data.slice();
    wrangler.apply([transformed_data]);
    db.set_data(transformed_data);
  }

  controller.data = function(x) {
    if(!arguments.length) return data;
    data = x;
    return controller;
  }

  controller.wrangler = function(x) {
    if (!arguments.length) return wrangler;
    wrangler = x;
    return controller;
  }

  controller.update = function(x) {
    // TODO: Add timeout similar to profiler.
    for (var i = 0; i < controller.length; ++i) {
       controller[i].select(x);
     }
  }

  add = function(app) { controller.push(app); return app; },

  controller.install = function(app) {
    return add(app);
  }

  controller.initUI = function() {
    var container, script_container, script_input,
        transform_type_select,
        profiler, datatable, table;

    script_container = dv.jq('div');

    db.set_data(wrangler_controller.table());
    jQuery(parent).empty().append(script_container).append(profiler_container).append(table_container).append(after_table_container);
    wrangler_view.initUI();
    editor = playground.editor(script_container, {
        onexecute:execute_transform,
        onedit:edit_formula,
        ontransformselect:select_transform_type
    })
    schema = dp.schema('schema_container', db, {on_add:function(){return;wrangler_view.initUI()}});//controller.initUI});
    controller.install(editor);

    var profiler_data_state = profiler_controller.interaction({});
    profiler_view.update(profiler_data_state)
    var graphName = 'graphtest'
    // var vis = db.default_plot([2], [], {numBins: 20, graphName: graphName});
    // var vis = db.default_plot([2], [3], {numBins: 20, graphName: graphName});
  }

  function wrangler_interaction(params) {
    var wrangler_data_state = wrangler_controller.interaction(params);
    wrangler_view.update(wrangler_data_state, params)
  }

  update_transformed_data();

  profiler_view = dp.view({
    suggestion_container: suggestion_container,
    db: db,
    onsuggest: select_profiler_suggestion
  });

  wrangler_view = dw.view({
    table_container:table_container,
    after_table_container:after_table_container,
    suggestion_container: dv.jq('div'),//suggestion_container,
    table_interaction:wrangler_interaction,
    db: db,
    onsuggest: select_suggestion
  }),


  controller.initUI();

  return controller;

};
