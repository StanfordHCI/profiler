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
