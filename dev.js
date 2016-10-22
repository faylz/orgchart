 var nodeIdCounter = -1; // use a sequence to guarantee key uniqueness as we add/remove/modify nodes

  function init() {
    if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;  // for conciseness in defining templates

    myDiagram =
      $(go.Diagram, "myDiagramDiv", // must be the ID or reference to div
        {
          initialContentAlignment: go.Spot.Center,
          maxSelectionCount: 1, // users can select only one part at a time
          validCycle: go.Diagram.CycleDestinationTree, // make sure users can only create trees
          layout:
            $(go.TreeLayout,
              {
                treeStyle: go.TreeLayout.StyleLayered,
                arrangement: go.TreeLayout.ArrangementVertical,//ArrangementVertical,ArrangementHorizontal,
                // properties for most of the tree:
                angle: 90,	//树的旋转角度
                layerSpacing: 50,	//节点的间距
                // properties for the "last parents":
                alternateAngle: 90,
                alternateLayerSpacing: 35,
                alternateAlignment: go.TreeLayout.AlignmentBusBranching,
                alternateNodeSpacing: 20
              }),
          "undoManager.isEnabled": true // enable undo & redo
        });

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", function(e) {
      var button = document.getElementById("SaveButton");
      if (button) button.disabled = !myDiagram.isModified;
      var idx = document.title.indexOf("*");
      if (myDiagram.isModified) {
        if (idx < 0) document.title += "*";
      } else {
        if (idx >= 0) document.title = document.title.substr(0, idx);
      }
    });

    // This function is used to find a suitable ID when modifying/creating nodes.
    // We used the counter combined with findNodeDataForKey to ensure uniqueness.
    function getNextKey() {
      var key = nodeIdCounter;
      while (myDiagram.model.findNodeDataForKey(key.toString()) !== null) {
        key = nodeIdCounter -= 1;
      }
      return key.toString();
    }

	
    // This function provides a common style for most of the TextBlocks.
    // Some of these values may be overridden in a particular TextBlock.
    function textStyle() {
      return { font: "9pt  Segoe UI,sans-serif", stroke: "black" };
    }
	
	function groupNodeNameTextStyle() {
      return { font: "16pt  Arial,Microsoft YaHei,黑体,宋体,sans-serif", stroke: "black" };
    }
	function companyNodeNameTextStyle() {
      return { font: "14pt  Arial,Microsoft YaHei,黑体,宋体,sans-serif", stroke: "black" };
    }
	function companyManagerNameTextStyle() {
      return { font: "13pt  宋体,sans-serif", stroke: "red" };
    }
	function positionNameTextStyle() {
      return { font: "12pt   Arial,Microsoft YaHei,黑体,sans-serif", stroke: "black" };
    }
	function positionManagerNameTextStyle() {
      return { font: "12pt  宋体,sans-serif", stroke: "red" };
    }
	function deptNodeNameTextStyle() {
      return { font: "10pt  Arial,Microsoft YaHei,黑体,宋体,sans-serif", stroke: "black" };
    }
	function deptManagerNameTextStyle() {
      return { font: "10pt  宋体,sans-serif", stroke: "red" };
    }
	function deptManagerPositionNameTextStyle() {
      return { font: "10pt  宋体,sans-serif", stroke: "red" };
    }
	function countTextStyle() {
      return { font: "12pt  Arial, Helvetica, sans-serif", stroke: "red" };
    }
    
    // the context menu allows users to make a position vacant,
    // remove a role and reassign the subtree, or remove a department
    myDiagram.nodeTemplate.contextMenu =
      $(go.Adornment, "Vertical",
        $("ContextMenuButton",
          $(go.TextBlock, "Vacate Position"),
          {
            click: function(e, obj) {
              var node = obj.part.adornedPart;
              if (node !== null) {
                var thisemp = node.data;
                myDiagram.startTransaction("vacate");
                // update the key, name, and comments
                myDiagram.model.setKeyForNodeData(thisemp, getNextKey());
                myDiagram.model.setDataProperty(thisemp, "name", "(Vacant)");
                myDiagram.model.setDataProperty(thisemp, "comments", "");
                myDiagram.commitTransaction("vacate");
              }
            }
          }
        ),
        $("ContextMenuButton",
          $(go.TextBlock, "Remove Role"),
          {
            click: function(e, obj) {
              // reparent the subtree to this node's boss, then remove the node
              var node = obj.part.adornedPart;
              if (node !== null) {
                myDiagram.startTransaction("reparent remove");
                var chl = node.findTreeChildrenNodes();
                // iterate through the children and set their parent key to our selected node's parent key
                while(chl.next()) {
                  var emp = chl.value;
                  myDiagram.model.setParentKeyForNodeData(emp.data, node.findTreeParentNode().data.key);
                }
                // and now remove the selected node itself
                myDiagram.model.removeNodeData(node.data);
                myDiagram.commitTransaction("reparent remove");
              }
            }
          }
        ),
        $("ContextMenuButton",
          $(go.TextBlock, "Remove Department"),
          {
            click: function(e, obj) {
              // remove the whole subtree, including the node itself
              var node = obj.part.adornedPart;
              if (node !== null) {
                myDiagram.startTransaction("remove dept");
                myDiagram.removeParts(node.findTreeParts());
                myDiagram.commitTransaction("remove dept");
              }
            }
          }
        )
      );
  
	var groupOrgNodeTemplate =
		$(go.Node, "Auto",
		$(go.Shape, "Rectangle",
          {
            name: "SHAPE", fill: "white", stroke: "blue",strokeWidth: 2, 
		
            // set the port properties:
            portId: "", fromLinkable: true, toLinkable: true, cursor: "pointer"
          }),
			$(go.Panel, "Horizontal",

			  $(go.Panel, "Table",
				{
				  maxSize: new go.Size(400, 999),
				  margin: new go.Margin(15, 5, 10, 5),
				  defaultAlignment: go.Spot.Left
				},
				$(go.RowColumnDefinition, { column: 2, width: 4 }),
				$(go.TextBlock, groupNodeNameTextStyle(),  // the name
				  {
					row: 0, column: 0,
					minSize: new go.Size(10, 16)
				  },
				   new go.Binding("text", "name").makeTwoWay()),
				$(go.TextBlock, "count: ", countTextStyle(),
				  { row: 0, column: 1 ,
					font:"red",
				  },	  
					new go.Binding("text", "count"))
				)  // end Table Panel
			)	
		);
   
	var companyOrgNodeTemplate =
		$(go.Node, "Auto",
		$(go.Shape, "Rectangle",
          {
            name: "SHAPE", fill: "white", stroke: "lightblue",strokeWidth: 2, 
		
            // set the port properties:
            portId: "", fromLinkable: true, toLinkable: true, cursor: "pointer"
          }),
		  $(go.Panel, "Vertical",

			  $(go.Panel, "Table",
				{
				  maxSize: new go.Size(400, 25),
				  margin: new go.Margin(5, 5, 1, 5),
				  defaultAlignment: go.Spot.Center
				},
				$(go.RowColumnDefinition, { column: 2, width: 4 }),
				$(go.TextBlock, companyNodeNameTextStyle(),  // the name
				  {
					row: 0, column: 0,
					minSize: new go.Size(10, 16)
				  },
				   new go.Binding("text", "name").makeTwoWay()),
				$(go.TextBlock, "count: ", countTextStyle(),
				  { row: 0, column: 1 ,
					minSize: new go.Size(10, 16),
				  },	  
					new go.Binding("text", "count"))
				),
			 $(go.Panel, "Table",
				{
				  maxSize: new go.Size(400, 25),
				  margin: new go.Margin(5, 5, 1, 5),
				  defaultAlignment: go.Spot.Center
				},
				$(go.RowColumnDefinition, { column: 3}),
				$(go.TextBlock, companyManagerNameTextStyle(),  // the name
				  {
					row: 0, column: 0,
					minSize: new go.Size(10, 16),
					textAlign:"right"
				  },
				   new go.Binding("text", "manager").makeTwoWay()),
			    $(go.TextBlock,  // the name
				 {
					row: 0, column: 1,
					minSize: new go.Size(5, 5),
					textAlign:"center"
				 }),
				$(go.TextBlock, "count: ", companyManagerNameTextStyle(),
				  { row: 0, column: 2 ,
					minSize: new go.Size(10, 16),
					textAlign:"left"
				  },	  
					new go.Binding("text", "position"))
				)
			)
		 );
	
	
    var managerNodeTemplate =
	   $(go.Node, "Auto",
		$(go.Shape, "Rectangle",
          {
            name: "SHAPE", fill: "orange", stroke: "lightblue",strokeWidth: 2, 
            // set the port properties:
            portId: "", fromLinkable: true, toLinkable: true, cursor: "pointer"
          }),
		  $(go.Panel, "Vertical",

			  $(go.Panel, "Table",
				{
				  maxSize: new go.Size(400, 50),
				 
				  defaultAlignment: go.Spot.Center
				},
				$(go.RowColumnDefinition, { column: 1,row:3}),
				
				$(go.TextBlock, positionNameTextStyle(),  // the name
				  {
					row: 0, column: 0,
					minSize: new go.Size(10, 16),
					margin:new go.Margin(5, 5, 1, 5)
				  },
				   new go.Binding("text", "position").makeTwoWay()),
				    
				$(go.TextBlock, "manager", positionManagerNameTextStyle(),
				  { row: 2, column: 0 ,
					minSize: new go.Size(10, 16),
					margin:new go.Margin(5, 5, 1, 5)
				  },	  
					new go.Binding("text", "manager"))
			   )
			)
			);
	var deptOrgNodeTemplate =
		$(go.Node, "Auto",
		$(go.Shape, "Rectangle",
          {
            name: "SHAPE", fill: "white", stroke: "lightblue",strokeWidth: 2, 
		
            // set the port properties:
            portId: "", fromLinkable: true, toLinkable: true, cursor: "pointer"
          }),
		  $(go.Panel, "Vertical",

			  $(go.Panel, "Table",
				{
				  maxSize: new go.Size(400, 25),
				  margin: new go.Margin(5, 5, 1, 5),
				  defaultAlignment: go.Spot.Center
				},
				$(go.RowColumnDefinition, { column: 2, width: 4 }),
				$(go.TextBlock, deptNodeNameTextStyle(),  // the name
				  {
					row: 0, column: 0,
					minSize: new go.Size(10, 16)
				  },
				   new go.Binding("text", "name").makeTwoWay()),
				$(go.TextBlock, "count", countTextStyle(),
				  { row: 0, column: 1 ,
					minSize: new go.Size(10, 16),
				  },	  
					new go.Binding("text", "count"))
				),
			 $(go.Panel, "Table",
				{
				  maxSize: new go.Size(400, 25),
				  margin: new go.Margin(5, 5, 1, 5),
				  defaultAlignment: go.Spot.Center
				},
				$(go.RowColumnDefinition, { column: 3}),
				$(go.TextBlock, deptManagerNameTextStyle(),  // the name
				  {
					row: 0, column: 0,
					minSize: new go.Size(10, 16),
					textAlign:"right"
				  },
				   new go.Binding("text", "manager").makeTwoWay()),
			    $(go.TextBlock,  // the name
				 {
					row: 0, column: 1,
					minSize: new go.Size(5, 5),
					textAlign:"center"
				 }),
				$(go.TextBlock, "count: ", deptManagerPositionNameTextStyle(),
				  { row: 0, column: 2 ,
					minSize: new go.Size(10, 16),
					textAlign:"left"
				  },	  
					new go.Binding("text", "position"))
				)
			)
		 );
		 
	  
	  // create the nodeTemplateMap, holding three node templates:
	  var templmap = new go.Map("string", go.Node);
	  // for each of the node categories, specify which template to use
	  templmap.add("group", groupOrgNodeTemplate);
	  templmap.add("company", companyOrgNodeTemplate);
	  templmap.add("manager", managerNodeTemplate);
	  templmap.add("dept", deptOrgNodeTemplate);
	  // for the default category, "", use the same template that Diagrams use by default;
	  // this just shows the key value as a simple TextBlock
	  myDiagram.nodeTemplateMap = templmap;

	  
    // define the Link template
    myDiagram.linkTemplate =
      $(go.Link, go.Link.Orthogonal,
        { corner: 0, relinkableFrom: true, relinkableTo: true },
        $(go.Shape, { strokeWidth: 1, stroke: "#000" }));  // the link shape

    // read in the JSON-format data from the "mySavedModel" element
    load();


    // support editing the properties of the selected person in HTML
    if (window.Inspector) myInspector = new Inspector('myInspector', myDiagram,
      {
        properties: {
          'key': { readOnly: true },
          'comments': {}
        }
      });
  }

  // Show the diagram's model in JSON format
  function save() {
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
  }
  function load() {
    myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
  }