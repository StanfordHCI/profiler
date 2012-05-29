(function(){playground = {};

playground.parse_transform = function(text) {
  // TODO: better syntax checking?
  var transform = eval(text);
  return transform;
};
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
playground.editor = function(container, opt)
{
  opt = opt || {};
  var group = this,
      editor = {},
      data = opt.data,
      onexecute = opt.onexecute,
      onedit = opt.onedit,
      ontransformselect = opt.ontransformselect,
      w = opt.width || 400,
      h = (opt.height || 194),
      script_container, script_input, script_submit, transform_type_select,
      transform_types = opt.transform_types || dw.transform.types, script_text, current_transform;

  var choose_example = function() {
    if(transform_type_select.val()) {
      editor.select({transform: dw[transform_type_select.val()]()})
    }
    else {
      editor.select({transform: undefined})
    }
  };

  var submit_transform = function() {
    onexecute(eval(script_input.attr('value', script_text)));
  }

  editor.initUI = function() {
    script_input = dv.jq('textArea').attr('id', 'playground_script_input');
    script_submit = dv.jq('button').attr('id','script_submit').append('execute');
    script_container = dv.jq('div').attr('id', 'playground_script_container');
    transform_type_select = dv.jq('select').attr('id', 'transform_type_select');
    script_container.append(transform_type_select).append(script_input);


    script_submit.click(function() {
      submit_transform();
    })

    var add_export_option = function(type, name){
  		dv.add_select_option(transform_type_select, name, type);
  	}

  	transform_type_select.change(function() {
  		choose_example();
  	})

    add_export_option(undefined, 'Transform:');
    transform_types.forEach(function(ex) {
      add_export_option(ex, ex);
    })

    container.append(script_container);
  };


  editor.update = function() {
    if(script_text) {
      script_input.attr('value', script_text)
    } else if (current_transform) {
      script_input.attr('value', current_transform.as_javascript())
    }
  };

  editor.select = function(e) {
    if (e) {
      script_text = e.script_text;
      current_transform = e.transform;
    } else {
      script_text = undefined;
      current_transform = undefined;
    }
    editor.update();
  };

  editor.options = function() {
    if (arguments.length == 0) return {};
    opt = arguments[0];
    bins = opt.bins || bins;
    w = opt.width || w;
    h = opt.height || h;
    editor.update();
    return editor;
  };


  jQuery(document).unbind('keydown.editor');
  jQuery(document).bind('keydown.editor', function(event) {
    var type = event && event.srcElement && event.srcElement.type
  	if(type!='text'){
  	  switch(event.which){
        case 13:
          submit_transform();
      }
    }
  })

  editor.type = function() { return 'editor'; };

  editor.initUI();
  editor.update();
  return editor;
};
})();