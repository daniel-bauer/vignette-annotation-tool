$(document).ready(function() {
    var header = '';
    if(!word || word == '') {
        header = 'Select implicitly evoked frame';
    }
    else {
        header = 'Select frame evoked by "' + word + '"';
    }
    $('h1').html(header);

    $(window).unload(function() {
        opener.onPopupClose();
    });
    csrfProtect();
    populateFrameList();
    toggleSelectedFrame();
});

function populateFrameList() {
    var frameList = $('#frame-list');
    var i = 0;
    for(var j = 0; j < results.length; j++) {
        var value = results[j];
        var fes = resultFEs[j];

        var text = '<span class=frame-text>' + value.fields.name + '</span>';
        var data = '<div class=data><p>';

        $.each(fes, function(index, element) {
            data = data + element.fields.fe_name + ' ';
        })

        data = data + '</p></div>';

        // Give frame topframe class if it is the first item
        var fclass = '"';
        if(i == 0 ) {
            fclass = ' topframe"';
        }

        var newItem = '<li class="frame' + fclass + ' id=' +  value.fields.name + '>';
        newItem = newItem + text + data + '</li>';
        frameList.append(newItem);
        frameList.find('>:last-child .data').hide();

        i = 1;
    };
}

function toggleSelectedFrame() {
    var selectedFrameID = '';
    $('#frame-list').on('click', '.frame', function() {
        toSelect = $(this)
        toSelect.toggleClass('selected');
        
        var thisID = toSelect.attr('id');
        if(selectedFrameID != '') {
            var toUnselect = $('#frame-list li#' + selectedFrameID);
            toUnselect.removeClass('selected');
            toUnselect.find('.data').hide();
            
            if(thisID == toUnselect.attr('id')) {
                selectedFrameID = '';
            }
            else {
                selectedFrameID = thisID;
                toSelect.find('.data').show();
            }
        }
        else {
            selectedFrameID = thisID;
            toSelect.find('.data').show();
        }
    });
}

function createInstance(frameName) {

    if(frameName == null) {
        frameName = $('.selected').attr('id');
    }

    jQuery.ajax({
        url: '/create_instances/',
        type: 'POST',
        data: {
            sceneId: sceneId,
            corpusId: corpusId,
            word: word,
            wordPosition: wordPosition,
            name: frameName,
            sentenceId: sentenceId
        },
        dataType: 'text',
        success:function(data) {
            alert(data + '\nThis window will now close');
            window.close()
        },
        error:function(jqXHR, textStatus, errorThrown) {
            alert(jqXHR.status + ', ' + textStatus + ', ' + errorThrown);
        }
    });
}

function createFrame() {
    parentFrameName = $('.selected').attr('id');
    frameName = $('input[name="frame_name"]').attr('value');

    hasLexicalization = 1;
    if(word == '')
        hasLexicalization = 0;
   
    // Create frame 
    ajaxRequest('/create_frame/', 'POST', false,
            {
                name: frameName,
                frameType: 'USER_MADE',
                hasLexicalization: hasLexicalization
            });

    // Create frame relation
    ajaxRequest('/create_framerelation/', 'POST', false,
            {
                parentFrameName: parentFrameName,
                frameName: frameName,
                relationType: 'ISA'
            });

    // Create frame elements and fe relationships
    ajaxRequest('/create_frameelements/', 'POST', false, 
            {
                frameName: frameName,
                parentFrameName: parentFrameName
            });

    createInstance(frameName);
}

// ajax request helper function
var ajaxRequest = function(url, type, success, data) {
    var successFunc = function(data) {}
    if(success) {
        successFunc = function(data) {
            alert('Successfully created new frame.\nThis window will now close.');
            window.close();
        }
    }
    jQuery.ajax({
        url: url,
        type: type,
        data: data,
        success: successFunc,
        error:function(jqXHR, textStatus, errorThrown) {
            alert(url + ', ' + jqXHR.status + ', ' + textStatus + ', ' + errorThrown);
        }
    });
}
