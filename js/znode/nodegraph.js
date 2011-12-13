function NodeGraph(){
  var win = $(window);
  var canvas = $("#canvas");
  var overlay = $("#overlay");
  var currentNode;
  var currentConnection = {};
  var connections = {};
  var nodeFields = {};
  var nodeMethods = {};
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
  var topHeight = $("#controls").height()+14;
  var defaultWidth = 100;
  var defaultHeight = 120;
  var paper = new Raphael("canvas", 500, 500);
  var numM = 0;
  var numF = 0;
  var srczindex = 1;
  var leftPanel = $("#openWin").width();
  var nodecreated = true;
  var conntype = $(".activeconn").text();

  win.resize(resizePaper);
  resizePaper();
  
  /* Adding the extra menu for choosing the node connection direction by clicking shift while dragging
     and is placed at extreme top right and hidden */
  var menu = $("#menu");
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
                  "width" : "40px", "height": "40px", "cursor":"pointer", "font-size": "1px"});

  
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
    mouseX = e.pageX - leftPanel + 5;
    mouseY = e.pageY - topHeight;
    //mouseY = e.pageY;
  }).mouseup(function(e){
    overlay.hide();
    var creatingNewNode = newNode;
    
    //hitConnect.css({"left":mouseX, "top":mouseY + topHeight - 5});
    hitConnect.css({"left":mouseX - 20, "top":mouseY - 20});
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
    hitConnect.css("left", "-100px");
    
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
    
    for (var i in loops){
      clearInterval(loops[i]);
    }
    try{
      if (loops.length > 0) document.selection.empty();
    }catch(e){}
    loops = [];
    
    if (creatingNewNode) currentNode.txt[0].focus();
  });
  //defaultNode();

