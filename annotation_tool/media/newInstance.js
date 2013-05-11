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
    toggleDetails();
    toggleSelectedFrame();
});

function populateFrameList() {
    var frameList = $('#frame-list');
    var first = true; 
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
        if(first) {
            fclass = ' topframe"';
            first = false;
        }

        var newItem = '<li class="frame' + fclass + ' id=' +  value.fields.name + '>';
        newItem = newItem + text + data +  '</div></li>';
        frameList.append(newItem);
        frameList.find('>:last-child .data').hide();
    };
}

function makeDataString(value, fes, sfs, parentframe) {
    var fetext = '';
    if(fes.length != 0) {
        fetext = '<p>Frame elements: ';
        $.each(fes, function(index, element) {
            fetext = fetext + element.fields.fe_name + ', ';
        });
        fetext = fetext.substring(0, fetext.length-2);  // strip last ', '
        fetext = fetext + '</p>';
    }
    
    var sftext = '';
    if(sfs.length != 0) {
        sftext = '<p>Subframes: ';
        $.each(sfs, function(index, element) {
            sftext = sftext + element.fields.name + ', ';
        });
        sftext = sftext.substring(0, sftext.length-2);
        sftext = sftext + '</p>';
    }

    var ptext = '';
    if(parentframe != '') {
        ptext = '<p>Inherits from: ' + parentframe[0].fields.name + '</p>';
    }

    return fetext + sftext + ptext
}

function toggleDetails() {
    var expandedFrameID = '';
    $('#frame-list').on('click', '.frame', function() {
        if(toggledetails) {
            toToggle = $(this).find('.data');
            toToggle.toggle();
            var toggleID = $(this).attr('id');
            
            if(expandedFrameID != '') {
                var unexpanded = $('#frame-list li#' + expandedFrameID);
                unexpanded.find('.data').hide();
                
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

function toggleSelectedFrame() {
    var selectedFrameID = '';
    $('#frame-list').on('click', '.select', function() {
        toggledetails = false;

        toToggle = $(this).parent();
        toToggle.toggleClass('selected');
        var toggleID = toToggle.attr('id');
        
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

function createInstance(frameName) {

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
        error:function(jqXHR, textStatus, errorThrown) {
            alert(jqXHR.status + ', ' + textStatus + ', ' + errorThrown);
        }
    });
}

function createFrame() {
    parentFrameName = $('.selected').attr('id');
    frameName = $('input[name="frame_name"]').attr('value');

    hasLexicalization = 1;
    if(word == '') {
        hasLexicalization = 0;
    }

    var errorfunc = function(jqXHR, textStatus, errorThrown) {
            alert(this.url + ', ' + jqXHR.status + ', ' + textStatus + ', ' + errorThrown);
        }

    // Create frame 
    jQuery.ajax({url: '/create_frame/', type: 'POST', dataType: 'text',
        data:
        {
            name: frameName,
            frameType: 'USER_MADE',
            hasLexicalization: hasLexicalization
        },
        error: errorfunc,
        success: function(data) {

            // Create frame relation
            jQuery.ajax({url: '/create_framerelation/', type: 'POST', dataType: 'text',
                data:
                {
                    frameName: frameName,
                    parentFrameName: parentFrameName,
                    relationType: 'ISA'
                },
                error: errorfunc,
                success: function(data) {

                    // Create frame elements and fe relationships
                    jQuery.ajax({url: '/create_frameelements/', type: 'POST', dataType: 'text',
                        data:
                        {
                            frameName: frameName,
                            parentFrameName: parentFrameName
                        },
                        error: errorfunc,
                        success: function(data) {
                            createInstance(frameName);
                        }
                    });
                }
            });
        }
    });
}
