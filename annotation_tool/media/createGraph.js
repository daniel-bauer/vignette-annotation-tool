$(document).ready(function(){
    getAdjacencyList(scene_id,corpus_id,'');
});

function createGraph(adjacencyList){
    var width = 600;
    var height = 600;
    var g = new Graph();
    var nodes = [];
    g,nodes = createNodes(g, adjacencyList);
    g = createEdges(g,adjacencyList);

    var layouter = new Graph.Layout.Spring(g);
    renderer = new Graph.Renderer.Raphael('canvas', g, width, height);
    addClickPropertyToNodes(nodes);
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

