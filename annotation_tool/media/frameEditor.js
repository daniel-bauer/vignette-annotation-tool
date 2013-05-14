$(document).ready(function() {
    $('h1').html('Editing frame: "' + frameName + '"');
    
    $(window).unload(function() {
        opener.onPopupClose();
    });

    csrfProtect();
    addButtons();
    addFrameDetails();
});

function errorFunc(jqXHR, textStatus, errorThrown) {
    if(jqXHR.status = 400) {
        alert(jqXHR.responseText);
    }
    else {
        alert(jqXHR.status + ': ' + jqXHR.content + '. ' + textStatus + ', ' + errorThrown);
    }
}


function addButtons() {
    if(isISAparent == 'True') {
        var warning = '<p>Cannot add/delete frame elements from parent of another frame</p>';
        $('#newb').append(warning);
    }
    else if(isSUBchild == 'True') {
        var warning = '<p>Cannot add/delete frame elements from subframe of another frame</p>';
        $('#newb').append(warning);
    }
    else {
        var button = '<li><button id="ndel" type="button" onClick="feDel();">Delete</button></li>';
        $('#newb').append(button);

        button = '<li><button id="nadd" type="button" onClick="feAdd();">Add</button></li>';
        $('#newb').append(button);
    }
}

function addFrameDetails() {
    $.each(inheritedElements, function(index, fe) {
        var option = createOption(fe.fields.fe_name, 'inherited', index == 0);
        $('#inherited').append(option);
    });

    $.each(newElements, function(index, fe) {
        var option = createOption(fe.fields.fe_name, 'new', index == 0);
        $('#new').append(option);
    });

    for(var i = 0; i < subframes.length; i++) {
        var subframe = createSubframe(subframes[i].fields.name, subelements[i], i == 0);
        $('#subframes').append(subframe);
    }
}

function createOption(fe_name, op_name, checked) {
    var option = '<li><input type="radio" name="' + op_name + '"';
    if(checked) {
        option = option + ' checked';
    }
    option = option + ' value="' + fe_name + '"><span class="rcontent">';
    option = option + fe_name + '</span></input></li>';

    return option;
}

function createSubframe(name, relations, checked) {
    var subframe = '<li class="suboption"><input type="radio" name="subframe" value="' + name + '"';
    if(checked) {
        subframe = subframe + ' checked';
    }
    subframe = subframe + '/> ' + name;
    var sfrels = '<ul class="sfrels">';

    $.each(relations, function(index, relation) {
        var pname = relation.fields.parent_fe_name;
        var cname = relation.fields.child_fe_name;

        var li = '<li>' + cname + ': <select name="' + cname + '">';
        li = li + generateOptions(pname) + '</select></li>';
        sfrels = sfrels + li;
    });
    sfrels = sfrels + '</ul>';

    subframe = subframe + sfrels + '</li>';

    return subframe;
}

function generateOptions(selected) {
   var frameElements = newElements.concat(inheritedElements);
   var options = '';

   $.each(frameElements, function(index, frameElement) {
       var name = frameElement.fields.fe_name;
       var option = '<option value="' + name + '"';
       if(name == selected) {
           option = option + ' selected="selected"';
       }
       option = option + '>' + name + '</option>';
       options = options + option;
   });

   return options;
}

function rename(op_name) {
    var fe_item = $('.sublist input[name=' + op_name + ']:checked');

    $('button[id$=' + op_name + ']').hide()
    var fe_name = fe_item.attr('value');

    var textbox = '<p>Rename "' + fe_name + '": <input type="text" name="r' + op_name + '"';
    textbox = textbox + ' value="' + fe_name + '"></input></p>';

    var button = '<button id="s' + op_name + '" type="button" onClick="saveRN(';
    button = button + "'" + fe_name + "', '" + op_name + '\');">Save</button"';

    var toAppend = '<div id="rename_' + op_name + '">' + textbox + button + '</div>';

    fe_item.parents().eq(2).append(toAppend);
}

function saveRN(fe_name, op_name) {
    var new_name = $('input[name=r' + op_name + ']').attr('value');
    jQuery.ajax({url: '/rename_frameelement/', type: 'POST', dataType: 'text',
        data: {
            old_name: fe_name,
            new_name: new_name,
            frame_name: frameName
        },
        success: function(data) {
            location.reload();
        },
        error: errorFunc
    });
}

function feDel() {
    var fe_item = $('.sublist input[name=new]:checked');
    var fe_name = fe_item.attr('value');
    
    jQuery.ajax({url: '/delete_frameelement/', type: 'POST', dataType: 'text',
        data: {
            fe_name: fe_name,
            frame_name: frameName
        },
        success: function(data) {
            location.reload();
        },
        error: errorFunc
    });
}

function feAdd() {
    $('#nadd').hide();

    var textbox = '<p>Name:  <input type="text" name="addnew"/></p>';
    var button = '<button id="saveaddbutton" type="button" onClick="saveAdd();">Save</button>';

    var toAppend = '<div id="save_add">' + textbox + button + '</div>';

    $('#newlist').append(toAppend);
}

function saveAdd() {
    var name = $('#newlist input[name="addnew"]').attr('value');
    jQuery.ajax({url: '/add_frameelement/', type: 'POST', dataType: 'text',
        data: {
            fe_name: name,
            frame_name: frameName
        },
        success: function(data) {
            location.reload();
        },
        error: errorFunc
    });
}

function subframeDel() {
    var sf_item = $('#subframes input[name=subframe]:checked');
    var sf_name = sf_item.attr('value');

    jQuery.ajax({url: '/delete_subframe/', type: 'POST', dataType: 'text',
        data: {
            sf_name: sf_name,
            frame_name: frameName
        },
        success: function(data) {
            location.reload();
        },
        error: errorFunc
    });
}

function subframeAdd() {
    $('#sadd').hide();

    var textbox = '<p>Name: <input type="text" name="addsf"/></p>';
    var button = '<button id="addsfsave" type="button" onClick="saveSF();">Save</button>';

    var toAppend = '<div id="sf_add">' + textbox + button + '</div>';
    $('#sfbuttons').append(toAppend);
}

function saveSF() {
    var name = $('#sfbuttons input[name="addsf"]').attr('value');
    jQuery.ajax({url: '/add_subframe/', type: 'POST', dataType: 'text',
        data: {
            sf_name: name,
            frame_name: frameName
        },
        success: function(data) {
            location.reload();
        },
        error: errorFunc
    });
}

function saveSFRel() {
    var checked = '#subframes input[name=subframe]:checked';
    var name = $(checked).attr('value');
    var parent_fes = new Array();
    var child_fes = new Array();

    var list = $(checked).parent().find(' .sfrels li');
    list.each(function(index) {
        var pname = $(this).find('select').attr('value');
        var cname = $(this).find('select').attr('name');

        parent_fes.push(pname);
        child_fes.push(cname);
    });

    jQuery.ajax({url: '/update_sfel_relations/', type: 'POST', dataType: 'text',
        data: {
            sf_name: name,
            frame_name: frameName,
            parent_fes: JSON.stringify(parent_fes),
            child_fes: JSON.stringify(child_fes)
        },
        success: function(data) {
            location.reload();
        },
        error: errorFunc
    });
}
