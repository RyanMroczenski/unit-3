//wrap everything is immediately invoked anonymous function so nothing is in clobal scope
(function (){

    var attrArray = ["Population Growth Rate (average annual %)", "Urban Population (% of total population)", "Fetility Rate", 
                        "Life Expectancy at Birth (females)", "Life Expectancy at Birth (males)", "Health: Current Expenditure (% of GDP)",
                        "Education: Government expenditures (% of GDP)", "International Homicide rate (per 100 000 pop.)"];
    var expressed = attrArray[0]; //initial attribute

    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap(){

    var width = window.innerWidth * 0.5,
    height = 460;

        //create new svg container for the map
        var map = d3
            .select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal area conic projection centered on East and Southeast Asia
        var projection = d3
            .geoAlbers()
            .center([10, 21]) 
            .rotate([-105, 0, 0]) 
            .parallels([5, 30]) 
            .scale(415) 
            .translate([width / 2, height / 2]);

        var path = d3.geoPath().projection(projection);

        //use Promise.all to parallelize asynchronous data loading
        var promises = [d3.csv("data/Data.csv"),                    
                        d3.json("data/countries.topojson"),                    
                        d3.json("data/eastasia.topojson")                   
                        ];    
        Promise.all(promises).then(callback);

        function callback(data) {
            var csvData = data[0], world = data[1], eastasia = data[2];

            setGraticule(map,path);

            
            //translate europe TopoJSON
            var countries = topojson.feature(world, world.objects.ne_50m_admin_0_countries),
                eastasia = topojson.feature(eastasia, eastasia.objects.ne_50m_admin_0_countries).features;

            //add countries to map
            var worldMap = map.append("path")
                .datum(countries)
                .attr("class", "countries")
                .attr("d", path);
            eastasia = joinData(eastasia, csvData);
            var colorScale = makeColorScale(csvData);

            setEnumerationUnits(eastasia,map,path,colorScale);

            //add coordinated visualization to the map
            setChart(csvData, colorScale);

        };

    };

    function setGraticule(map,path){
        var graticule = d3.geoGraticule()
                .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

            //create graticule background
            var gratBackground = map.append("path")
                .datum(graticule.outline()) //bind graticule background
                .attr("class", "gratBackground") //assign class for styling
                .attr("d", path) //project graticule

            //create graticule lines
            var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
                .data(graticule.lines()) //bind graticule lines to each element to be created
                .enter() //create an element for each datum
                .append("path") //append each element to the svg as a path element
                .attr("class", "gratLines") //assign class for styling
                .attr("d", path); //project graticule lines
    }

    function joinData(eastasia, csvData){
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.NAME; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<eastasia.length; a++){

                var geojsonProps = eastasia[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.NAME; //the geojson primary key

                //console.log("CSV Key:", csvKey, "GeoJSON Key:", geojsonKey);

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    console.log(geojsonKey,csvRegion,geojsonProps)
                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
        return(eastasia)
    }

    function makeColorScale(data) {
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043",
            "#4D004B",
            "#810F7C",
            "#88419D"
        ];

        //create color scale generator
        var colorScale = d3.scaleQuantile()
        .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);

        return colorScale;
    }
    
function setEnumerationUnits(eastasia,map,path,colorScale){
    //add Asia to map
var eastasiaMap = map.selectAll(".regions")
    .data(eastasia)
    .enter()
    .append("path")
    .attr("class", function(d){
        return "regions" + d.properties.NAME;
    })
    .attr("d", path)
    .style("fill", function(d){
        var value = d.properties[expressed];
        if(value) {
            return colorScale(d.properties[expressed]);
        } else {
            return "#ccc";
        }
});
}
//function to create coordinated bar chart
function setChart(csvData, colorScale){
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
chartHeight = 460;

//create a second svg element to hold the bar chart
var chart = d3.select("body")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("class", "chart");

 //create a scale to size bars proportionally to frame
var yScale = d3.scaleLinear()
    .range([0, chartHeight])
    .domain([0, 10]);

//Example 2.4 line 8...set bars for each province
var bars = chart.selectAll(".bars")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function(a, b){
        return a[expressed]-b[expressed]
    })
    .attr("class", function(d){
        return "bars " + d.NAME;
    })
    .attr("width", chartWidth / csvData.length - 1)
    .attr("x", function(d, i){
        return i * (chartWidth / csvData.length);
    })
    .attr("height", function(d){
        return yScale(parseFloat(d[expressed]));
    })
    .attr("y", function(d){
        return chartHeight - yScale(parseFloat(d[expressed]));
    }).style("fill", function(d){
        return colorScale(d[expressed]);
    });

//annotate bars with attribute value text
var numbers = chart.selectAll(".numbers")
    .data(csvData)
    .enter()
    .append("text")
    .sort(function(a, b){
        return a[expressed]-b[expressed]
    })
    .attr("class", function(d){
        return "numbers " + d.NAME;
    })
    .attr("text-anchor", "middle")
    .attr("x", function(d, i){
        var fraction = chartWidth / csvData.length;
        return i * fraction + (fraction - 1) / 2;
    })
    .attr("y", function(d){
        return chartHeight - yScale(parseFloat(d[expressed])) + 15;
    })
    .text(function(d){
        return d[expressed];
    })
    //below Example 2.8...create a text element for the chart title
    var chartTitle = chart.append("text")
    .attr("x", 20)
    .attr("y", 40)
    .attr("class", "chartTitle")
    .text("Population Growth Rate (average annual %)");
};

})();