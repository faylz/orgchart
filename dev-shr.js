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
	
	function textStyle() {
      return { font: "12pt  宋体,sans-serif", stroke: "red" };
    }
	function managerNameStyle(){
	  return { font: " bolder 12pt  宋体,sans-serif",stroke: "black",textAlign:"left" };	
	}
  	function findHeadShot(key) {
      if (key < 0 || key > 16) return "images/HSnopic.png"; // There are only 16 images on the server
      return "images/HS" + key + ".png"
    }
    myDiagram.nodeTemplate  =
	   $(go.Node, "Auto",
		   $(go.Shape, "RoundedRectangle",
			  {
				name: "SHAPE", fill: "lightblue", stroke: null,
				// set the port properties:
				portId: "", fromLinkable: true, toLinkable: true, cursor: "pointer"
			  }
			),
			$(go.Panel, "Vertical",
			{maxSize: new go.Size(150, 450),
			 margin: new go.Margin(5, 0, 5, 0)},
			
			$(go.Panel, "Horizontal",
				{ margin: new go.Margin(5, 0, 5, 0),
					
				},
				$(go.Panel, "Table",
					{
						defaultAlignment: go.Spot.Left
					},
					$(go.RowColumnDefinition, { column: 1 }),
					$(go.Picture,
						{
						  name: 'Picture',
						  desiredSize: new go.Size(60, 75),
						  margin: new go.Margin(5, 5, 5, 5),
						  row: 0, column: 0, columnSpan: 5
						},
						new go.Binding("source", "key", findHeadShot))),//end table
				$(go.Panel, "Table",
					{
						desiredSize:new go.Size(15,10),
						defaultAlignment: go.Spot.Center
					},
					$(go.RowColumnDefinition, { column: 1}),
					$(go.Panel,
						{ height: 10 },  // always this height, even if the TreeExpanderButton is not visible
						$("TreeExpanderButton"))) // end Table Panel
			), 
			  
			  
				// define the panel where the text will appear
		       $(go.Panel, "Table",
				{
				  maxSize: new go.Size(120, 999),
				  margin: new go.Margin(5, 10, 5, 10),
				  defaultAlignment: go.Spot.Left
				},
				$(go.RowColumnDefinition, { column: 1, width: 4 }),
				$(go.TextBlock, managerNameStyle(),  // the name
				  {
					row: 0, column: 0, columnSpan: 5,
					isMultiline: true,
					minSize: new go.Size(10, 16),
					alignment: go.Spot.Left
				  },
				  new go.Binding("text", "name").makeTwoWay())),  // end Table Panel
				 
				$(go.Shape, "LineH",
				  {
					name: "SHAPE",  // named so that the above properties can refer to this GraphObject
					width: 100, height: 1,
					stroke: "gray",
					fill: null,
					strokeWidth: 1,
					cursor: "pointer"
				  })// end Table Panel
			) // end Vertical Panel
		
		);//end node
			
	
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