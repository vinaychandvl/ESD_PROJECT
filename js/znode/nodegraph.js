function NodeGraph(){
  var win = $(window);
  var canvas = $("#canvas");
  var overlay = $("#overlay");
  var currentNode;
  var currentConnection = {};
  var connections = {};
  var connectionId = 0;
  var newNode;
  var nodes = {};
  var nodeId = 0;
  var mouseX = 0, mouseY = 0;
  var loops = [];
  var pathEnd = {};
  var zindex = 1;
  var hitConnect;
  var key = {};
  var SHIFT = 16;
  var topHeight = $("#controls").height();
  var defaultWidth = 100;
  var defaultHeight = 70;
  var paper = new Raphael("canvas", "100", "100");
  

  win.resize(resizePaper);
  resizePaper();
  
  /* Adding the extra menu for choosing the node connection direction by clicking shift while dragging
     and is placed at extreme top right and hidden */
  canvas.append("<ul id='menu'><li>Left<\/li><li>Right<\/li><li>Top<\/li><li>Bottom<\/li><\/ul>");
  var menu = $("#menu");
  menu.css({"position" : "absolute", "left" : 100, "top" : 0, "z-index" : 5000, 
      "border" : "1px solid gray", "padding" : 0});
  menu.hide();
  
    $("#menu li").hover(function(){
    $(this).css("background-color", "#cccccc");
  },
  function(){
    $(this).css("background-color", "white");
  }).click(function(){
    menu.hide();
    var dir = $(this).text();
    connectNode(dir);
  });
  

  
  /* Adding a hit bar of height and width 10 and placed at extreme top right
     Used to check if user is clicking on the node connectors */
  canvas.append("<div id='hit' />");
  hitConnect = $("#hit");
  hitConnect.css({"position" : "absolute", "left" : 100, "top" : 0, "z-index" : 4000, "border" : "none", 
                  "width" : 10, "height": 10, "cursor":"pointer", "font-size": "1px"});

  
  canvas.mousedown(function(e){
    if (menu.css("display") == "block"){
      if (e.target.tagName != "LI"){
        menu.hide();
        currentConnection.remove();
      }
    }
  });


  $(document).keydown(function(e){
    key[e.keyCode] = true;
  }).keyup(function(e){
    key[e.keyCode] = false;
  });


  $(document).mousemove(function(e){
    mouseX = e.pageX;
    mouseY = e.pageY - topHeight;
  }).mouseup(function(e){
    overlay.hide();
    var creatingNewNode = newNode;
    
    hitConnect.css({"left":mouseX - 5, "top":mouseY + topHeight - 5});
    for (var i in nodes){
      if (nodes[i]){
        var n = nodes[i];
        if (n != currentNode){
          var nLoc = n.content.position();
          if (hitTest(toGlobal(nLoc, n.left), hitConnect)){
            saveConnection(n, "left");
            newNode = false;
            break;
          }else if (hitTest(toGlobal(nLoc, n.top), hitConnect)){
            saveConnection(n, "top");
            newNode = false;
            break;
          }else if (hitTest(toGlobal(nLoc, n.right), hitConnect)){
            saveConnection(n, "right");
            newNode = false;
            break;
          }else if (hitTest(toGlobal(nLoc, n.bottom), hitConnect)){
            saveConnection(n, "bottom");
            newNode = false;
            break;
          }
        }
      }
    }
    
    hitConnect.css({"left" : 100, "top" : 0}); //resetting the hit bar position to extreme top right
    
    if (newNode){
      if (key[SHIFT]){
        menu.css({"left":mouseX - 10, "top":mouseY});
        menu.show();
      }else{
        var dir;
        var currDir = currentConnection.parent.attr("class");
        if (currDir == "left"){
          dir = "right";
        }else if (currDir == "right"){
          dir = "left";
        }else if (currDir == "top"){
          dir = "bottom";
        }else if (currDir == "bottom"){
          dir = "top";
        }
        
        if (pathEnd.x == undefined || pathEnd.y == undefined){
          currentConnection.remove();
        }else{
          connectNode(dir);
        }
      }
    }
    newNode = false;
    
    for (var j in loops){
      clearInterval(loops[j]);
    }
    try{
      if (loops.length > 0) document.selection.empty();
    }catch(e){}
    loops = [];
    
    if (creatingNewNode) currentNode.txt[0].focus();
  });
  
    defaultNode();

  

/***********************************************************************************************************************/
/* NODE CLASS                                                                                                          */
/***********************************************************************************************************************/
  function Node(xp, yp, w, h, noDelete, forceId){
    
    if (forceId){
       nodeId = forceId;
    }
    this.id = nodeId;
    nodes[nodeId] = this;
    nodeId++;
    
    var numField = 0;
    var numMethod = 0;
    
    var curr = this;
    this.connections = {};
    var connectionIndex = 0;
    
    canvas.append("<div class='node'/>");
    var n = $(".node").last();
    n.css({"position" : "absolute", "left" : xp, "top" : yp,"width" : w, 
            "height" : h, "border" : "1px solid gray", "background-color" : "white"});
    n.css("z-index", zindex++);
           
    this.content = n;
    
         
    var nodeWidth = n.width();
    var nodeHeight = n.height();
           
    n.append("<div class='bar'/>");
    var bar = $(".node .bar").last();
    bar.css({"height" : "10px", "background-color" : "gray","padding" : "0", 
            "margin": "0", "font-size" : "9px", "cursor" : "pointer"});

    n.append("<div class='code'>Code<\/div>");
    var code = $(".node .code").last();
    code.css({"height" : "10px", "color":"white","background-color" : "gray", 
             "padding" : "0", "margin": "0", "font-size" : "9px", "cursor" : "pointer"});
             
             
    if (!noDelete){
      n.append("<div class='ex'>X<\/div>");
      var ex = $(".node .ex").last();
      ex.css({"position":"absolute","padding-right" : 2, "padding-top" : 1, "padding-left" : 2,
              "color" : "white", "font-family" : "sans-serif", "top" : 0, "left": 0, 
              "cursor": "pointer", "font-size" : "7px", "background-color" : "gray", "z-index" : 100});
      ex.hover(function(){
        ex.css("color","black");
      }, function(){
        ex.css("color","white");
      }).click(function(){
      
        if (confirm("Are you sure you want to delete this node?")){
          curr.remove();
        }
      });
    }
    
    n.append("<textarea class='txt' spellcheck='false' />");
    var txt = $(".node .txt").last();
    txt.css({"width" :"100%","height" : "10px","resize" : "none", "overflow" : "hidden",
             "font-size" : "12px" , "font-family" : "sans-serif", "border" : "none","z-index":4});
          
    this.txt = txt;
    
    n.append("<div class='attributes'><\/div>");
    
    var attributes = $(".node .attributes").last();
    attributes.append("<div class='fields'><div class='fieldtitle'>FIELDS<\/div><div class='fieldmenu'><\/div><\/div>");
    var fields = $(".node .fieldtitle").last();
    
    fields.click(function(){
      var fieldmenu = $(this).parent().find(".fieldmenu").last();
      fieldmenu.append("<div class='subfields'><div class='fieldname'>fieldName<\/div><div class='closeattr'>x<\/div><\/div>");
      ++numField;
      var newfield = $(this).parent().find(".subfields").last();
      var closeattr = $(this).parent().find(".subfields .closeattr").last();
      
      closeattr.hover(function(){
        closeattr.css("color","black");
      }, function(){
        closeattr.css("color","white");
      }).click(function(){
          if (confirm("Are you sure you want to delete this Field?")){
          newfield.remove();
          --numField;
          resizeNode(numField, numMethod);
        }
      });
       
    resizeNode(numField, numMethod);
    });
    
    attributes = $(".node .attributes").last();
    attributes.append("<div class='methods'><div class='methodtitle'>METHODS<\/div><div class='methodmenu'><\/div><\/div>");
    var methods = $(".node .methodtitle").last();
    
    methods.click(function(){
      var methodmenu = $(this).parent().find(".methodmenu").last();
      methodmenu.append("<div class='submethods'><div class='methodname'>methodName<\/div><div class='closeattr'>x<\/div><\/div>");
      ++numMethod;
      var newmethod = $(this).parent().find(".submethods").last();
      closeattr = $(this).parent().find(".submethods .closeattr").last();

    closeattr.hover(function(){
        closeattr.css("color","black");
      }, function(){
        closeattr.css("color","white");
      }).click(function(){
      
        if (confirm("Are you sure you want to delete this Method?")){
          newmethod.remove();
          --numMethod;
          curr.resizeNode(numField, numMethod);
        }
      });
    curr.resizeNode(numField, numMethod);
    });
    
    
    n.append("<div class='resizer' />");
    var resizer = $(".node .resizer").last();
    
    resizer.css({"position" : "absolute" , "z-index" : 10,"width" : "10px", 
                "height" : "10px", "left" : nodeWidth - 11, "top" : nodeHeight - 11,
                "background-color" : "white", "font-size" : "1px",
                "border" : "1px solid gray","cursor" : "pointer"});
    
    n.append("<div class='left'>");
    n.append("<div class='top'>");
    n.append("<div class='right'>");
    n.append("<div class='bottom'>");
    
    var left = $(".node .left").last();
    left.css("left","-11px");
    
    var top = $(".node .top").last();
    top.css("top","-11px");
    
    var right = $(".node .right").last();
    var bottom = $(".node .bottom").last();
    
    setupConnection(left);
    setupConnection(right);
    setupConnection(top);
    setupConnection(bottom);
    
    positionLeft();
    positionRight();
    positionTop();
    positionBottom();
    
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    
    this.updateConnections = updateConnections;
    
    left.mousedown(addLink);
    right.mousedown(addLink);
    top.mousedown(addLink);
    bottom.mousedown(addLink);
    
    resizer.mousedown(function(e){
      currentNode = curr;
      e.preventDefault();
      startDrag(resizer, {left : 20, top : 20, right : 500, bottom : 500},
      function(){
        var loc = resizer.position();
        var x = loc.left;
        var y = loc.top;
        n.css({"width" : x + resizer.width() + 1,
               "height" : y + resizer.height() + 1});
        
        /*txt.css({"width" : n.width() - 5, "height" : n.height() - bar.height() - 5});*/
        
        positionLeft();
        positionRight();
        positionTop();
        positionBottom();
        updateConnections();
      });
    });
    
    bar.mousedown(function(e){
      currentNode = curr;
      n.css("z-index", zindex++);
      e.preventDefault();
      startDrag(n, {left : 10, top: 40, right : win.width() - n.width() - 10, bottom : win.height() - n.height() - 10},
      updateConnections);
    });
    
    n.mouseenter(function(){
      n.css("z-index", zindex++);
    });

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    this.addConnection = function(c){
      curr.connections[connectionIndex++] = c;
      return c;
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function positions the left connector                                                                          */
/***********************************************************************************************************************/
    this.positionLeft = function(){
      left.css("top", n.height() / 2 - 5);
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function positions the right connector                                                                         */
/***********************************************************************************************************************/
    this.positionRight = function(){
      right.css("left",n.width() + 1).css("top", n.height() / 2 - 5);
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function positions the top connector                                                                           */
/***********************************************************************************************************************/
    this.positionTop = function(){
      top.css("left", n.width() / 2 - 5);
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function positions the bottom connector                                                                        */
/***********************************************************************************************************************/
    this.positionBottom = function(){
      bottom.css("top",n.height() + 1).css("left", n.width() / 2 - 5);
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function creates the corrsponding (left, right, top or bottom) connector                                       */
/***********************************************************************************************************************/
    this.setupConnection = function(div){
      div.css({"position" : "absolute", "width" : "10px", "padding":0,
               "height" : "10px", "background-color" : "#aaaaaa",
               "font-size" : "1px", "cursor" : "pointer"});
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function resizes the node when a new field or method is added                                                  */
/***********************************************************************************************************************/
    this.resizeNode = function(numField, numMethod){
        var nodeHeight = 70 + (numField + numMethod)*12; 
        resizer.css({"top":nodeHeight - 10});
        var loc = resizer.position();
        var x = loc.left;
        var y = loc.top;
        n.css({"width" : x + resizer.width()+2,"height" : y + resizer.height()+2});
        
        positionLeft();
        positionRight();
        positionTop();
        positionBottom();
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    this.connectionPos = function(conn){
      var loc = conn.position();
      var nLoc = n.position();
      var point = {};
      point.x = nLoc.left + loc.left + 5;
      point.y = nLoc.top - topHeight + loc.top + 5;
      return point;
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    this.updateConnections = function(){
       for (var i in curr.connections){
         var c = curr.connections[i];
         if (!c.removed){
           var nodeA = c.startNode.connectionPos(c.startConnection);
           var nodeB = c.endNode.connectionPos(c.endConnection);
           c.attr("path","M " + nodeA.x + " " + nodeA.y + " L " + nodeB.x + " " + nodeB.y);
            
         }
       }
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    this.addLink = function(e){
      currentNode = curr;
      e.preventDefault();
      showOverlay();
      var link = paper.path("M 0 0 L 1 1");
      link.attr({"stroke-width":2});
      currentConnection = link;
      currentConnection.parent = $(this);
      
      curr.addConnection(link);
      var loc = $(this).position();
      var nLoc = n.position();
      var x = loc.left + nLoc.left + 5;
      var y = loc.top + nLoc.top - topHeight + 5;
      newNode = true;
      
      var id = setInterval(function(){
        link.attr("path","M " + x + " " + y + " L " + mouseX + " " + mouseY);
        
        pathEnd.x = mouseX;
        pathEnd.y = mouseY;
      }, 30);
      loops.push(id);
   }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    this.remove = function(){
     for (var i in curr.connections){
       var c = curr.connections[i];
       c.remove();
       delete connections[c.id];
       delete c;
     }
     n.remove();
     delete nodes[curr.id];
   }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function returns the width of the current node                                                                 */
/***********************************************************************************************************************/
    this.width = function(){
      return n.width();
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function returns the height of the current node                                                                */
/***********************************************************************************************************************/
    this.height = function(){
      return n.height();
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*  This function returns the x co-ordinate of the current node                                                        */
/***********************************************************************************************************************/
    this.x = function(){
      return n.position().left;
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function returns the y co-ordinate of the current node                                                         */
/***********************************************************************************************************************/
    this.y = function(){
      return n.position().top;
    }
/***********************************************************************************************************************/

}

/***********************************************************************************************************************/



/***********************************************************************************************************************/
/* This function returns true if block b intersects with block a                                                       */
/***********************************************************************************************************************/
    function hitTest(a, b){
    var aPos = a.position();
    var bPos = b.position();
    
    var aLeft = aPos.left;
    var aRight = aPos.left + a.width();
    var aTop = aPos.top;
    var aBottom = aPos.top + a.height();
    
    var bLeft = bPos.left;
    var bRight = bPos.left + b.width();
    var bTop = bPos.top;
    var bBottom = bPos.top + b.height();
    
// http://tekpool.wordpress.com/2006/10/11/rectangle-intersection-determine-if-two-given-rectangles-intersect-each-other-or-not/
    return !( bLeft > aRight || bRight < aLeft || bTop > aBottom || bBottom < aTop );
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This functions clears all the nodes                                                                                 */
/***********************************************************************************************************************/
    function clear(){
    for (var i in nodes){
      nodes[i].remove();
    }
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function clears all the existing nodes and displays the default node.                                          */
/* Also sets the current connection and current node as null                                                           */
/***********************************************************************************************************************/
    this.clearAll = function(){
    clear();
    nodeId = 0;
    connectionId = 0;
    //defaultNode();
    currentConnection = null;
  }
/***********************************************************************************************************************/
  
/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function addNode(x, y, w, h, noDelete){
    return new Node(x, y, w, h, noDelete);
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    this.addNodeAtMouse = function(){
    //alert("Zevan");
    var w = currentNode.width() || defaultWidth;
    var h = currentNode.height() || defaultHeight;
    var temp = new Node(mouseX, mouseY + 30, w, h);
    currentNode = temp;
    currentConnection = null;
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function defaultNode(){
    
    var temp = new Node(win.width() / 2 - defaultWidth / 2, 
                        win.height() / 2 - defaultHeight / 2,
                        defaultWidth, defaultHeight, true);
    temp.txt[0].focus();
    currentNode = temp;
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function retrieves the data from JSON files                                                                    */
/***********************************************************************************************************************/
    this.fromJSON = function(data){
    this.clearAll();
    for (var i in data.nodes){
      var n = data.nodes[i];
      var ex = (i == "0") ? true : false;
      var temp = new Node(n.x, n.y, n.width, n.height, ex, n.id);
      var addreturns = n.txt.replace(/\\n/g,'\n');
      temp.txt.val(addreturns);
    }
    for (var j in data.connections){
      var c = data.connections[j];
      createConnection(nodes[c.nodeA], c.conA, nodes[c.nodeB], c.conB);
    }
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function saves the data into JSON file                                                                         */
/***********************************************************************************************************************/
    this.toJSON = function(){
    var json = '{"nodes" : [';
    for (var i in nodes){
      var n = nodes[i];
      json += '{"id" : ' + n.id + ', ';
      json += '"x" : ' + n.x() + ', ';
      json += '"y" : ' + n.y() + ', ';
      json += '"width" : ' + n.width() + ', ';
      json += '"height" : ' + n.height() + ', ';
      json += '"txt" : "' + addSlashes(n.txt.val()) + '"},';
    }
    json = json.substr(0, json.length - 1);
    json += '], "connections" : [';
    
    var hasConnections = false;
    for (i in connections){
      var c = connections[i];
      if (!c.removed){
      json += '{"nodeA" : ' + c.startNode.id + ', ';
      json += '"nodeB" : ' + c.endNode.id + ', ';
      json += '"conA" : "' + c.startConnection.attr("class") + '", ';
      json += '"conB" : "' + c.endConnection.attr("class") + '"},';
      hasConnections = true;
      }
    }
    if (hasConnections){
      json = json.substr(0, json.length - 1);
    }
    json += ']}';
    return json;
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function adds slashes into the JSON file                                                                       */
/***********************************************************************************************************************/
    function addSlashes(str) {
        str = str.replace(/\"/g,'\\"');  // this should be the first step
        str = str.replace(/\\/g,'\\\\'); // then this line goes here
        str = str.replace(/\'/g,'\\\'');
        str = str.replace(/\0/g,'\\0');
        str = str.replace(/\n/g,'\\\\n');
        return str;
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function createConnection(a, conA, b, conB){
      var link = paper.path("M 0 0 L 1 1");
      link.attr({"stroke-width":2});
      link.parent = a[conA];
      
      a.addConnection(link);
      currentConnection = link;
      currentNode = a;
      saveConnection(b, conB);
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function resizePaper(){
    paper.setSize(win.width(), win.height() - topHeight);
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function connectNode(dir){
    var node, x, y;
    dir = dir.toLowerCase();
    
    if (dir == "left"){
      x = pathEnd.x + 5;
      y = pathEnd.y + topHeight - currentNode.height() / 2; 
    }else if (dir == "right"){
      x = pathEnd.x - currentNode.width() - 5;
      y = pathEnd.y + topHeight - currentNode.height() / 2;
    }else if (dir == "top"){
      x = pathEnd.x - currentNode.width() / 2;
      y = pathEnd.y + topHeight + 5;
    }else if (dir == "bottom"){
      x = pathEnd.x - currentNode.width() / 2;
      y = pathEnd.y + topHeight - 5 - currentNode.height();
    }
      node = new Node(x, y, currentNode.width(), currentNode.height());
    saveConnection(node, dir);
    currentNode = node;
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function saveConnection(node, dir){
    if (!currentConnection) return;
    if (!currentConnection.parent) return;
    
    currentConnection.startNode = currentNode;
    currentConnection.endNode = node;
    currentConnection.startConnection = currentConnection.parent;
    currentConnection.endConnection = node[dir.toLowerCase()];
    
    currentConnection.id = connectionId;
    connections[connectionId] = currentConnection;
    connectionId++;

    currentNode.updateConnections();
    node.addConnection(currentConnection);
    
    $(currentConnection.node).mouseenter(function(){
      this.raphael.attr("stroke","#FF0000");
    }).mouseleave(function(){
      this.raphael.attr("stroke","#000000");
    }).click(function(){
      if (confirm("Are you sure you want to delete this connection?")){
        this.raphael.remove();
        delete connections[this.raphael.id];
      }
    });
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function returns the position of the left, right, top or bottom connectors                                     */
/* as indicated by "c" of the node "np"                                                                                */
/***********************************************************************************************************************/
    function toGlobal(np, c){
    var l = c.position();
    return {position : function(){ return {left: l.left + np.left, top : l.top + np.top}; },
            width : function(){ return c.width(); },
            height : function(){ return c.height(); }};
  }
/***********************************************************************************************************************/


/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function showOverlay(){
    overlay.show();
    overlay.css({"width" : win.width(), "height" : win.height()}); //, "opacity": 0.1});
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function startDrag(element, bounds, dragCallback){
    showOverlay();
    var startX = mouseX - element.position().left;
    var startY = mouseY - element.position().top;
    if (!dragCallback) dragCallback = function(){};
      var id = setInterval(function(){
      var x = mouseX - startX;
      var y = mouseY - startY;
      if (bounds){
        if (x < bounds.left) x = bounds.left;
        if (x > bounds.right) x = bounds.right;
        if (y < bounds.top) y = bounds.top;
        if (y > bounds.bottom) y = bounds.bottom;
      }
      element.css("left", x).css("top",y);
      dragCallback();
    },topHeight);
    loops.push(id);
  }
/***********************************************************************************************************************/


}