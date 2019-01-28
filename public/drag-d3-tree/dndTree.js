// Get JSON data
/*
treeJSON = d3.json("nodes.json", function (error, treeData) {

});
*/

var treeData = {
    "name": "Root1",
    "nodeNo": 0,
    "value": 1,
    "status": "In",
    "type": "MainNode",
    "mainRoot": "Root1",
    "nodeBefore": "null",
    "linkWidth": 0,
    "children": [{
        "name": "Node1",
        "nodeNo": 1,
        "value": 5,
        "status": "In",
        "type": "Small",
        "mainRoot": "Root1",
        "nodeBefore": "Node1",
        "linkWidth": 10
    }, {
        "name": "Node2",
        "nodeNo": 2,
        "value": 10,
        "status": "In",
        "type": "Medium",
        "mainRoot": "Root1",
        "nodeBefore": "Node2",
        "linkWidth": 15
    }, {
        "name": "Node3",
        "nodeNo": 3,
        "value": 5,
        "status": "Out",
        "type": "Large",
        "mainRoot": "Root1",
        "nodeBefore": "Node3",
        "linkWidth": 50
    }
    ]
};
// Calculate total nodes, max label length
var totalNodes = 0;
var maxLabelLength = 0;
// variables for drag/drop
var selectedNode = null;
var draggingNode = null;
// panning variables
var panSpeed = 200;
var panBoundary = 20; // Within 20px from edges will pan when dragging.
// Misc. variables
var i = 0;
var duration = 750;
var root;

// new node initial values
var newNodeBase = "New";
var newNodeValue = 5;
var nodeNoMax = 10000;
var newNodeStatus = "In";
var newNodeType = "Medium";
var newLinkWidth = 15;

// size of the diagram
var viewerWidth = 900;
var viewerHeight = 500;

var tree = d3.layout.tree()
    .size([viewerHeight, viewerWidth]);

// define a d3 diagonal projection for use by the node paths later on.
var diagonal = d3.svg.diagonal()
    .projection(function (d) {
        return [d.y, d.x];
    });

// A recursive helper function for performing some setup by walking through all nodes

function visit(parent, visitFn, childrenFn) {
    if (!parent) {
        return;
    }

    visitFn(parent);

    var children = childrenFn(parent);
    if (children) {
        var count = children.length;
        for (var j = 0; j < count; j++) {
            visit(children[j], visitFn, childrenFn);
        }
    }
}

// Call visit function to establish maxLabelLength
visit(treeData, function (d) {
    totalNodes++;
    maxLabelLength = Math.max(d.name.length, maxLabelLength);

}, function (d) {
    return d.children && d.children.length > 0 ? d.children : null;
});


// sort the tree according to the node names
function sortTree() {
    tree.sort(function (a, b) {
        return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
    });
}

// Sort the tree initially incase the JSON isn't in a sorted order.
sortTree();

// TODO: Pan function, can be better implemented.

function pan(domNode, direction) {
    var speed = panSpeed;
    if (panTimer) {
        clearTimeout(panTimer);
        translateCoords = d3.transform(svgGroup.attr("transform"));
        if (direction === 'left' || direction === 'right') {
            translateX = direction === 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
            translateY = translateCoords.translate[1];
        } else if (direction === 'up' || direction === 'down') {
            translateX = translateCoords.translate[0];
            translateY = direction === 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
        }
        scaleX = translateCoords.scale[0];
        scaleY = translateCoords.scale[1];
        scale = zoomListener.scale();
        svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
        d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
        zoomListener.scale(zoomListener.scale());
        zoomListener.translate([translateX, translateY]);
        panTimer = setTimeout(function () {
            pan(domNode, speed, direction);
        }, 50);
    }
}

// Define the zoom function for the zoomable tree

function zoom() {
    svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}


// define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

function initiateDrag(d, domNode) {
    draggingNode = d;
    d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
    d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
    d3.select(domNode).attr('class', 'node activeDrag');

    svgGroup.selectAll("g.node").sort(function (a, b) { // select the parent and sort the path's
        if (a.id !== draggingNode.id) {
            return 1;
        } // a is not the hovered element, send "a" to the back
        else {
            return -1;
        } // a is the hovered element, bring "a" to the front
    });
    // if nodes has children, remove the links and nodes
    if (nodes.length > 1) {
        // remove link paths
        links = tree.links(nodes);
        nodePaths = svgGroup.selectAll("path.link")
            .data(links, function (dd) {
                return dd.target.id;
            }).remove();
        // remove child nodes
        nodesExit = svgGroup.selectAll("g.node")
            .data(nodes, function (dd) {
                return dd.id;
            }).filter(function (dd) {
                if (dd.id === draggingNode.id) {
                    return false;
                }
                return true;
            }).remove();
    }

    // remove parent link
    parentLink = tree.links(tree.nodes(draggingNode.parent));
    svgGroup.selectAll('path.link').filter(function (dd) {
        if (dd.target.id === draggingNode.id) {
            return true;
        }
        return false;
    }).remove();

    dragStarted = null;
}

