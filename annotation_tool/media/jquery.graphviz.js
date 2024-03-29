/*
 Copyright (c) 2012 by Pablo Martín <goinnn@gmail.com>

 This software is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This software is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with this software.  If not, see <http://www.gnu.org/licenses/>.
*/
(function ($) {
    $.fn.graphviz = function (opts) {
        var arrow = "->";
        var defaults = {status: "movable",
                        statusbar: true,
                        dragableCursor: "move"};
        opts = $.extend(defaults, opts || {});
        /* Graph functions */
        function getTitleOfNode(nodeItem) {
            return $(nodeItem).children("title").text();
        }
        function getNode(nodeTitle) {
            var title = $("g.node title").filter(function (idx) {
                return this.textContent.trim() === nodeTitle;
            });
            return title.parent();
        }
        function getEdges(nodeTitle, io) {
            if (io && io === "input") {
                nodeTitle = nodeTitle + arrow;
            } else if (io && io === "output") {
                nodeTitle = arrow + nodeTitle;
            }
            var titles = $("g.edge title").filter(function (idx) {
                return this.textContent.indexOf(nodeTitle) !== -1;
            });
            return titles.parent();
        }
        function getEdge(nodeTitleSource, nodeTitleDestination) {
            var title = nodeTitleSource + arrow + nodeTitleDestination;
            var titles = $("g.edge title").filter(function (idx) {
                return this.textContent.indexOf(title) !== -1;
            });
            return titles.parent();
        }
        function moveTextNode(textItem, ix, iy) {
            textItem.x.baseVal.getItem(0).value = textItem.x.baseVal.getItem(0).value + ix;
            textItem.y.baseVal.getItem(0).value = textItem.y.baseVal.getItem(0).value + iy;
        }
        function moveNode(nodeTitle, ix, iy) {
            var nodeItem = getNode(nodeTitle);
            var children = $(nodeItem.children());
            var text = children.filter("text")[0];
            if (text) {
                moveTextNode(text, ix, iy);
            }
            var ellipse = children.filter("ellipse")[0];
            ellipse.cx.baseVal.value = ellipse.cx.baseVal.value + ix;
            ellipse.cy.baseVal.value = ellipse.cy.baseVal.value + iy;
        }
        function movePath(pathItem, ix, iy, io) {
            // http://stackoverflow.com/questions/5287559/calculating-control-points-for-a-shorthand-smooth-svg-path-bezier-curve
            var pathSegList = pathItem.pathSegList;
            var pathPointStart = 0;
            var pathPointEnd = pathSegList.numberOfItems - 1;
            var i, point;
            for (i = pathPointStart; i <= pathPointEnd; i = i + 1) {
                point = pathSegList.getItem(i);
                if (!(i === 0 && (io === "output" || io === undefined)) && !(i === pathPointEnd && (io === "input" || io === undefined))) {
                    point.x = point.x + ix;
                    point.y = point.y + iy;
                }
                if (point.pathSegTypeAsLetter === "C") {
                    point.x1 = point.x1 + ix;
                    point.y1 = point.y1 + iy;
                    point.x2 = point.x2 + ix;
                    point.y2 = point.y2 + iy;
                }
            }
            // This is neccesary to works in IE9
            pathItem.setAttribute("d", pathItem.getAttribute("d"));
        }
        function getVertex(polygonItem) {
            var foundVertex = false;
            var i = 0;
            var j = 1;
            var firstPoint, secondPoint;
            var points = polygonItem.points;
            while (!foundVertex && i < points.numberOfItems - 1) {
                while (!foundVertex && j < points.numberOfItems) {
                    firstPoint = points.getItem(i);
                    secondPoint = points.getItem(j);
                    if (firstPoint.x === secondPoint.x && firstPoint.y === secondPoint.y) {
                        foundVertex = firstPoint;
                    }
                    i = i + 1;
                }
            }
            return foundVertex;
        }
        function movePolygon(polygonItem, pathItem, ix, iy, io) {
            var i;
            var vertex = getVertex(polygonItem);
            var pathSegList = pathItem.pathSegList;
            if (io === "output") {
                for (i = 0; i < polygonItem.points.numberOfItems; i = i + 1) {
                    var point = polygonItem.points.getItem(i);
                    point.x = point.x + ix;
                    point.y = point.y + iy;
                }
            }
        }
        function moveEdge(edgeItem, ix, iy, io) {
            var children = $(edgeItem).children();
            var path = children.filter("path")[0];
            var i;
            movePath(path, ix, iy, io);
            var polygon = children.filter("polygon")[0];
            if (polygon) {
                movePolygon(polygon, path, ix, iy, io);
            }
            var text = children.filter("text")[0];
            if (text) {
                moveTextNode(text, ix, iy);
            }
        }
        function moveEdges(nodeTitle, ix, iy) {
            var edgesInput = getEdges(nodeTitle, "input");
            var edgesOutput = getEdges(nodeTitle, "output");
            edgesInput.each(function (i, edge) {
                moveEdge(edge, ix, iy, "input");
            });
            edgesOutput.each(function (i, edge) {
                moveEdge(edge, ix, iy, "output");
            });
        }
        function move(nodeTitle, ix, iy) {
            moveNode(nodeTitle, ix, iy);
            moveEdges(nodeTitle, ix, iy);
        }
        function removeNode(nodeItem) {
            $(nodeItem).remove();
        }
        function removeEdge(edgeItem) {
            $(edgeItem).remove();
        }
        function remove(nodeItem) {
            var nodeTitle = getTitleOfNode(nodeItem);
            var edges = getEdges(nodeTitle);
            edges.each(function () {
                removeEdge(this);
            });
            removeNode(nodeItem);
        }
        function changeText(item, msg) {
            var textItem = $(item).children("text");
            var currentText = "";
            var path, ellipse, selectedItem, newText;
            if (textItem.length) {
                textItem = textItem[0];
                currentText = textItem.textContent.trim();
            } else {
                textItem = $("text")[0].cloneNode();
                textItem.textContent = "";
                if (item.className.baseVal === "edge") {
                    path = $(item).children("path")[0];
                    selectedItem = path.pathSegList.getItem(path.pathSegList.numberOfItems / 2);
                    $(textItem).attr("x", selectedItem.x);
                    $(textItem).attr("y", selectedItem.y);
                } else {
                    ellipse = $(item).children("ellipse")[0];
                    $(textItem).attr("x", ellipse.cx.baseVal.value);
                    $(textItem).attr("y", ellipse.cy.baseVal.value + ellipse.ry.baseVal.value / 3);
                }
                $(textItem).appendTo(item);
                currentText = "";
            }
            newText = prompt(msg, currentText);
            if (newText !== null) {
                textItem.textContent = newText;
            }
        }
        /* End graph functions */
        /* ToolBar functions */
        function createToolBar(svg) {
            var classToolBar = "jqueryGraphVizToolBar";
            var ul = "<ul class=\"" + classToolBar + "\" >";
            var classEditTexts = "editText";
            var classAddNode = "addNode";
            var liEditText = "<li><a href=\"#editTexts\" class=\"" + classEditTexts + "\"> Edit Texts </a></li>";
            var liAddNode = "<li><a href=\"#add\" class=\"" + classAddNode + "\"> Add Node </a></li>";
            var closeUl = "</ul>";
            $(ul + liEditText + liAddNode + closeUl).insertBefore(svg);
            $("." + classToolBar + " li a." + classEditTexts).click(
                bind(function () {
                    var editable = !$(this.node).hasClass("selected");
                    var newStatus, oldStatus;
                    if (editable) {
                        oldStatus = "movable";
                        newStatus = "editable";
                        $(this.node).parent().addClass("selected");
                        $(this.node).addClass("selected");
                    } else {
                        oldStatus = "editable";
                        newStatus = "movable";
                        $(this.node).parent().removeClass("selected");
                        $(this.node).removeClass("selected");
                    }
                    opts.status = newStatus;
                    var graph = $(this.svg).children("g.graph");
                    var oldClass = graph.attr("class");
                    graph.attr("class", oldClass.replace(oldStatus, newStatus));
                    return false;
                }, {"svg": svg, "link": this})
            );
            $("." + classToolBar + " li a." + classAddNode).click(
                bind(function () {
                    var node = $("g.node")[0].cloneNode();
                    var graph = $(this.svg).children("g.graph");
                    $(node).appendTo(graph);
                    return false;
                }, {"svg": svg, "link": this})
            );
        }
        /* end ToolBar functions */
        /* Util functions */
        function bind(func, attrs) {
            return function () {
                attrs.node = arguments["0"].target;
                return func.apply(attrs, arguments);
            };
        }
        /* end util functions */
        /* Graph Events */
        function getCursorToDrag() {
            if (opts.status === "movable") {
                return opts.dragableCursor;
            }
        }
 
        function singleClick(e) {
            var nodeTitle = getTitleOfNode(this);
            updateTextBoxesWithInstanceValues(nodeTitle,instances.instances);
            updateFrameDetails(nodeTitle,instances.instances);
            getSubFrameDetails(nodeTitle);
 
            getInheritance(nodeTitle);
            getInheritanceDetails(nodeTitle);
            updateConstituentDetails(nodeTitle);
        }
 
        function doubleClick(e) {
        if(flag==0)
        {
            var nodeTitle = getTitleOfNode(this);
            getAdjacencyList(scene_id,corpus_id,nodeTitle);
            flag=1;
        }
        else
        {
            getAdjacencyList(scene_id,corpus_id,'');
            flag=0;
        }
        }
 

 
        this.each(function () {
            var classOld;
            if (opts.statusbar) {
                //createToolBar(this);
            }
            classOld = $(this).children().filter("g.graph").attr("class");
            $(this).children().filter("g.graph").attr("class", classOld + " " + opts.status);
            $(this).children().children("g").each(function () {
                if (this.className.baseVal === "node") {
                                                  
                    $(this).draggable({
                        start: function (event, ui) {
                            if (opts.status === "movable") {
                                this.originalX = event.clientX;
                                this.originalY = event.clientY;
                            }
                        },
                        stop: function (event, ui) {
                            if (opts.status === "movable") {
                                move($(this.childNodes).filter("title")[0].textContent.trim(),
                                     (event.clientX - this.originalX), (event.clientY - this.originalY));
                            }
                        },
                        drag: function (event, ui) {
                            if (opts.status === "movable") {
                                move($(this.childNodes).filter("title")[0].textContent.trim(),
                                    (event.clientX - this.originalX), (event.clientY - this.originalY));
                                this.originalX = event.clientX;
                                this.originalY = event.clientY;
                            }
                        },
                        cursor: getCursorToDrag
                    });

                                                  
                                                  $(this).click(function(e) {
                                                                    var that = this;
                                                                    setTimeout(function() {
                                                                               var dblclick = parseInt($(that).data('double'), 10);
                                                                               if (dblclick > 0) {
                                                                               $(that).data('double', dblclick-1);
                                                                               } else {
                                                                               singleClick.call(that, e);
                                                                               }
                                                                               }, 300);
                                                                    }).dblclick(function(e) {
                                                                                $(this).data('double', 2);
                                                                                doubleClick.call(this, e);
                                                                                });
                                                  
                                            
                                                  
                                                  
                                                  
                                                  
                                                  
                                                  
                                                  
                    
                } else if (this.className.baseVal === "edge") {
                    $(this).draggable({
                        start: function (event, ui) {
                            if (opts.status === "movable") {
                                var path = $(this).children("path")[0];
                                var totalLength = path.getTotalLength();
                                var firstPoint = path.pathSegList.getItem(0);
                                var position = path.getPointAtLength(0).matrixTransform(path.getScreenCTM());
                                if (Math.abs(position.x - event.clientX) + Math.abs(position.y - event.clientY) < totalLength / 10) {
                                    this.io = "input";
                                } else {
                                    this.io = undefined;
                                }
                                this.originalX = event.clientX;
                                this.originalY = event.clientY;
                            }
                        },
                        stop: function (event, ui) {
                            if (opts.status === "movable") {
                                moveEdge(this, (event.clientX - this.originalX), (event.clientY - this.originalY), this.io);
                            }
                        },
                        drag: function (event, ui) {
                            if (opts.status === "movable") {
                                moveEdge(this, (event.clientX - this.originalX), (event.clientY - this.originalY), this.io);
                                this.originalX = event.clientX;
                                this.originalY = event.clientY;
                            }
                        },
                        cursor: getCursorToDrag
                    });
                    $(this).children("polygon").draggable({
                        start: function (event, ui) {
                            if (opts.status === "movable") {
                                this.originalX = event.clientX;
                                this.originalY = event.clientY;
                            }
                        },
                        stop: function (event, ui) {
                            if (opts.status === "movable") {
                                moveEdge($(this).parent(),
                                         (event.clientX - this.originalX), (event.clientY - this.originalY), "output");
                            }
                        },
                        drag: function (event, ui) {
                            if (opts.status === "movable") {
                                moveEdge($(this).parent(),
                                        (event.clientX - this.originalX), (event.clientY - this.originalY), "output");
                                this.originalX = event.clientX;
                                this.originalY = event.clientY;
                            }
                        },
                        cursor: getCursorToDrag
                    });
                    $(this).dblclick(function () {
                        if (opts.status === "movable") {
                            removeEdge(this);
                        } else if (opts.status === "editable") {
                            changeText(this, "Do you want to change the text of the edge?");
                        }
                    });
                }
            });

        });
    /* end Graph Events */
    };
})(jQuery);
