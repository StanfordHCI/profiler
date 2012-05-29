dp.editor.formula = function(container, opt)
{
  opt = opt || {};
  var group = this,
      editor = {},
      data = opt.data,
      onupdate = opt.onupdate,
      w = opt.width || 400,
      h = (opt.height || 194),
      script_container, script_input, script_submit, transform_type_select,
      transform_types = opt.transform_types || dw.transform.types, script_text, current_transform;

  function choose_example() {






  };

  editor.request = function() {
    var script_text = script_input.attr('value', script_text),
        transform, update_dashboard = false;
    switch (transform_type_select.val()) {
      case 'filter':
           transform = dw.derive.derived_predicate(dw.parser.parse(script_text));
           update_dashboard = true;
           break
      case 'derive':
      default:
        transform = dw.derive().formula(script_text).insert_position(dw.INSERT_END);
        break;
    }
    return {derived_transform: transform, update_dashboard: true}
  }

  function submit_transform() {
    if(onupdate) {
      onupdate(editor.request())
    }
  }

  editor.initUI = function() {
    script_input = dv.jq('textArea').attr('id', 'playground_script_input');
    script_submit = dv.jq('button').attr('id','script_submit').append('execute');
    script_container = dv.jq('div').attr('id', 'playground_script_container');
    transform_type_select = dv.jq('select').attr('id', 'upload_example_select');
    script_container.append(transform_type_select).append(script_submit).append(script_input);


    script_submit.click(function() {
      submit_transform();
    })

    add_option = function(type, name) {
  		dv.add_select_option(transform_type_select, name, type);
  	}

  	transform_type_select.change(function() {
  		choose_example();
  	})

    add_option(undefined, 'Transform:');
    transform_types.forEach(function(ex) {
      add_option(ex, ex);
    })

    container.append(script_container);
  };

  editor.formula = function(x) {
    if (!arguments.length) return script_text;
    script_text = x;
    editor.update();
    return editor;
  }

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

  editor.type = function() { return 'editor'; };

  editor.initUI();
  editor.update();
  return editor;
};
