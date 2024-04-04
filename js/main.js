//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 850,
        height = 600;

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
        .center([4, 17]) 
        .rotate([-105, 0, 0]) 
        .parallels([5, 30]) 
        .scale(600) 
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/Data.csv"),                    
                    d3.json("data/countries.topojson"),                    
                    d3.json("data/eastasia.topojson")                   
                    ];    
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            world = data[1],
            eastasia = data[2];
            console.log(csvData);
            console.log(world);
            console.log(eastasia);  
            console.log(world.objects);
            
             //translate europe TopoJSON
        var countries = topojson.feature(world, world.objects.ne_50m_admin_0_countries),
            eastasia = topojson.feature(eastasia, eastasia.objects.ne_50m_admin_0_countries).features;

        //variables for data join
        var attrArray = ["Population Growth Rate (average annual %)", "Urban Population (% of total population)", "Fetility Rate", 
                        "Life Expectancy at Birth (females)", "Life Expectancy at Birth (males)", "Health: Current Expenditure (% of GDP)",
                        "Education: Government expenditures (% of GDP)", "International Homicide rate (per 100 000 pop.)"];

        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.NAME; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<eastasia.length; a++){

                var geojsonProps = eastasia[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.NAME; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
        console.log(eastasia)

        var graticule = d3.geoGraticule().step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map
            .append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path); //project graticule

        //create graticule lines
        var gratLines = map
            .selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

         //add countries to map
        var worldMap = map.append("path")
            .datum(countries)
            .attr("class", "countries")
            .attr("d", path);

        //add Asia to map
        var eastasiaMap = map.selectAll(".regions")
            .data(eastasia)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions" + d.properties.NAME;
            })
            .attr("d", path);
    }
}