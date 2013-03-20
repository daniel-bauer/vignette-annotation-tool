$(document).ready(function() {
    $('h1').html('Select frame evoked by "' + word + '"');
    getFrames();

    // Highlight selected frame, unhighlight previously selected frame
    var selectedFrameID = '';
    $('#frame-list').on('click', '.frame', function() {
        if(selectedFrameID != '') {
            $('#frame-list li#' + selectedFrameID).removeClass('selected');
        }
        $(this).addClass('selected');
        selectedFrameID = $(this).attr('id');
    });
});

function getFrames() {
    jQuery.ajax({
        url: 'http://127.0.0.1:8000/frames',
        type: 'get',
        dataType: 'text',
        success:function(data)
        {
            frames = data.replace(/&quot;/ig,'"');       
            frames = jQuery.parseJSON(frames);
            populateFrameList(frames);
        }
    });
}

function populateFrameList(frames) {
    var frameList = $('#frame-list');
    $.each(frames, function(index,value){
        var newItem = '<li class = "frame" id=' + value.name + '>' + value.name + '</li>';
        frameList.append(newItem);
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
