$(function(){
  
  var graph = new NodeGraph();
  var nameMessage = "Enter your file name";
  var filename = $("#filename").val(nameMessage);
  var findTerm = $("#searchval").val();
  // ui code
  loadFile();
  // consider moving to NodeGraph
  $("#canvas").mouseup(function(e){
     //if (openWin.css("display") == "none"){
       var children = $(e.target).children();
       if (children.length > 0){
         var type = children[0].tagName;
         if (type == "desc" || type == "SPAN"){
           graph.addNodeAtMouse();
      //   }
       }
     }
  });


  $(".btn").mouseenter(function(){
    $(this).animate({"backgroundColor" : "white"}, 200);
  }).mouseleave(function(){
    $(this).animate({"backgroundColor" : "#efefef"});
  });



  $("#clear").click(function(){
    $(".node").remove();
    delete graph;
    graph = new NodeGraph;
  });


  $("#help").click(function(){
    window.open("http://www.zreference.com/znode", "_blank");
  });


  $("#save").click(function(){
      saveFile();
  });


  $("#chart").click(function(){
      $("#searchForm").css({"display":"none"});
    $(".node").remove();
    delete graph;
    graph = new NodeGraph;
    loadFile();
  });
  
    $("#sourceview").click(function(){
        $("#searchForm").css({"display":"inline-block"});
        $("#filename").val(nameMessage);
        while($("#codetxt").length > 0){$("#codetxt").remove();}
        graph.viewSource();
    });
    
  $("#inheritanceview").click(function(){
      $("#searchForm").css({"display":"none"});
      $("#filename").val(nameMessage);
      graph.viewInheritance();
  });
  
  $("#functionview").click(function(){
      $("#searchForm").css({"display":"none"});
      $("#filename").val(nameMessage);
      graph.viewFunction();
  });
  
  $("#globalview").click(function(){
      $("#searchForm").css({"display":"none"});
      $("#filename").val(nameMessage);
      graph.viewGlobal();
  });
  
  $("#composotionview").click(function(){
      $("#searchForm").css({"display":"none"});
      $("#filename").val(nameMessage);
      graph.viewComposition();
  });
  
 

  filename.focus(function(){
    if ($(this).val() == nameMessage){
      $(this).val("");
    }
  }).blur(function(){
    if ($(this).val() == ""){
      $(this).val(nameMessage);
    }
  });


  $("#nameForm").submit(function(e){
    e.preventDefault();
    saveFile();
  });
  
  $("#searchForm").submit(function(e){
    e.preventDefault();
    findTerm = $("#searchval").val()
    graph.searchCode(findTerm);
  });

  $(".file").live("click", function() {
    var name = $(this).text();
    $(".node").remove();
    while($("#codetxt").length > 0){$("#codetxt").remove();}
    delete graph;
    graph = new NodeGraph;
    $.getJSON("files/" + name + ".json", {n:Math.random()}, function(data){
       graph.fromJSON(data);
       filename.val(name);
       graph.viewSource();
});  
  }).live("mouseover", function(){
    $(this).css({"background-color": "#ededed"});
  }).live("mouseout", function(){
    $(this).css({"background-color": "white"});
  });

  $(".chartfile .ex").live("click", function() {
    var name = $(this).parent().find(".file").text();
    $.post("json/save.php?",{name:name}, function(){
      alert("Your file was deleted.");
      loadFile();
  });  
});

/***********************************************************************************************************************/
/*
/***********************************************************************************************************************/
    function saveFile(){
    var name = filename.val();
    if (name == "" || name == nameMessage){
      alert("Please Name Your File");
      filename[0].focus();
      return;
    }
    graph.generateMethods();
    graph.generateFields();
    $.post("json/save.php?", {data:graph.toJSON(), name:name}, function(data){
      alert("Your file was saved.");
      loadFile();
    });
  }
/***********************************************************************************************************************/
function loadFile(){
    var fileList =  $("#files");
    fileList.html("<div>loading...<\/div>");
    fileList.load("json/files.php?"+Math.random()*1000000);
}

$('article.tabs section > h3').click(function(){
$('article.tabs section').removeClass('current');
$(this).closest('section').addClass('current');
});

$('#connection section >h3').click(function(){
$('#connection section').removeClass('activeconn');
$(this).closest('section').addClass('activeconn');
});

});
