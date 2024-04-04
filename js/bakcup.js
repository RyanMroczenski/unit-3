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