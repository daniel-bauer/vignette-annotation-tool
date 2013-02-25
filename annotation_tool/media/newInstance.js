$(document).ready(function(){
   $('.word-text-box').val(word)
   getFrames();
    populateInstances(sceneId,corpusId);
});

function populateInstances(sceneId,corpusId){
    var dropDownBox = $('#instances-name');
    jQuery.ajax({
       url: 'http://127.0.0.1:8000/instances/?scene_id=' + sceneId +'&corpus_id=' + corpusId,
       type: 'get',
       dataType: 'text',
       success:function(data)
        {
	    instances = data.replace(/&quot;/ig,'"');       
	    instances = jQuery.parseJSON(instances);
	    addInstances(instances);
	}
    });
}

function addInstances(instances){
    var instancesNames = document.getElementById('instances-name');
    $('#instances-name').html(' ');
     $.each(instances.instances, function(index, value){
        instancesNames.add(new Option(value.name,value.name));
	instancesNames.size = index +1;
     });
}


function getFrames(){
    jQuery.ajax({
       url: 'http://127.0.0.1:8000/frames',
       type: 'get',
       dataType: 'text',
       success:function(data)
        {
	   frames = data.replace(/&quot;/ig,'"');       
	   frames = jQuery.parseJSON(frames);
	    populateFrameNamesDropDown(frames);
	}
    });
}

function populateFrameNamesDropDown(frames){
    var dropDownBox = $('#frame-names');
    $.each(frames, function(index,value){
	var newOption = '<option val='+value.name +'>'+value.name+'</option>';
	dropDownBox.append(newOption);
    });
}

function createInstance(){
    var frameName = $('#frame-names').val();
    var request_parameters = '?scene_id=' + sceneId +'&corpus_id=' + corpusId + '&word=' + word + '&word_position=' + wordPosition +  '&name=' + frameName + '&sentence_id=' + sentenceId;
    jQuery.ajax({
	url: 'http://127.0.0.1:8000/create_instances/'+encodeURI(request_parameters),
       type: 'get',
       dataType: 'text',
	success:function(data)
       {	
	   alert(data);
       },
	error:function(jqXHR)
	{
	    alert(jqXHR.status);
	    alert(jqXHR.responseText);
	}
   })
}


function relateInstances(){
    var selectedInstances = $("#instances-name").val() || [];
    alert(selectedInstances.length);
    $.each(selectedInstances, function(index,value){
	alert(value);
    });
}