/***********************************************************************************************************************/
/* NODE CLASS                                                                                                          */
/***********************************************************************************************************************/
  function Node(xp, yp, w, h, noDelete, forceId, classname){
    
    if (forceId){
       nodeId = forceId;
    }
    this.id = nodeId;
    nodes[nodeId] = this;
    nodeId++;
    var curr = this;
    curr.connections = {};
    var connectionIndex = 0;
    curr.name = classname;
    var exists = false;
    if (curr.name == null || curr.name == ""){
        var cn = prompt(" enter class name ");
        if (cn) {
            for(var i in nodes){
                if(nodes[i].name == cn)
                    exists = true;
            }
            if (exists){
        alert("Class already exists.");
        delete nodes[nodeId - 1];
        return;
    }else{curr.name = cn;}
        }else{
            delete nodes[nodeId - 1];
        return;
        }
    }
    
    nodecreated = true;
    var numField = 0;
    var numMethod = 0;
    
    canvas.append("<div class='node'/>");
    var n = $(".node").last();
    n.css({"position" : "absolute", "left" : xp, "top" : yp,"width" : w, 
            "height" : h, "border" : "1px solid black", "background-color" : "gray"});
    n.css("z-index", zindex++);
           
    this.content = n;
    
         
    var nodeWidth = n.width();
    var nodeHeight = n.height();
           
    n.append("<div class='bar'><\/div>");
    var bar = $(".node .bar").last();
    bar.css({"position" : "relative","height" : "10px", "background-color" : "gray","padding" : "0", 
            "margin": "0", "font-size" : "9px", "cursor" : "pointer", "z-index" : 100});

    n.append("<div class='nodeName'>"+curr.name+"<\/div>");
    var nodeName = $(".node .nodeName").last();
    nodeName.css({"position" : "relative","height" : "10px", "color":"white","background-color" : "gray", 
        "text-align":"center","padding" : "0", "margin": "0", "font-size" : "9px", 
        "cursor" : "pointer", "z-index" : 100});

    n.append("<div class='code'>Code<\/div>");
    var code = $(".node .code").last();
    code.css({"position" : "relative","height" : "10px", "color":"white","background-color" : "gray", 
             "padding" : "0", "margin": "0", "font-size" : "9px", "cursor" : "pointer", "z-index" : 100});
             
             
      n.append("<div class='ex'>X<\/div>");
      var ex = $(".node .ex").last();
      ex.css({"position":"absolute","padding-right" : 2, "padding-top" : 1, "padding-left" : 2,
              "color" : "white", "font-family" : "sans-serif", "top" : 0, "left": 0, 
              "cursor": "pointer", "font-size" : "12px", "background-color" : "gray", "z-index" : 100,
          "width":"10px","height":"10px","font-weight":"bold"});
      ex.hover(function(){
        ex.css("color","black");
      }, function(){
        ex.css("color","white");
      }).click(function(){
      
        if (confirm("Are you sure you want to delete this node?")){
          curr.remove();
        }
      });
    n.append("<textarea class='txt' spellcheck='false' />");
    var txt = $(".node .txt").last();
    txt.css({"position" : "relative","width":nodeWidth - 4,"height" : "50px","resize" : "none", "overflow" : "hidden",
             "font-size" : "12px" , "font-family" : "sans-serif", "border" : "none", "z-index" : 100});
          
    this.txt = txt;
    
    n.append("<div class='fields'><div class='fieldtitle'>FIELDS<\/div><div class='fieldmenu'><\/div><\/div>");
    var fields = $(".node .fieldtitle").last();
    
    fields.click(function(){
      var fn = prompt(" enter field name ");
      curr.addField(fn); 
    resizeNode(numField, numMethod);
    });
    
    n.append("<div class='methods'><div class='methodtitle'>METHODS<\/div><div class='methodmenu'><\/div><\/div>");
    var methods = $(".node .methodtitle").last();
    
    methods.click(function(){
      var mn = prompt(" enter method name ");
      curr.addMethod(mn);
    resizeNode(numField, numMethod);
    });
    
    
    n.append("<div class='resizer' />");
    var resizer = $(".node .resizer").last();
    
    resizer.css({"position" : "absolute" , "z-index" : 100,"width" : "10px", 
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
    
    resizeNode(numField, numMethod);
    
    left.mousedown(addLink);
    right.mousedown(addLink);
    top.mousedown(addLink);
        bottom.mousedown(addLink);
    
    resizer.mousedown(function(e){
      currentNode = curr;
      e.preventDefault();
      startDrag(resizer, {left : 100, top : 120, right : 500, bottom : 500},
      function(){
        var loc = resizer.position();
        var x = loc.left;
        var y = loc.top;
        n.css({"width" : x + 11,
               "height" : y + 11});
        
        /*txt.css({"width" : n.width() - 5, "height" : n.height() - bar.height() - 5});*/
        
        positionLeft();
        positionRight();
        positionTop();
        positionBottom();
        updateConnections();
        resizeNode(numField, numMethod);
      });
});
    
    bar.mousedown(function(e){
      currentNode = curr;
      n.css("z-index", zindex++);
      e.preventDefault();
      startDrag(n, {left : 10, top: 10, right : win.width() - n.width() - 10, bottom : win.height() - n.height() - 10},
      updateConnections);
    });
    
    n.mouseenter(function(){
      n.css("z-index", zindex++);
    });


/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    this.addField = function(name){
      if(!name) return;
      var fieldmenu = curr.content.find(".fieldmenu").last();
      for(var i in nodeFields){
          if (nodeFields[i].node == curr.id && nodeFields[i].name == name){
              alert("Field already exists");
              return;
          }
      }
      fieldmenu.append("<div class='subfields'><div class='fieldname'>"+name+"<\/div><div class='closeattr'>x<\/div><\/div>");
      nodeFields[numF] = {"id":numF,"name":name,"node":curr.id};
      ++numField;
      ++numF;
      
      var newfield = fieldmenu.find(".subfields").last();
      var closeattr = fieldmenu.find(".subfields .closeattr").last();
      resizeNode(numField, numMethod);
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
      
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    this.addMethod = function(name){
      if(!name) return;
      var methodmenu = curr.content.find(".methodmenu").last();
      for(var i in nodeMethods){
          if (nodeMethods[i].node == curr.id && nodeMethods[i].name == name){
              alert("Method already exists");
              return;
          }
      }
      methodmenu.append("<div class='submethods'><div class='methodname'>"+name+"<\/div><div class='closeattr'>x<\/div><\/div>");
      nodeMethods[numM] = {"id":numM,"name":name,"node":curr.id};
      ++numMethod;
      ++numM;
      
      var newmethod = methodmenu.find(".submethods").last();
      var closeattr = methodmenu.find(".submethods .closeattr").last();
      resizeNode(numField, numMethod);
      closeattr.hover(function(){
        closeattr.css("color","black");
      }, function(){
        closeattr.css("color","white");
      }).click(function(){
          if (confirm("Are you sure you want to delete this Method?")){
          newmethod.remove();
          --numMethod;
          resizeNode(numField, numMethod);
        }
      });
      
    }
/***********************************************************************************************************************/


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
    function positionLeft(){
      left.css("top", n.height() / 2 - 5);
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function positions the right connector                                                                         */
/***********************************************************************************************************************/
    function positionRight(){
      right.css("left",n.width() + 1).css("top", n.height() / 2 - 5);
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function positions the top connector                                                                           */
/***********************************************************************************************************************/
    function positionTop(){
      top.css("left", n.width() / 2 - 5);
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function positions the bottom connector                                                                        */
/***********************************************************************************************************************/
    function positionBottom(){
      bottom.css("top",n.height() + 1).css("left", n.width() / 2 - 5);
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function creates the corrsponding (left, right, top or bottom) connector                                       */
/***********************************************************************************************************************/
    function setupConnection(div){
      div.css({"position" : "absolute", "width" : "10px", "padding":0,
               "height" : "10px", "background-color" : "#aaaaaa",
               "font-size" : "1px", "cursor" : "pointer"});
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function resizes the node when a new field or method is added                                                  */
/***********************************************************************************************************************/
    function resizeNode(numField, numMethod){
        var nodeHeight = n.height(); 
        var nodeWidth = n.width();
        resizer.css({"top":nodeHeight - 10});
        txt.css({"height":nodeHeight - (70 + (numField + numMethod)*12),"width":nodeWidth - 4});
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
      point.x = nLoc.left + loc.left;
      //point.y = nLoc.top - topHeight + loc.top + 5;
      point.y = nLoc.top + loc.top + 5;
      return point;
    }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function updateConnections(){
       for (var i in curr.connections){
         var c = curr.connections[i];
         if (!c.removed){
           var nodeA = c.startNode.connectionPos(c.startConnection);
           var nodeB = c.endNode.connectionPos(c.endConnection);
           c.attr("path","M " + (nodeA.x + 5) + " " + nodeA.y + " L " + (nodeB.x + 5) + " " + (nodeB.y));
         }
       }
    }
    
    
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function addLink(e){
      nodecreated = false;
      currentNode = curr;
      e.preventDefault();
      showOverlay();
      var link = paper.path("M 0 0 L 1 1");
      link.attr({"stroke-width":4,"fill":"red","stroke":"red","arrow-end":"none-wide-long"});
      currentConnection = link;
      currentConnection.parent = $(this);
      conntype = $(".activeconn").text();			
    if(conntype=="Association") {
        link.attr({"fill":"red","stroke":"red","arrow-end":"none-wide-long"});
        link.connectionType = 1;
    }
    if(conntype=="Inheritance") {
        link.attr({"fill":"blue","stroke":"blue","arrow-end": "block-wide-long"});
        link.connectionType = 2;
    }
    if(conntype=="Composition") {
        link.attr({"fill":"green","stroke":"green","arrow-end":"diamond-wide-long"});
        link.connectionType = 3;
    }
      curr.addConnection(link);
      var loc = $(this).position();
      var nLoc = n.position();
      var x = loc.left + nLoc.left + 5;
      //var y = loc.top + nLoc.top - topHeight + 5;
      var y = loc.top + nLoc.top + 5;
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
    for (i in nodeFields){
       delete nodeFields[i];
    }
    for (i in nodeMethods){
        delete nodeMethods[i];
    }
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* This function clears all the existing nodes and displays the default node.                                          */
/* Also sets the current connection and current node as null                                                           */
/***********************************************************************************************************************/
    this.clearAll = function(){
    clear();
    $(".node").remove();
    nodeId = 0;
    connectionId = 0;
    numM = 0;
    numF = 0;
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
    if (currentNode){
        var w = currentNode.width() || defaultWidth;
        var h = currentNode.height() || defaultHeight; 
    }
    else{
        var w = defaultWidth;
        var h = defaultHeight;
    }
    var temp = new Node(mouseX, mouseY, w, h);
    if(temp == null)currentNode = temp; else currentNode = null;
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

    for (var i in data.nodes){
      var n = data.nodes[i];
      //var ex = (i == "0") ? true : false;
      var temp = new Node(n.x, n.y, n.width, n.height,false, n.id, n.name);
      var addreturns = stripSlashes(n.txt);
      temp.txt.val(addreturns);
    }
    for (i in data.fields){
        nodes[data.fields[i].node].addField(data.fields[i].name);
    }
    for (i in data.methods){
        nodes[data.methods[i].node].addMethod(data.methods[i].name);
    }
    for (i in data.connections){
      var c = data.connections[i];
      createConnection(nodes[c.nodeA], c.conA, nodes[c.nodeB], c.conB, c.type);
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
      json += '"txt" : "' + addSlashes(n.txt.val()) + '", ';
      json += '"name" : "' + n.name + '"},';
    }
      json = json.substr(0, json.length - 1);
      json += '], "fields" : [ ';
    for (i in nodeFields){
       var f = nodeFields[i];
       json += '{"id" : ' + f.id + ', ';
       json += '"name" : "' + f.name + '", ';
       json += '"node" : ' + f.node + '},';
    }
    json = json.substr(0, json.length - 1);
    json += '], "methods" : [ ';
    for (i in nodeMethods){
       var m = nodeMethods[i];
       json += '{"id" : ' + m.id + ', ';
       json += '"name" : "' + m.name + '", ';
       json += '"node" : ' + m.node + '},';
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
      json += '"conB" : "' + c.endConnection.attr("class") + '", ';
      json += '"type" : "' + c.connectionType + '"},';
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
   str = str.replace(/\\/g,'&bkslash;');
   str = str.replace(/\'/g,'&squote;');
   str = str.replace(/\"/g,'&quote;');
   str = str.replace(/\0/g,'&nc;');
   str = str.replace(/\n/g,'&nl;');
   str = str.replace(/{/g,'&obraces;');
   str = str.replace(/}/g,'&cbraces;');
   str = str.replace(/:/g,'&cl;');
   str = str.replace(/,/g,'&cm;');
   str = str.replace(/\t/g,'&tb;');
   return str;
    }
 function stripSlashes(str) {
     str = str.replace(/&bkslash;/g,"\\");
     str = str.replace(/&squote;/g,"\'");
     str = str.replace(/&quote;/g,"\"");
     str = str.replace(/&nc;/g,"\0");
     str = str.replace(/&nl;/g,"\n");
     str = str.replace(/&obraces;/g,"{");
     str = str.replace(/&cbraces;/g,"}");
     str = str.replace(/&cl;/g,":");
     str = str.replace(/&cm;/g,",");
     str = str.replace(/&tb;/g,"\t");
     return str;
 }
 
  function stripSlashes1(str) {
     str = str.replace(/&bkslash;/g,"\\");
     str = str.replace(/&squote;/g,"\'");
     str = str.replace(/&quote;/g,"\"");
     str = str.replace(/&nc;/g,"\0");
     str = str.replace(/&nl;/g,"<br>");
     str = str.replace(/&obraces;/g,"{");
     str = str.replace(/&cbraces;/g,"}");
     str = str.replace(/&cl;/g,":");
     str = str.replace(/&cm;/g,",");
     str = str.replace(/&tb;/g,"\t");
     return str;
 }
 
this.searchCode = function(searchTerm){
     if (!searchTerm){
      alert("Please Enter search value");
      return;
    }
    var regexsearchTerm = new RegExp("<found>", "gi");
    replaceSource(regexsearchTerm,"");
    regexsearchTerm = new RegExp("</found>", "gi");
    replaceSource(regexsearchTerm,"");
    regexsearchTerm = new RegExp(searchTerm, "gi");
    replaceSource(regexsearchTerm,"<found>"+searchTerm+"</found>")
 }
 
 function replaceSource(str1, str2){
     $(".srccode").each(function(){
         var tempcode = $(this).html();
         tempcode = tempcode.replace(str1, str2);
         $(this).html(tempcode);
     })
 }

/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function createConnection(a, conA, b, conB, type){
      var link = paper.path("M 0 0 L 1 1");
      link.attr({"stroke-width":4,"fill":"red","stroke":"red","arrow-end":"none-wide-long"});
    if(type == 1){
      link.attr({"stroke-width":4,"fill":"red","stroke":"red","arrow-end":"none-wide-long"});	
      link.connectionType = 1;
    }
    if(type == 2) {
        link.attr({"fill":"blue","stroke":"blue","arrow-end": "block-wide-long"});
        link.connectionType = 2;
    }
    if(type == 3) {
        link.attr({"fill":"green","stroke":"green","arrow-end":"diamond-wide-long"});
        link.connectionType = 3;
    }
      
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
      //y = pathEnd.y + topHeight - currentNode.height() / 2; 
      y = pathEnd.y - currentNode.height() / 2; 
    }else if (dir == "right"){
      x = pathEnd.x - currentNode.width() - 5;
      //y = pathEnd.y + topHeight - currentNode.height() / 2;
      y = pathEnd.y - currentNode.height() / 2;
    }else if (dir == "top"){
      x = pathEnd.x - currentNode.width() / 2;
      //y = pathEnd.y + topHeight + 5;
      y = pathEnd.y + 5;
    }else if (dir == "bottom"){
      x = pathEnd.x - currentNode.width() / 2;
      //y = pathEnd.y + topHeight - 5 - currentNode.height();
      y = pathEnd.y - 5 - currentNode.height();
    }
      node = new Node(x, y, currentNode.width(), currentNode.height());
    if(nodecreated){
    saveConnection(node, dir);
    currentNode = node;
    }
    else{
        currentConnection.remove();
    }
  }
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
  function saveConnection(node, dir){
    if (!currentConnection) return;
    if (!currentConnection.parent) return;
    
    conntype = $(".activeconn").text();
    currentConnection.startNode = currentNode;
    currentConnection.endNode = node;
    currentConnection.startConnection = currentConnection.parent;
    currentConnection.endConnection = node[dir.toLowerCase()];
    
    if(conntype=="Association") currentConnection.connectionType = 1;
    if(conntype=="Inheritance") currentConnection.connectionType = 2;
    if(conntype=="Composition") currentConnection.connectionType = 3;
    
    currentConnection.id = connectionId;
    connections[connectionId] = currentConnection;
    connectionId++;
    
    currentNode.updateConnections();
    node.addConnection(currentConnection);
    
    currentConnection.mouseover(function(){
      this.attr("stroke-width",6);
    }).mouseout(function(){
      this.attr("stroke-width",4);
    }).click(function(){
      if (confirm("Are you sure you want to delete this connection?")){
        delete connections[this.id];
        this.remove();
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

    this.viewSource = function(){
        var classList = $("#classes");
        while($(".classes").length > 0){$(".classes").remove();}
        for (var i in nodes){
            classList.append("<div class='classes'>"+nodes[i].name+"<\/div>");
        }
    }
        
    
 $(".classes").live("click", function(){
    var name = $(this).text();
    for(i in nodes){
        if (nodes[i].name == name){
            var classCode = addSlashes(nodes[i].txt.val());
        }
    }
    if(classCode){new source(classCode, name);}
  }).live("mouseover", function(){
    $(this).css({"background-color": "#ededed"});
  }).live("mouseout", function(){
    $(this).css({"background-color": "white"});
  });
  
  function source(classCode, name){
    var shown = false;
    if($(".srcclass").length >0 ){
    $(".srcclass").each(function () {
        if ($(this).text() == name){
                //alert("source code already shown");
                shown = true;
        }
    });
    }
    if (!shown){
    $(".current .pane").append("<div id='codetxt'><\/div>");
    var s = $(".current .pane #codetxt").last();
    s.css({"position" : "absolute",      
           "left" : "25px", "top" : "25px",
           "width" : "200px", "height" : "200px",   
           "border" : "1px solid gray",
           "background-color" : "white"});
    s.css("z-index", srczindex++);
    this.content = s;
    var srcHeight = s.height();
    var srcWidth = s.width();
    
    s.append("<div class='srcclass'>"+name+"<\/div>");
    var srcclass = $(".srcclass").last();
    srcclass.css({"height" : "20px","text-align":"center" ,
             "background-color" : "gray", 
             "padding" : "0", "margin": "0","color":"white",
             "font-size" : "12px", "cursor" : "pointer"});
    s.append("<div class='srccode'><p>"+ stripSlashes1(classCode) + "<\/p><\/div>");
    var srccode = $(".srccode").last();
    srccode.css({"position" : "absolute", "width" : "100%",
             "height" : "170px","overflow" : "auto","top":"20px","left":0,
             "font-size" : "12px" , "font-family" : "sans-serif",
             "border" : "none","z-index":4});
    s.append("<div class='srcresizer'><\/div>");
    var srcresizer = $(".srcresizer").last();
    srcresizer.css({"position" : "absolute" , "z-index" : 10,
                 "width" : "10px", "height" : "10px",
                 "left" : srcWidth - 11, "top" : srcHeight - 11,
                 "background-color" : "white", "font-size" : "1px",
                 "border" : "1px solid gray",
                 "cursor" : "pointer"});
             
      s.append("<div class='closex'>X<\/div>");
      var closex = $("#codetxt .closex").last();
      closex.css({"position":"absolute","padding-right" : 2, "padding-top" : 1, "padding-left" : 2,
              "color" : "white", "font-family" : "sans-serif", "top" : 0, "left": 0, 
              "cursor": "pointer", "font-size" : "14px", "background-color" : "gray","font-weight":"bold",
          "width":"10px","height":"10px"});
      
      closex.hover(function(){
        closex.css("color","black");
      }, function(){
        closex.css("color","white");
      }).click(function(){
      
        if (confirm("Are you sure you want to delete this source view ?")){
          $(this).parent().remove();
        }
      });

}
    else{
        return;
    }
    this.width = function(){
      return s.width();
    }
    this.height = function(){
      return s.height();
    }
    
    
    
    srcresizer.mousedown(function(e){
      e.preventDefault();
      startDrag(srcresizer, {left : 50, top : 50, right : 400, bottom : 400},
      function(){
        var loc = srcresizer.position();
        var x = loc.left;
        var y = loc.top;
        s.css({"width" : x + srcresizer.width() + 1,
               "height" : y + srcresizer.height() + 1});
        s.find(".srccode").css({"width": s.width(),"height":s.height() - 30});
      });
    });
    
      srcclass.mousedown(function(e){
      s.css("z-index", srczindex++);
      e.preventDefault();
      startDrag(s, {left : 0, top: 0, right : win.width() - s.width(), bottom : win.height() - s.height()});
    });
    
        s.mouseenter(function(){
      s.css("z-index", srczindex++);
    });
    
  }
  
}