// define the baseSvg, attaching a class for styling and the zoomListener
var baseSvg = d3.select("#tree-container").append("svg")
    .attr("width", viewerWidth)
    .attr("height", viewerHeight)
    .attr("class", "overlay")
    .call(zoomListener);


// Define the drag listeners for drag/drop behaviour of nodes.
dragListener = d3.behavior.drag()
    .on("dragstart", function (dd) {
        if (dd === root) {
            return;
        }
        dragStarted = true;
        nodes = tree.nodes(dd);
        d3.event.sourceEvent.stopPropagation();
        // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
    })
    .on("drag", function (dd) {
        if (dd === root) {
            return;
        }
        if (dragStarted) {
            domNode = this;
            initiateDrag(dd, domNode);
        }

        // get coords of mouseEvent relative to svg container to allow for panning
        relCoords = d3.mouse($('svg').get(0));
        if (relCoords[0] < panBoundary) {
            panTimer = true;
            pan(this, 'left');
        } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

            panTimer = true;
            pan(this, 'right');
        } else if (relCoords[1] < panBoundary) {
            panTimer = true;
            pan(this, 'up');
        } else { // @ts-ignore
            // @ts-ignore
            // @ts-ignore
            if (relCoords[1] > ($('svg').height() - panBoundary)) {
                panTimer = true;
                pan(this, 'down');
            } else {
                // noinspection JSAnnotator
                try {
                    if (panTimer) {
                        clearTimeout(panTimer);
                    }
                } finally {
                    console.log(22);
                }
            }
        }

        dd.x0 += d3.event.dy;
        dd.y0 += d3.event.dx;
        var node = d3.select(this);
        node.attr("transform", "translate(" + dd.y0 + "," + dd.x0 + ")");
        updateTempConnector();
    }).on("dragend", function (dd) {
        if (dd === root) {
            return;
        }
        domNode = this;
        if (selectedNode) {
            // now remove the element from the parent, and insert it into the new elements children
            var index = draggingNode.parent.children.indexOf(draggingNode);
            if (index > -1) {
                draggingNode.parent.children.splice(index, 1);
            }
            if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                if (typeof selectedNode.children !== 'undefined') {
                    selectedNode.children.push(draggingNode);
                } else {
                    selectedNode._children.push(draggingNode);
                }
            } else {
                selectedNode.children = [];
                selectedNode.children.push(draggingNode);
            }
            // Make sure that the node being added to is expanded so user can see added node is correctly moved
            expand(selectedNode);
            sortTree();
            endDrag();
        } else {
            endDrag();
        }
    });

function endDrag() {
    selectedNode = null;
    d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
    d3.select(domNode).attr('class', 'node');
    // now restore the mouseover event or we won't be able to drag a 2nd time
    d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
    updateTempConnector();
    if (draggingNode !== null) {
        update(root);
        centerNode(draggingNode);
        draggingNode = null;
    }
}

// Helper functions for collapsing and expanding nodes.

function collapse(dd) {
    if (dd.children) {
        dd._children = dd.children;
        dd._children.forEach(collapse);
        dd.children = null;
    }
}

function expand(dd) {
    if (dd._children) {
        dd.children = dd._children;
        dd.children.forEach(expand);
        dd._children = null;
    }
}

var overCircle = function (dd) {
    selectedNode = dd;
    updateTempConnector();
};
var outCircle = function (dd) {
    selectedNode = null;
    updateTempConnector();
};

// Function to update the temporary connector indicating dragging affiliation
var updateTempConnector = function () {
    var data = [];
    if (draggingNode !== null && selectedNode !== null) {
        // have to flip the source coordinates since we did this for the existing connectors on the original tree
        data = [{
            source: {
                x: selectedNode.y0,
                y: selectedNode.x0
            },
            target: {
                x: draggingNode.y0,
                y: draggingNode.x0
            }
        }];
    }
    var link = svgGroup.selectAll(".templink").data(data);

    link.enter().append("path")
        .attr("class", "templink")
        .attr("d", d3.svg.diagonal())
        .attr('pointer-events', 'none');

    link.attr("d", d3.svg.diagonal());

    link.exit().remove();
};

// Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

