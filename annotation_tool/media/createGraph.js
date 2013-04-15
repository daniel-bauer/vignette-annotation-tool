$(document).ready(function(){
    getAdjacencyList(scene_id,corpus_id,'');
});

function createGraph(svgContent){
   
    var pos1=svgContent.indexOf("width");
    var pos2=svgContent.indexOf("height");
    alert('aa');

    var pos3=svgContent.indexOf("\"",pos1+7);
    var pos4=svgContent.indexOf("\"",pos2+8);
   
    var width=svgContent.substring(pos1+7,pos3-2);
    var height=svgContent.substring(pos2+8, pos4-2);
    alert('--'+width+'--');
    alert(height);
    
    var innerWidth = document.getElementById('p_svg').offsetWidth;
    alert(innerWidth);
    
    var innerHeight = document.getElementById('p_svg').offsetHeight;
    alert(innerHeight);

    
    svgContent_new=svgContent;
    
    
    if(parseInt(width) < parseInt(innerWidth)){
        
        svgContent_new= svgContent.substring(0,pos1+7)+innerWidth+'px'+svgContent.substring(pos3);
        
    }
    
    if(parseInt(height)<parseInt(innerHeight)*0.9){
         var pos2=svgContent_new.indexOf("height");
         var pos4=svgContent_new.indexOf("\"",pos2+8);
         svgContent_new=svgContent_new.substring(0,pos2+8)+innerHeight+'px'+svgContent_new.substring(pos4);
     
    }
    
    
    document.getElementById("p_svg").innerHTML = svgContent_new;
    (function($){
     $(document).ready(function () {
                       $("svg").graphviz({statusbar: true});
                       });
     })(jQuery);

    
}

redraw = function() {
    layouter.layout();
    renderer.draw();
};

function addClickPropertyToNodes(nodes){
    $.each(nodes,function(index,node){
	$('#'+node).dblclick(function(){
	    getAdjacencyList(scene_id,corpus_id,node);
	});
    });
}

function createNodes(graph, adjacencyList){
    nodes = [];
    for(parentNode in adjacencyList){
	if(jQuery.inArray(parentNode,nodes) ==-1){
	       graph.addNode(parentNode);
	    	nodes.push(parentNode);
	}
	var adjacencyListForNode = adjacencyList[parentNode]
	for(childNode in adjacencyListForNode){
	    if(jQuery.inArray(childNode,nodes) ==-1){
		graph.addNode(childNode);
	    	nodes.push(childNode);
	    }
        }
    }
    return graph,nodes;
}

function createEdges(graph,adjacencyList){
    for(parentNode in adjacencyList){
	var adjacencyListForNode = adjacencyList[parentNode];
	for(childNode in adjacencyListForNode){
	    graph.addEdge(parentNode,childNode,{label:adjacencyListForNode[childNode]});
        }
    }
    return graph;
}

function getAdjacencyList(scene_id,corpus_id,instance_name){
    $('#canvas').html('');
    var query='';
    if(instance_name!='')
	query = '&instance_name=' + instance_name;
   jQuery.ajax({
       url: 'http://127.0.0.1:8000/graph/?scene_id=' + scene_id +'&corpus_id=' + corpus_id + query,
       type: 'get',
       dataType: 'text',
       success:function(data)
        {
	   adjacencyList = data.replace(/&quot;/ig,'"');       
	   adjacencyList = jQuery.parseJSON(adjacencyList);
       createGraph(adjacencyList);
               
	}
    });
}

