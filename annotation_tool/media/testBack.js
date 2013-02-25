   $(document).ready(function(){
       
       jQuery.ajax({
        url: 'http://127.0.0.1:8000/media/file_to_read.txt',
        type: 'get',
        dataType: 'text',
        success:function(data)
        {
	    var lines = data.split('\n');
	    $.each(lines, function(index, value){
		$('#file-display > tbody:last').append('<tr><td>'+value+'</td></tr>');
	    });
        } 
     });
       alert('foo');
       sentence = sentence.replace(/&quot;/ig,'"');
       sentence = jQuery.parseJSON(sentence);
       alert(sentence.sentences);
       $('#file-display tr').each(function(){
	   $(this).click(function(event){
	       selectedRow = $('#file-display tr.row-highlight');
	       selectedRow.removeClass('row-highlight');
	       $(this).addClass('row-highlight');
	       $('.display-sentence').val($(this).find('td').text());
	   });
       });
   });

function selectNextRow(event){
    row = $('#file-display tr.row-highlight');
    if(row.length==0){
	selectedRow = $('#file-display tr:first');
	$(selectedRow).addClass('row-highlight');
       $('.display-sentence').val(selectedRow.find('td').text());
    }
    else {
	   selectedRow = $('#file-display tr.row-highlight');
	   selectedRow.removeClass('row-highlight');
       	$(selectedRow.next()).addClass('row-highlight');
	   $('.display-sentence').val(selectedRow.next().find('td').text());
    }
}

function selectPrevRow(event){
    row = $('#file-display tr.row-highlight');
    if(row.length==0){
	selectedRow = $('#file-display tr:last');
	$(selectedRow).addClass('row-highlight');
       $('.display-sentence').val(selectedRow.find('td').text());
    }
    else {
	   selectedRow = $('#file-display tr.row-highlight');
	   selectedRow.removeClass('row-highlight');
       	$(selectedRow.prev()).addClass('row-highlight');
	$('.display-sentence').val(selectedRow.prev().find('td').text());
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
