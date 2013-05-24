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

    csrfProtect();  // for post requests
    populateFrameList();
    toggleDetails();
    toggleSelectedFrame();
});

// Error function for ajax requests
function errorFunc(jqXHR, textStatus, errorThrown) {
    if(jqXHR.status = 400) {
        alert(jqXHR.responseText);
    }
    else {
        alert(this.url + ', ' + jqXHR.status + ', ' + textStatus + ', ' + errorThrown);
    }
}

// Fill list of frames
function populateFrameList() {
    var frameList = $('#frame-list');
    for(var i = 0; i < results.length; i++) {
        var value = results[i];
        var fes = resultFEs[i];
        var sfs = subframes[i];
        var parentframe = parentframes[i];

        var text = '<span class=frame-text>' + value.fields.name + '</span>';
        text = text + '<span class="select">Select frame</span>';
        text = text + '<div class=data>';

        data = makeDataString(value, fes, sfs, parentframe);
        if(data == '') {
            data = '<p>Primitive frame</p>';
        }
        
        // Give frame topframe class if it is the first item
        var fclass = '"';
        if(i == 0) {
            fclass = ' topframe"';
            first = false;
        }

        var newItem = '<li class="frame' + fclass + ' id=' +  value.fields.name + '>';
        newItem = newItem + text + data +  '</div></li>';
        frameList.append(newItem);
        
        // Hide data (to be revealed on click)
        frameList.find('>:last-child .data').hide();
    };
}

// String of data about frame, revealed on click
function makeDataString(value, fes, sfs, parentframe) {
    
    // Frame element information
    var fetext = '';
    if(fes.length != 0) {
        fetext = '<p>Frame elements: ';
        $.each(fes, function(index, element) {
            fetext = fetext + element.fields.fe_name + ', ';
        });
        fetext = fetext.substring(0, fetext.length-2);  // strip last ', '
        fetext = fetext + '</p>';
    }
    
    // Subframe information
    var sftext = '';
    if(sfs.length != 0) {
        sftext = '<p>Subframes: ';
        $.each(sfs, function(index, element) {
            sftext = sftext + element.fields.name + ', ';
        });
        sftext = sftext.substring(0, sftext.length-2);
        sftext = sftext + '</p>';
    }

    // Inheritance information
    var ptext = '';
    if(parentframe != '') {
        ptext = '<p>Inherits from: ' + parentframe[0].fields.name + '</p>';
    }

    return fetext + sftext + ptext
}

// Reveal selected information, hide previously selected information
function toggleDetails() {
    var expandedFrameID = ''; 

    $('#frame-list').on('click', '.frame', function() {
        // toggledetails prevents selecting frame from also hiding/expanding details
        if(toggledetails) {
            toToggle = $(this).find('.data');
            toToggle.toggle();
            var toggleID = $(this).attr('id');
            
            // Unexpand previously expanded frame
            if(expandedFrameID != '') {
                var unexpanded = $('#frame-list li#' + expandedFrameID);
                unexpanded.find('.data').hide();
                
                // Set currently expanded frame ID if new frame is expanded
                if(toggleID == unexpanded.attr('id')) {
                    expandedFrameID = '';
                }
                else {
                    expandedFrameID = toggleID;
                }
            }
            else {
                expandedFrameID = toggleID;
            }
        }
        else {
            toggledetails = true;
        }
    });
}

// Make new frame selected, previous frame unselected
function toggleSelectedFrame() {
    var selectedFrameID = '';

    $('#frame-list').on('click', '.select', function() {
        // toggledetails prevents selecting frame from also hiding/expanding details
        // Assumes selection toggle is first in order of "on click" calls
        toggledetails = false;

        toToggle = $(this).parent();
        toToggle.toggleClass('selected');
        var toggleID = toToggle.attr('id');
        
        // Same logic as toggleExpandedFrame
        if(selectedFrameID != '') {
            var unselected = $('#frame-list li#' + selectedFrameID);
            unselected.removeClass('selected');
            
            if(toggleID == unselected.attr('id')) {
                selectedFrameID = '';
            }
            else {
                selectedFrameID = toggleID;
            }
        }
        else {
            selectedFrameID = toggleID;
        }
    });
}

// ajax request for creating new instance
function createInstance(frameName) {

    // Determines which success function to use
    // Depends on whether or not user is extending a frame
    var wasNull = false;
    if(frameName == null) {
        frameName = $('.selected').attr('id');
        wasNull = true;
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
            if(wasNull) {
                alert(data + '\nYou may now close this window');
            }
            else {
                // Direct to frame editor
                document.location.href = '/frame_editor?frame_name=' + frameName;
            }
        },
        error: errorFunc
    });
}

// ajax requests for creating a frame if user extended frame
function createFrame() {
    var parentFrameName = $('.selected').attr('id');

    // Ensure a frame is selected
    if(parentFrameName == null) {
        alert('Please select a frame');
        return;
    }

    var frameName = $('input[name="frame_name"]').attr('value');

    var hasLexicalization = 1;
    if(word == '') {
        hasLexicalization = 0;
    }

    // Each step in creating inheritance waits for success of previous step
    // Create frame
    jQuery.ajax({url: '/create_frame/', type: 'POST', dataType: 'text',
        data:
        {
            name: frameName,
            frameType: 'USER_MADE',
            hasLexicalization: hasLexicalization
        },
        error: errorFunc,
        success: function(data) {

            // Create frame relation
            jQuery.ajax({url: '/create_framerelation/', type: 'POST', dataType: 'text',
                data:
                {
                    frameName: frameName,
                    parentFrameName: parentFrameName,
                    relationType: 'ISA'
                },
                error: errorFunc,
                success: function(data) {

                    // Create frame elements and frame element relationships
                    jQuery.ajax({url: '/create_frameelements/', type: 'POST', dataType: 'text',
                        data:
                        {
                            frameName: frameName,
                            parentFrameName: parentFrameName
                        },
                        error: errorFunc,
                        success: function(data) {
                            createInstance(frameName);
                        }
                    });
                }
            });
        }
    });
}

function editFrame() {
    frameName = $('.selected').attr('id');
    if(frameName == null) {
        alert('Please select a frame');
    }
    else {
        document.location.href = '/frame_editor?frame_name=' + frameName;
    }
}
