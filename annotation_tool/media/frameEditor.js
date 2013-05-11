$(document).ready(function() {
    $('h1').html('Editing frame: "' + frameName + '"');
    
    $(window).unload(function() {
        opener.onPopupClose();
    });

    csrfProtect();
    addButtons();
    addFrameDetails();
});

function addButtons() {
    if(isParent == 'True') {
        var warning = '<p>Cannot add/delete frame elements if frame is parent of another frame</p>';
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
}

function createOption(fe_name, op_name, checked)
{
    var option = '<li><input type="radio" name="' + op_name + '"';
    if(checked) {
        option = option + ' checked';
    }
    option = option + ' value="' + fe_name + '"><span class="rcontent">';
    option = option + fe_name + '</span></input></li>';

    return option;
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
        error: function(jqXHR, textStatus, errorThrown) {
            if(jqXHR.status = 400) {
                alert(jqXHR.responseText);
            }
            else {
                alert(jqXHR.status + ': ' + jqXHR.content + '. ' + textStatus + ', ' + errorThrown);
            }
        }
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
        error: function(jqXHR, textStatus, errorThrown) {
            if(jqXHR.status == 400) {
                alert(jqXHR.responseText);
            }
            else {
                alert(jqXHR.status + ': ' + jqXHR.responseText + '. ' + textStatus
                    + ', ' + errorThrown);
            }
        }
    });
}

// Give Use_computer "Self" back
function feAdd() {
    $('#nadd').hide()

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
        error: function(jqXHR, textStatus, errorThrown) {
            if(jqXHR.status == 400) {
                alert(jqXHR.responseText);
            }
            else {
                alert(jqXHR.status + ': ' + jqXHR.responseText + '. ' + textStatus
                    + ', ' + errorThrown);
            }
        }
    });
}

function subframeDel() {
}

function subframeAdd() {
}

function saveChanges() {
}
