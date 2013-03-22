$(document).ready(function() {
    var header = '';
    if(word == '') {
        header = 'Select implicitly evoked frame';
    }
    else {
        header = 'Select frame evoked by "' + word + '"';
    }
    $('h1').html(header);

    populateFrameList();
    toggleSelectedFrame();
});

function populateFrameList() {
    var frameList = $('#frame-list');
    var i = 0;
    $.each(results, function(index,value) {
        var text = '<span class=frame-text>' + value.fields.name + '</span>';

        // Give it topframe class if it is the first item
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

function createInstance() {
    var frameName = $('.selected').attr('id');
    var request_parameters = '?scene_id=' + sceneId +'&corpus_id=' + corpusId + '&word=' + word + '&word_position=' + wordPosition +  '&name=' + frameName + '&sentence_id=' + sentenceId;
    jQuery.ajax({
        url: 'http://127.0.0.1:8000/create_instances/' + encodeURI(request_parameters),
        type: 'get',
        dataType: 'text',
        success:function(data) {	
            alert(data);
        },
        error:function(jqXHR) {
            alert(jqXHR.status);
            alert(jqXHR.responseText);
        }
    });
}
