var instances = {};
$(document).ready(function(){
    $('#display-sentence').val('');
    $('.text-box').find('.word').val('');
    $('.text-box').find('.word-pos').val('');
    eventsForChangeScene();
    addTextChangedToFrameDetails();
    addTextSelectionFeature();
   });

function addTextSelectionFeature(){
     $('#display-sentence').keyup(function(){
	 text = getSelectedTextboxValue();
	 addTextToInstanceValues(text);
     });
     $('#display-sentence').mouseup(function(event){
	 text = getSelectedTextboxValue();
	 addTextToInstanceValues(text);
     });
}

function addTextToInstanceValues(text){
   var empty_word_textboxes =  $('.text-box').find('input:text[value=""][class=word]');
    var empty_word_position_textboxes = $('.text-box').find('input:text[value=""][class=word-pos]');
    empty_word_textboxes.first().val(text);
    var word_position = getPositionOfWord($.trim(text));
    empty_word_position_textboxes.first().val(word_position);
}

function saveInstances(event){
   var wordTextboxes =  $('.text-box').find('input:text[class=word]');
    var instanceName = $('#instances-name').val();

    $.each(wordTextboxes, function(index, value){
	word = $.trim($(value).val());
	if(word=='')
	    return false;
	var instancePresent = isInstanceWithWord(instanceName,word);
	if(instancePresent.length == 0)
	    createInstance(word);
    });
}

function isInstanceWithWord(instanceName,word){
    return $.grep(instances.instances,function(instance, index){
	return instance.word == word && instance.name == instanceName;
    });
}

// creates a new instance in the new window

function createInstance(text){
    var word_position = getPositionOfWord(text);
    var name = $('#instances-name').val().split('-')[1];
    var sentence_id = $('#file-display .row-highlight').index()+1;
    var request_parameters = '?scene_id=' + scene_id +'&corpus_id=' + corpus_id + '&word=' + text + '&word_position=' + word_position +  '&name=' + name + '&sentence_id=' + sentence_id

    jQuery.ajax({
	url: 'http://127.0.0.1:8000/create_instances/'+encodeURI(request_parameters),
       type: 'get',
       dataType: 'text',
       success:function(data)
       {	
	   alert('success');
       }
   })
}

function getPositionOfWord(text){
    var sentence_array = $('#display-sentence').val().split(' ');
    var selected_text_array = text.split(' ');
    var word_position = "" + (sentence_array.indexOf(selected_text_array[0]) + 1);
    word_position +=  ":" + (sentence_array.indexOf(selected_text_array[selected_text_array.length-1]) + 1);
    return word_position
}

