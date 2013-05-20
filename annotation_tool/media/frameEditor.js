$(document).ready(function() {
    $('h1').html('Editing frame: "' + frameName + '"');
    
    $(window).unload(function() {
        opener.onPopupClose();
    });

    csrfProtect();  // for post requests
    addButtons();
    addFrameDetails();
});

// Error function used in all ajax requests
function errorFunc(jqXHR, textStatus, errorThrown) {
    if(jqXHR.status = 400) {
        alert(jqXHR.responseText);
    }
    else {
        alert(jqXHR.status + ': ' + jqXHR.content + '. ' + textStatus + ', ' + errorThrown);
    }
}

// Add buttons whose functions are allowed for current frame
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

// Main function for adding frame element and subframe lists
function addFrameDetails() {
    // Add frame elements in inherited frame element list
    $.each(inheritedElements, function(index, fe) {
        var option = createOption(fe.fields.fe_name, 'inherited', index == 0);
        $('#inherited').append(option);
    });

    // Add frame elements in new (uninherited) frame element list
    $.each(newElements, function(index, fe) {
        var option = createOption(fe.fields.fe_name, 'new', index == 0);
        $('#new').append(option);
    });

    // Add subframes
    for(var i = 0; i < subframes.length; i++) {
        var subframe = createSubframe(subframes[i].fields.name, subelements[i], i == 0);
        $('#subframes').append(subframe);
    }
}

// Create frame element option for frame elements list
function createOption(fe_name, op_name, checked) {
    var option = '<li><input type="radio" name="' + op_name + '"';

    // Automatically check first option
    if(checked) {
        option = option + ' checked';
    }

    option = option + ' value="' + fe_name + '"><span class="rcontent">';
    option = option + fe_name + '</span></input></li>';

    return option;
}

// Create subframe option in subframe list
function createSubframe(name, relations, checked) {
    var subframe = '<li class="suboption"><input type="radio" name="subframe" value="' + name + '"';
    if(checked) {
        subframe = subframe + ' checked';
    }
    subframe = subframe + '/> ' + name;
    var sfrels = '<ul class="sfrels">';

    // Add frame element relation selections
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

// Return all options of frame element select, with given option selected
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

// Create text box and button for renaming frame element
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

// ajax request to rename frame element and refresh page
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

// ajax request to delete frame element and refresh page
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

// Create text box and button to add new frame element with given name
function feAdd() {
    $('#nadd').hide();

    var textbox = '<p>Name:  <input type="text" name="addnew"/></p>';
    var button = '<button id="saveaddbutton" type="button" onClick="saveAdd();">Save</button>';

    var toAppend = '<div id="save_add">' + textbox + button + '</div>';

    $('#newlist').append(toAppend);
}

// ajax request to add frame element and refresh page
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

// ajax request to delete subframe and refresh page
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

// Create text box and button to add subframe
function subframeAdd() {
    $('#sadd').hide();

    var textbox = '<p>Name: <input type="text" name="addsf"/></p>';
    var button = '<button id="addsfsave" type="button" onClick="saveSF();">Save</button>';

    var toAppend = '<div id="sf_add">' + textbox + button + '</div>';
    $('#sfbuttons').append(toAppend);
}

// ajax request to add subframe and refresh page
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

// ajax request to save changes to frame element assignments for selected subframe
function saveSFRel() {
    var checked = '#subframes input[name=subframe]:checked';
    var name = $(checked).attr('value');
    var parent_fes = new Array();
    var child_fes = new Array();

    // Fill coresponding arrays with names of frame elements in assignments
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
