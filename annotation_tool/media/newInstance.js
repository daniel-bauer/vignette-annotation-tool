$(document).ready(function() {
    var header = '';
    if(word == '') {
        header = 'Select implicitly evoked frame';
    }
    else {
        header = 'Select frame evoked by "' + word + '"';
    }
    $('h1').html(header);

    csrfProtect();
    populateFrameList();
    toggleSelectedFrame();
});

function populateFrameList() {
    var frameList = $('#frame-list');
    var i = 0;
    $.each(results, function(index,value) {
        var text = '<span class=frame-text>' + value.fields.name + '</span>';

        // Give frame topframe class if it is the first item
        var fclass = '"';
        if(i == 0 ) {
            fclass = ' topframe"';
        }

        var newItem = '<li class="frame' + fclass + ' id=' +  value.fields.name + '>' + text + '</li>';
        frameList.append(newItem);

        i = 1;
    });
}

function toggleSelectedFrame() {
    var selectedFrameID = '';
    $('#frame-list').on('click', '.frame', function() {
        $(this).toggleClass('selected');
        
        var thisID = $(this).attr('id');
        if(selectedFrameID != '') {
            var toUnselect = $('#frame-list li#' + selectedFrameID);
            toUnselect.removeClass('selected');
            
            if(thisID == toUnselect.attr('id')) {
                selectedFrameID = '';
            }
            else {
                selectedFrameID = thisID;
            }
        }
        else {
            selectedFrameID = thisID;
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
    ajaxRequest('/create_frameelements/', 'POST', true, 
            {
                frameName: frameName,
                parentFrameName: parentFrameName
            });
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