function centerNode(source) {
    scale = zoomListener.scale();
    x = -source.y0;
    y = -source.x0;
    x = x * scale + viewerWidth / 2;
    y = y * scale + viewerHeight / 2;
    d3.select('g').transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
    zoomListener.scale(scale);
    zoomListener.translate([x, y]);
}

// Define a context (popup) menu
var menu = [{
    title: "Rename",
    action: function (elm, dd) {
        var result = prompt('Change the name of the node', dd.name);
        if (result) {
            temp = dd.name;
            dd.name = result;
            update(root);
            centerNode(dd);
        }
        console.log('Renamed node name "' + temp + '" to "' + result + '"');
    }
}, {
    title: 'Add a node',
    action: function (elm, dd) {
        newNodeName = newNodeBase + parseInt(Math.round(10000 * Math.random()), 10);
        var newNode = {
            "name": newNodeName,
            "nodeNo": nodeNoMax,
            "value": newNodeValue,
            "status": newNodeStatus,
            "type": newNodeType,
            "mainRoot": root.name,
            "nodeBefore": dd.name,
            "linkWidth": 15,
            "children": []
//        "parent":d
        };

        /*
              if (!d.children && !d._children)
                {
        //            d3.json("http://xxxx:2222/getChildNodes", function(error,response) {
        //          d.children.forEach(function(child){
                    if (!tree.nodes(d)[0]._children){
                      tree.nodes(d)[0]._children = [];
                    }
                    d.children[0].x = d.x0;
                    d.children[0].y = d.y0;
                    tree.nodes(d)[0]._children.push(newNode);
        //          });
                  if (d.children) {
                    d._children = d.children;
                    d.children = null;
                  }
                  else {
                    d.children = d._children;
                    d._children = null;
                  }
                  update(d);
        //            });
                }
              if (d.children) {
                d._children = d.children;
                d.children = null;
              }
              else {
                d.children = d._children;
                d._children = null;
              }
        */


//Last working?
        var currentNode = tree.nodes(dd);
//      var currentNode = _.where(d.parent.children, {name: d.name});
        //var myJSONObject = {"name": "new Node","children": []};
        console.log("currentNode=");
        console.log(currentNode);

//  if (currentNode.children) curentNode.children.push(newNode); else currentNode.children = [newNode];
//  nodes.push(newNode);
//*
        if (currentNode[0]._children && currentNode[0]._children !== null) {
//window.alert("currentNode[0]._children!==null");
            console.log(currentNode[0]._children);
            currentNode[0]._children.push(newNode);
            console.log("_children !== null");
            console.log(currentNode[0]._children);
            dd.children = dd._children;
            dd._children = null;
        }
        else if (currentNode[0].children && currentNode[0]._children && currentNode[0].children !== null && currentNode[0]._children !== null) {
//window.alert("currentNode[0]._children!==null && currentNode[0]._children!==null");
            currentNode[0].children.push(newNode);
            console.log("(_)children !== null");
            console.log(currentNode[0].children);
        }
        else {
//window.alert("else");
            currentNode[0].children = []; // erases previous children!
            currentNode[0].children.push(newNode);
            currentNode[0].children.x = dd.x0;
            currentNode[0].children.y = dd.y0;
            console.log("children === null");
            console.log(currentNode[0].children);
        }
        ;

        update(root);
        expand(currentNode);
        sortTree();

        /*/
        //console.log("Current node added children: " + currentNode[0].children[0].name);

        /*
        // other way tested, not working
              // repeating the code from moving the dragged node to other parent node ?
                var selectedNode = tree.nodes(d);
                if (typeof selectedNode.children !=== 'undefined' || typeof selectedNode._children !=== 'undefined') {
                  if (typeof selectedNode.children !=== 'undefined') {
                    selectedNode.children.push(newNode);
                  } else {
                    selectedNode._children.push(newNode);
                  }
                } else {
                  selectedNode.children = [];
                  selectedNode.children.push(newNode);
                }

                // Make sure that the node being added to is expanded so user can see added node is correctly moved
        //        tree.links(selectedNode).push(selectedNode[selectedNode.length-1]);

        //      bar1data = [[0,0],[0,0],[0,0]];
        //      tree.links(currentNode).push(currentNode[currentNode.length-1]);
              update(root);
              expand(currentNode);
              sortTree();
        */
        console.log('Inserted a new node to "' + dd.name + '" with a node name "' + newNode.name + '"');
    }
}, {
    title: 'Delete a node',
    action: function (elm, dd) {
        delName = dd.name;
        if (dd.parent && dd.parent.children) { // cannot delete a root
            var nodeToDelete = _.where(dd.parent.children, {name: delName});
            if (nodeToDelete) {
                if (nodeToDelete[0].children !== null || nodeToDelete[0]._children !== null) {
                    if (confirm('Deleting this node will delete all its children too! Proceed?')) {
                        dd.parent.children = _.without(dd.parent.children, nodeToDelete[0]);
                        console.log('Deleted parent node "' + delName + '"');
                        update(root);
                    }
                    else {
//console.log('Cancelled deleting the node "' + delName + '"');
                    }
                }
                else {
                    dd.parent.children = _.without(dd.parent.children, nodeToDelete[0]);
                    console.log('Deleted end node "' + delName + '"');
                }
            }
        }
//      bar1data = [[0,0],[0,0],[0,0]];
        update(root);
    }
}];