function getInstances(){
    jQuery.ajax({
       url: 'http://127.0.0.1:8000/instances/?scene_id=' + scene_id +'&corpus_id=' + corpus_id,
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

function updateConstituentDetails(instanceName){
   jQuery.ajax({
       url: 'http://127.0.0.1:8000/constituent_elements/?scene_id=' + scene_id +'&corpus_id=' + corpus_id+'&instance_name=' + instanceName,
       type: 'get',
       dataType: 'text',
       success:function(data)
        {
	   constituentElements = data.replace(/&quot;/ig,'"');       
	   constituentElements =jQuery.parseJSON(constituentElements);
           updateConstituentDisplayWithDetails(constituentElements);
	}
    });
}

function updateConstituentDisplayWithDetails(constituentElements){
    if(constituentElements.length==0)
    {
	$('.frame-elements-name').val('');
        $('.frame-element-instances').html('');
	return;
    }
    number = 0;
    $.each(constituentElements, function(index, value){
    	$($('.frame-elements-name')[number]).val(value.fe_name);
	populateFrameElementInstancesDropDown($($('.frame-element-instances')[number]),instances.instances);
	$($('.frame-element-instances')[number]).val(value.child_inst_name).attr('selected',true);
	number = number + 1;
    });
}

function populateFrameElementInstancesDropDown(dropDownBox,instances){
    $.each(instances, function(index,value){
	var newOption = '<option val='+value.name +'>'+value.name+'</option>';
	dropDownBox.append(newOption);
    });
}

function getSelectedTextboxValue(){
    var textbox = document.getElementById("display-sentence");
    var text = textbox.value.substr(textbox.selectionStart,textbox.selectionEnd-textbox.selectionStart);
    return text;
}
  
function addRowHighlighting(){
    $('#file-display tr').live("click",function(){
	selectedRow = $('#file-display .row-highlight');
	selectedRow.removeClass('row-highlight');
	$(this).addClass('row-highlight');
	$('#display-sentence').val($(this).find('td').text());
    });
}


// opens a new window where the new instance can be created. DOES NOT ACTUALLY CREATE A NEW INSTANCE
function createNewInstance(){
    var word = getSelectedTextboxValue();
    var wordPosition = getPositionOfWord(word);
    var sentenceId = $('#file-display .row-highlight').index()+1;
    var requestParameters = 'corpus_id='+corpus_id+'&scene_id='+scene_id+'&sentence_id='+sentenceId+'&word='+word+'&word_position='+wordPosition ; 
    window.open('http://127.0.0.1:8000/new_instances?'+requestParameters,'foo','height=300','width=60');
}

function addInstances(instances){
    var instancesNames = document.getElementById('instances-name');
    $('#instances-name').html(' ');
    
     $.each(instances.instances, function(index, value){
        instancesNames.add(new Option(value.name,value.name));
	instancesNames.size = index +1;
    });

    var selectedInstance = instances.instances[0].name;
    updateTextBoxesWithInstanceValues(selectedInstance,instances.instances);
    updateFrameDetails(selectedInstance,instances.instances);

    $('#instances-name').change(function () {
	selectedInstance = $(this).val();
	updateTextBoxesWithInstanceValues(selectedInstance,instances.instances);
	updateFrameDetails(selectedInstance,instances.instances);
	getSubFrameDetails(selectedInstance);
	getInheritanceDetails(selectedInstance);
	updateConstituentDetails(selectedInstance);
    }) 
}

function viewAllSubFrames(){
   var selectedInstance =  $('#instances-name').val();
    getAdjacencyList(scene_id,corpus_id,selectedInstance);
}

function hideAllSubFrames(){
    getAdjacencyList(scene_id,corpus_id,'');
}

function getSubFrameDetails(selectedInstance){
    jQuery.ajax({
        url: 'http://127.0.0.1:8000/subframes/?scene_id=' + scene_id +'&corpus_id=' + corpus_id +'&instance_name='+selectedInstance,
        type: 'get',
        dataType: 'text',
        success:function(data)
        {
	    subframes = data.replace(/&quot;/ig,'"');       
	    subframes = jQuery.parseJSON(subframes);
	    updateSubframeDetails(subframes);
	    addEventsToSubframes();
        } 
    });
}

function updateSubframeDetails(subframes){
    $('.subframe-body').html('');
    if(subframes.length==0)
	return;
    subframeHtml = '';
    $.each(subframes, function(key,subframeRelations){
	subframeHtml += "<div><label> " + key + " </label><br/>"
	$.each(subframeRelations , function(index, value){
	    subframeHtml +=  "<div class='text-indent'>" + value.parent_fe +":" + value.child_fe + "</div>";
	});
	subframeHtml += "</div>"
    });
    $('.subframe-body').html(subframeHtml);
}

function addEventsToSubframes(){
  $('.subframe-body input[type=checkbox]').live('change',function(){
     if(!this.checked){
	 var checkBoxName = this.name;
	 var checkBoxNumber = checkBoxName.split('-')[1];
	 $('.subframe-body .div-'+checkBoxNumber).hide();
     }
  });
}

function deleteSubFrame(frame_rel_id){
    jQuery.ajax({
        url: 'http://127.0.0.1:8000/delete_subframes?frame_rel_id='+frame_rel_id,
        type: 'get',
        dataType: 'text',
        success:function(data)
        {
	  alert('deleted subframe');
	  viewAllSubFrames();
	}
    });
}

function deleteInheritance(frame_rel_id){
    jQuery.ajax({
        url: 'http://127.0.0.1:8000/delete_subframes?frame_rel_id='+frame_rel_id,
        type: 'get',
        dataType: 'text',
        success:function(data)
        {
	  alert('deleted Inheritance');
	    getInheritanceDetails($('#instances-name').val());
	}
    });
}

function getInheritanceDetails(selectedInstance){
    jQuery.ajax({
        url: 'http://127.0.0.1:8000/inherits_from/?scene_id=' + scene_id +'&corpus_id=' + corpus_id +'&instance_name='+selectedInstance,
        type: 'get',
        dataType: 'text',
        success:function(data)
        {
	    inheritance = data.replace(/&quot;/ig,'"');       
	    inheritance = jQuery.parseJSON(inheritance);
	    updateInheritanceDetails(selectedInstance,inheritance);
	    addEventsToInheritance();
        } 
    });
}

function updateInheritanceDetails(selectedInstance,inheritance){
    $('.inherits-from-body').html('');
    if(inheritance.length==0)
	return;
    inheritance_html = ''+selectedInstance+'<br/>';
    $.each(inheritance, function(index,value){
	inheritance_html += "<div class='text-indent'>" + value.parent_fe +":" + value.child_fe + "<input type='submit' value='delete' onClick='deleteInheritance(" + value.frame_rel_id + ");'/> </div>";
    });
    $('.inherits-from-body').html(inheritance_html);
}

function addEventsToInheritance(){
  $('.inherits-from-body input[type=checkbox]').live('change',function(){
     if(!this.checked){
	 var checkBoxName = this.name;
	 var checkBoxNumber = checkBoxName.split('-')[1];
	 $('.inherits-from-body .div-'+checkBoxNumber).hide();
     }
  });
}


function updateFrameDetails(selectedInstance,instances)
{
    $.each(instances, function(index, value){
	if(value.name == $.trim(selectedInstance)){
	    $('.instance_details').text(value.name);
	    $('.frame-name').val(value.frame_name);
	}
    });
}

function updateTextBoxesWithInstanceValues(selectedInstance,instances){
    var number = 0;
    $('.text-box').find('.word').val('');
    $('.text-box').find('.word-pos').val('');    
    $.each(instances, function(index, value){
        if(value.name == $.trim(selectedInstance)){
    	    $($('.text-box .word')[number]).val(value.word);
    	    $($('.text-box .word-pos')[number]).val(value.word_position);
	    number = number + 1;
    	}
    });
}

function addSentences(){
    jQuery.ajax({
        url: 'http://127.0.0.1:8000/sentences/?scene_id=' + scene_id +'&corpus_id=' + corpus_id,
        type: 'get',
        dataType: 'text',
        success:function(data)
        {
	    $('#file-display > tbody:last').html("");
	    $('#file-display > tbody:last').append(data);
        } 
    });
}

function selectNextScene(event){
    scene_id += 1;
    eventsForChangeScene();
}

function eventsForChangeScene(){
    $('#display-sentence').val('');
    $('.text-box').find('.word').val('');
    $('.text-box').find('.word-pos').val('');
    addSentences();
    addRowHighlighting();
    getInstances();
}

function selectPrevScene(event){
    if(scene_id<=0)
	return ;
    scene_id -= 1;
    eventsForChangeScene();
}

function selectNextRow(event){
    row = $('#file-display tr.row-highlight');
    if(row.length==0){
	selectedRow = $('#file-display tr:first');
	$(selectedRow).addClass('row-highlight');
       $('#display-sentence').val(selectedRow.find('td').text());
    }
    else {
	   selectedRow = $('#file-display tr.row-highlight');
	   selectedRow.removeClass('row-highlight');
       	$(selectedRow.next()).addClass('row-highlight');
	   $('#display-sentence').val(selectedRow.next().find('td').text());
    }
}

function selectPrevRow(event){
    row = $('#file-display tr.row-highlight');
    if(row.length==0){
	selectedRow = $('#file-display tr:last');
	$(selectedRow).addClass('row-highlight');
       $('#display-sentence').val(selectedRow.find('td').text());
    }
    else {
	   selectedRow = $('#file-display tr.row-highlight');
	   selectedRow.removeClass('row-highlight');
       	$(selectedRow.prev()).addClass('row-highlight');
	$('#display-sentence').val(selectedRow.prev().find('td').text());
    }
}

function addNewFrameElement(event){
    textboxes = $('.text-box .word-pos');
    $('.lexical-checkbox').last().after('<input type"text" style="width:50%"> <select> <option value="i2">i2 </option></select> lexical <input type="checkbox" class="lexical-checkbox" style="width:3px"/> <br/>');
}

function addTextbox(event){
    textboxes = $('.text-box .word-pos');
    $('.word-pos').last().after('<input type="text" style="width:60%"/> <input type="text" class="word-pos" style="width:35%"/> <br/>');
}

function addTextChangedToFrameDetails(event){
    $('.frame-name').change( function(){
	$('.is-saved').text('unsaved');
    });
}