// Toggle children function

function toggleChildren(dd) {
    if (dd.children) {
        dd._children = dd.children;
        dd.children = null;
    } else if (dd._children) {
        dd.children = dd._children;
        dd._children = null;
    }
    return dd;
}

// Toggle children on click.

function click(dd) {
    if (d3.event.defaultPrevented) {
        return;
    } // click suppressed
    dd = toggleChildren(dd);
    update(dd);
    centerNode(dd);
}

function update(source) {
    // Compute the new height, function counts total children of root node and sets tree height accordingly.
    // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
    // This makes the layout more consistent.
    var levelWidth = [1];
    var childCount = function (level, n) {

        if (n && n.children && n.children.length > 0) {
            if (levelWidth.length <= level + 1) {
                levelWidth.push(0);
            }

            levelWidth[level + 1] += n.children.length;
            n.children.forEach(function (d) {
                childCount(level + 1, d);
            });
        }
    };
    childCount(0, root);
    var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
    tree = tree.size([newHeight, viewerWidth]);

    // Compute the new tree layout.
    nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Set widths between levels based on maxLabelLength.
    nodes.forEach(function (dd) {
        dd.y = (dd.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
        // alternatively to keep a fixed scale one can set a fixed depth per level
        // Normalize for fixed-depth by commenting out below line
        // d.y = (d.depth * 500); //500px per level.
    });

    // Update the nodes…
    node = svgGroup.selectAll("g.node")
        .data(nodes, function (dd) {
            return dd.id || (dd.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .call(dragListener)
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    nodeEnter.append("circle")
        .attr('class', 'nodeCircle')
        .attr("r", 0)
        .style("fill", function (dd) {
            return dd._children ? "lightsteelblue" : "#fff";
        })
        .on('contextmenu', d3.contextMenu(menu));
    // adding popup dialogue for changing/adding/deleting nodes to circles


    nodeEnter.append("text")
        .attr("x", function (dd) {
            return dd.children || dd._children ? -10 : 10;
        })
        .attr("dy", ".35em")
        .attr('class', 'nodeText')
        .attr("text-anchor", function (dd) {
            return dd.children || dd._children ? "end" : "start";
        })
        .text(function (dd) {
            return dd.name;
        })
        .style("fill-opacity", 0)
        .on('contextmenu', d3.contextMenu(menu));
    // adding popup dialogue for changing/adding/deleting nodes for text captions too


    // phantom node to give us mouseover in a radius around it
    nodeEnter.append("circle")
        .attr('class', 'ghostCircle')
        .attr("r", 30)
        .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
        .attr('pointer-events', 'mouseover')
        .on("mouseover", function (node) {
            overCircle(node);
        })
        .on("mouseout", function (node) {
            outCircle(node);
        });

    // Update the text to reflect whether node has children or not.
    node.select('text')
        .attr("x", function (dd) {
            return dd.children || dd._children ? -10 : 10;
        })
        .attr("text-anchor", function (dd) {
            return dd.children || dd._children ? "end" : "start";
        })
        .text(function (dd) {
            return dd.name;
        });

    // Change the circle fill depending on whether it has children and is collapsed
    node.select("circle.nodeCircle")
        .attr("r", 4.5)
        .style("fill", function (dd) {
            return dd._children ? "lightsteelblue" : "#fff";
        });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (dd) {
            return "translate(" + dd.y + "," + dd.x + ")";
        });

    // Fade the text in
    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function () {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 0);

    nodeExit.select("text")
        .style("fill-opacity", 0);

    // Update the links…
    var link = svgGroup.selectAll("path.link")
        .data(links, function (dd) {
            return dd.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function () {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function () {
            var o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (dd) {
        dd.x0 = dd.x;
        dd.y0 = dd.y;
    });
}

// Append a group which holds all nodes and which the zoom Listener can act upon.
var svgGroup = baseSvg.append("g");

// Define the root
root = treeData;
if (root) {
    root.x0 = viewerHeight / 2;
    root.y0 = 0;
}

// Layout the tree initially and center on the root node.
update(root);
centerNode(root);