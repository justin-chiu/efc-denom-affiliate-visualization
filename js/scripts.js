// Data variables

let dataSrc,
    dimensions,
    dataInfo,
    masterData,
    categories,
    vizNodes,
    vizLinks;

// D3 variables

let forceLayout,
    svgNode,
    svgLink,
    svgWidth,
    svgHeight,
    chartLabel;

// DOM elements
const viz = document.querySelector("#denom-affiliate-viz");
const chartSVG = viz.querySelector("#viz-chart-svg");
const captionA = viz.querySelector("#caption-a");
const captionB = viz.querySelector("#caption-b");

// D3 elements
const labelsD3 = d3.select("#viz-chart-labels");
const svgD3 = d3.select("#viz-chart-svg");


dataSrc = { // Data sources
    url: "https://docs.google.com/spreadsheets/d/1uO3PUyP6WnctX-DMGOTsI3jMxcMgy297lz-TjiVYL3s/edit#gid=0",
    sheetName: "Combined"
}

dimensions = { // which columns of spreadsheet to use for viz
    cat: "Faith Traditions", // category
    num: "Congregations", // number
    name: "Name (Display)" // display name
}

dataInfo = new Object(); // stores properties relating to entire masterData array

/* masterData obj custom properties
    {
        id: "aff-" | "cat-" | "origin"
        type: "ghost" | "affiliate" | "category" | "origin"
    }
*/






// ------MAIN FUNCTIONS------

function fetchStartViz(apiURL) { // fetch JSON via URL
    fetch(apiURL)
        .then(response => response.json())
        .then(response => runViz(console.log(response)));
}

function startViz(path) { // takes relative path to CSV file, reads and returns data as array of data objects

    let data = new Array();

    d3.csv("../denom-affiliate-data.csv", function(d) {
        data.push(d);
    });

    console.log(data);
    runViz(data);
}

function runViz(data) { // sets property values for masterData

    masterData = formatData(data);
    vizNodes = populateNodes(masterData);
    vizLinks = populateLinks(masterData);

    setSVGDimensions(chartSVG);
    defineViz(); // defines viz forceLayout, nodes, and links...then runs forceLayout
    captionDefault();
}






// ------UTILITY------

function deleteChar(str, chars = [","], from = "end") { // delete chars from start/end of string

    // str == string to delete from
    // chars == array of characters to delete
    // from == delete from "start" or "end"

    for (let i = 0; i < chars.length; i++) {
        if (from == "end") { // delete from end
            if (str[str.length - 1] == chars[i]) {
                str = str.substring(0, str.length - 1);
            }
        } else if (from == "start") { // delete from start
            if (str[0] == chars[i]) {
                str = str.substring(1, str.length);
            }
        }
    }

    return str;
}

function orderArray(array, dimension = dimensions.num, reverse = false) { // false returns array with items ordered largest to smallest

    const compareFunction = compareByDimension(dimension); // get a compare function for specified dimension

    array.sort(compareFunction);

    if (reverse) {
        data.reverse();
    }

    return array;
}

function compareByDimension(dimension) { // returns a compare function for Array.sort()

    return function (objA, objB) { // compare function for Array.sort()

        const sortBy = dimension; // which dimension to sort by

        const valueA = objA[sortBy];
        const valueB = objB[sortBy];

        let compare = 0; // both values are equal

        if (valueA > valueB) {
            compare = 1;
        } else if (valueA < valueB) {
            compare = -1;
        }

        return compare;
    }
} // for reference: https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/

function orderArrayRandom(array) { // randomize order of array items
    let itemsLeft = array.length;

    while (itemsLeft !== 0) {
        const randIndex = Math.floor(Math.random() * itemsLeft); // get random index of item
        itemsLeft--;

        const tempItem = JSON.parse(JSON.stringify(array[itemsLeft])); // get last item

        // switch random item and last item
        array[itemsLeft] = array[randIndex];
        array[randIndex] = tempItem;
    }

    return array;
}

function radiusCircle(area) {
    return Math.sqrt(area / Math.PI);
}

function newElement(tag, classList, id) {

    const element = document.createElement(tag);

    if (classList) {
        element.setAttribute("class", classList);
    }

    if (id) {
        element.setAttribute("id", id);
    }

    return element;
}

function commaNumber(num) { // add commas to large numbers
    num = num.toString();
    const digits = num.length;
    let commasAdded = 0;

    for (let i = 0; i < digits; i++) {
        if (i % 3 == 0 && i !== 0) {
            const numA = num.substring(0, digits - i);
            const numB = num.substring(digits - i, digits + commasAdded);

            num = numA + "," + numB;
            commasAdded++;
        }
    }

    return num;
}



// ------DATA/BACK-END------

// Fetch data and build data objs

function getAPI_URL(dataSrcURL, sheetName) // google sheet URL, sheet name
{
    const apiBaseDomain = "https://opensheet.elk.sh";
    const fileID = dataSrcURL.substring // get file ID string between /d/ and /edit in google sheet URL
        (
            dataSrcURL.indexOf("/d/") + 3,
            dataSrcURL.indexOf("/edit")
        );

    return apiBaseDomain + "/" + fileID + "/" + sheetName;
}

function formatData(data) { // sorts and formats data objects, returns sorted/formatted array

    for (let i = 0; i < data.length; i++) { // for each data object

        // convert "#N/A" and "" to "Other"
        data[i][dimensions.cat] = data[i][dimensions.cat].replace("#N/A", "Other");
        if (data[i][dimensions.cat] == "") {
            data[i][dimensions.cat] = "Other";
        }

        // convert categories (faith traditions) to array
        data[i][dimensions.cat] = deleteChar(data[i][dimensions.cat]);
        data[i][dimensions.cat] = data[i][dimensions.cat].split(",");

        // convert numbers (congregations) to float
        data[i][dimensions.num] = parseFloat(data[i][dimensions.num]);

        // count total congregations
        if (!dataInfo[dimensions.num]) {dataInfo[dimensions.num] = 0;}
        dataInfo[dimensions.num] += data[i][dimensions.num];

        // designate as affiliate node
        data[i]["type"] = "affiliate";
    }

    data = orderArray(data); // order data from least to greatest number (congregations) count

    for (let i = 0; i < data.length; i++) { // assign ID to all data objects
        data[i].id = "aff-" + i;
    }

    return data;
}

function populateNodes(data, randomOrder = false) {

    let nodes = JSON.parse(JSON.stringify(data)); // set nodes as copy of data

    makeCategories(data);
    segmentCategories(3);

    for (let i = 0; i < categories.length; i++) { // add category (faith tradition) objects to nodes array

        let catNode = {
            id: "cat-" + categories[i].name,
            type: "category",
            segment: categories[i].segment
        }

        catNode[dimensions.num] = 0;
        catNode[dimensions.cat] = [categories[i].name];

        nodes.push(catNode); // add category node to list of all nodes
    }

    nodes.push({ // add central node
        id: "origin",
        type: "origin",
        "Congregations": 0
    });

    if (randomOrder) { // randomize node order
        nodes = orderArrayRandom(nodes);
    }

    return nodes;

}

function makeCategories(data) { // create category objects for nodes

    let catSet = new Set(); // list of unique categories
    categories = new Array(); // global categories array
    let nodesAdded = 0; // counter

    for (let j = 0; j < data.length; j++) { // for every data obj

        let newCat = data[j][dimensions.cat];

        for (let k = 0; k < newCat.length; k++) { // for each categpry (faith tradition) in data obj

            if (catSet.has(newCat[k])) { // if category already in set

                let catObj = categories.find(element => element.name == newCat[k]);
                catObj.count++; // add to affiliates count
                catObj[dimensions.num] += data[j][dimensions.num];

            } else { // if category not in set

                let catObj = {name: newCat[k], count: 1}
                catObj[dimensions.num] = data[j][dimensions.num];

                categories.push(catObj); // create a category object
            }

            catSet.add(newCat[k]); // add category to set

            /* // GHOST NODES

            if (newCat.length > 1) { // if multiple categories (faith traditions)
                ghostNode(data[j], j, k, nodesAdded); // create ghostNode
                nodesAdded++; // how many ghost nodes were added
            }

            */
        }
    }
}

function segmentCategories(segments, remainder = "largest_segment") { // split categories into groups

    // order categories from least to greatest
    categories = orderArray(categories, "count");

    let perSegment = Math.floor(categories.length / segments); // how many items per segment based on array length

    for (let i = 0; i < categories.length; i++) {

        for (let j = 0; j < segments; j++) {
            if ((i < perSegment * (j + 1)) && (i >= perSegment * j)) {

                categories[i].segment = j; // set segment for item

            } else if (i >= perSegment * segments) { // for remainder items

                if (remainder == "largest_segment") { // put remainder items in the last segment
                    categories[i].segment = segments - 1;
                } else { // put remainder items in the first segment
                    categories[i].segment = 0;
                }
            }
        }
    }
}

function populateLinks(data, dimension = dimensions.cat) {

    let links = new Array();

    // every cat is linked to origin node

    for (let i = 0; i < categories.length; i++) {

        let newLink = new Object();
        newLink.source = "origin";
        newLink.target = "cat-" + categories[i].name;
        newLink[dimensions.cat] = categories[i].name;
        newLink.type = "category";

        links.push(newLink);
    }

    // every aff is linked to one or more cat nodes

    for (let i = 0; i < data.length; i++) {

        for (let j = 0; j < data[i][dimensions.cat].length; j++) {

            let newLink = new Object();
            newLink.source = "cat-" + data[i][dimensions.cat][j];
            newLink.target = data[i].id;
            newLink[dimensions.cat] = data[i][dimensions.cat][j];

            links.push(newLink);
        }
    }

    return links;
}






// ------FRONT-END------

function setSVGDimensions(svg) // svg == element for which we are setting the width and height attributes
{
    var w, h;

    w = svg.parentElement.clientWidth;
    h = svg.parentElement.clientHeight;

    svg.setAttribute("width", w);
    svg.setAttribute("height", h);

    svgWidth = w;
    svgHeight = h;
}

function defineViz() {

    // defining d3 force simulation
    forceLayout = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) { // links attract
            return d.id;
        })
            .strength(1 / 3)
        )
        .force("charge", d3.forceManyBody() // nodes repel each other
            .strength(-500)
        )
        .force("collision", d3.forceCollide() // nodes repel if touching
            .radius(function (d) {
                return d.radius;
            })
        )
        .force("y", d3.forceY(function(d) { // nodes attracted to y-value
            switch (d.type) {
                case "origin": return svgHeight * 0.9;
                case "category": 
                    switch (d.segment) { // different y-value for categories depending on segment
                        case 0: return svgHeight * 0.3;
                        case 1: return svgHeight * 0.3;
                        case 2: return svgHeight * 0.1;
                    }
                case "affiliate": 
                    if (d[dimensions.cat].length < 2) {
                        let thisCat = categories.find(element => element.name == d[dimensions.cat][0]);
                        switch (thisCat.segment) { // different y-value for affiliates depending on category
                            case 0: return svgHeight * 0.2;
                            case 1: return svgHeight * 0.1;
                            case 2: return svgHeight * 0.1;
                        }
                    } else {
                        return svgWidth * 0.2;
                    }
            }
        }).strength(function(d) { // different force strength depending on type
            switch (d.type) {
                case "origin": return 2;
                case "category": return 0.1;
                case "affiliate": return 0.1;
            }
        })
        )
        .force("radial", d3.forceRadial() // nodes attracted to a circular path
            .x(svgWidth / 2)
            .y(svgHeight / 2)
            .radius(function (d) { // different-sized circular path depending on type
                switch (d.type) {
                    case "origin": return 0;
                    case "category": return 100;
                    case "affiliate": return 300;
                }
            })
        )
        ;

    // drawing links
    svgLink = svgD3.append("g").classed("group-links", true) // put all links in a <g>
        .selectAll("line")
        .data(vizLinks)
        .enter().append("line")
        .attr("class", function (d) {
            let classString = "chart-link"; // all links have this class

            if (d.type) {
                classString += " " + d.type; // add link type as class
            }

            if (d[dimensions.cat]) {
                classString += " " + d[dimensions.cat]; // add link category as class
            }

            return classString;
        });

    // drawing nodes
    const pointRadius = 5; // min. circle size

    svgNode = svgD3.append("g").classed("group-nodes", true) // put all nodes in a <g>
        .selectAll("g")
        .data(vizNodes)
        .enter().append("g") // each node has own <g>
        .classed("chart-node", true) // all nodes have this class
        .attr("class", function (d) {
            let classString = "chart-node";
            if (d.type) {
                classString += " " + d.type; // add node type as class
            }

            if (d[dimensions.cat]) {
                for (let i = 0; i < d[dimensions.cat].length; i++) {
                    classString += " " + d[dimensions.cat][i]; // add node category as class
                }
            }

            return classString;
        })
        .attr("id", function (d) {
            return d.id; // add node ID as id attribute
        });

    svgNode.append("circle") // add a second circle
        .attr("class", "size") // circle type: size
        .attr("r", function(d) { // area of circle depends on dimensions.num (Congregataions)
            if (d.type == "affiliate") {
                return radiusCircle(d[dimensions.num]) * 2.5 + pointRadius;
            }
        })

    svgNode.append("circle") // every node has the same point circle in the middle
        .attr("class", "point") // circle type: point
        .attr("r", function(d) {
            if (d.type == "affiliate") {
                return pointRadius;
            } else {
                return pointRadius;
            }
        });

    chartLabel = labelsD3.selectAll(".chart-label")
        .data(vizNodes)
        .enter().append("div")
        .attr("class", function(d) {
            let classString = "chart-label";

            if (d.type == "category") {
                classString += " " + "label-true";
            }

            return classString;
        })
        .text(function(d) {
            if (d.type == "category") {
                return d[dimensions.cat][0];
            }
        })
        ;

    // start force layout

    forceLayout
        .nodes(vizNodes).on("tick", ticked);
    forceLayout.force("link")
        .links(vizLinks);
}

function ticked() {

    let xStretch = 1.8; // stretch the diagram
    let xOffset = svgWidth / 2;

    svgLink
        .attr("x1", function (d) {
            return (d.source.x - (svgWidth / 2)) * xStretch + xOffset; // stretch added
        })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) {
            return (d.target.x - (svgWidth / 2)) * xStretch + xOffset; // stretch added
        })
        .attr("y2", function (d) { return d.target.y; });

    svgNode
        .select(".point") // acts inside <g> on circle with class "point"
        .attr("cx", function (d) {
            return (d.x - (svgWidth / 2)) * xStretch + xOffset;
        })
        .attr("cy", function (d) {
            return d.y;
        });

    svgNode
        .select(".size") // acts inside <g> on circle with class "size"
        .attr("cx", function (d) {
            return (d.x - (svgWidth / 2)) * xStretch + xOffset;
        })
        .attr("cy", function (d) {
            return d.y;
        });

    chartLabel
        .attr("style", function(d) {
            
            let styleString = "";

            const xVal = (d.x - (svgWidth / 2)) * xStretch + xOffset;
            const yVal = d.y;

            styleString += "left:" + xVal + "px;";
            styleString += "top: " + yVal + "px;";

            return styleString;
        });
}




// ------INTERACTIONS------

// whether elements have been created
let fullScreen = false;
let catCaption = false; // category caption created?
let affCaption = false; // affiliate caption created?

function captionDelete() { // delete all caption elements except containers
    captionA.innerHTML = "";
    captionB.innerHTML = "";
    catCaption = false;
    affCaption = false;
}

function captionDefault() { // create and populate default caption
    
    captionDelete();

    // caption A

    const affCountNum = newElement("div", "caption-heading xl small-caps"); // number of nodes (affiliates) in xl text
    affCountNum.innerText = masterData.length;

    const affCountText = newElement("div", "caption-text bold"); // the text "denomination affiliates" next to digits
    affCountText.innerHTML = "denomination<br>affiliates";

    const captionFlex = newElement("div", "caption-flex"); // container for flex layout
    captionFlex.append(affCountNum);
    captionFlex.append(affCountText);

    captionA.append(captionFlex); // add to existing container

    // caption B

    const catCountNum = newElement("span", "caption-text bold"); // bold digits for category (faith traditions) count
    catCountNum.innerText = categories.length; // NEED TO SUBTRACT "Other" category

    const catCountText = newElement("div", "caption-text"); // category (faith traditions) count and text
    catCountText.append(catCountNum);
    catCountText.innerHTML += " faith traditions";

    const congCountNum = newElement("span", "caption-text bold"); // bold digits for congregation count
    congCountNum.innerText = commaNumber(dataInfo[dimensions.num]); // CALCULATE # of congregations
    
    const congCountText = newElement("div", "caption-text"); // congregation count and text
    congCountText.append(congCountNum);
    congCountText.innerHTML += " total congregations";

    captionB.append(catCountText); // add to existing container
    captionB.append(congCountText);
}

function captionCategory(catObj) { // takes category object, creates and populates category caption
    
    captionDelete();

    // caption A

    const catSquare = newElement("div", "color-square heading-size"); // color square for category
    // catSquare.style.backgroundColor = catObj.color;

    const catHeading = newElement("div", "caption-heading lg"); // category name in heading
    catHeading.innerText = catObj.name;

    captionA.append(catSquare);
    captionA.append(catHeading);

    // caption B

    const catSubHead = newElement("div", "caption-subhead-caps");
    catSubHead.innerText = "Faith Tradition";

    // how many affiliates in category
    const catAffNum = newElement("span", "caption-text bold");
    catAffNum.innerText = catObj.count;
    const catAffText = newElement("div", "caption-text");
    catAffText.append(catAffNum);
    catAffText.innerHTML += " affiliates";

    // how many congregations in category
    const catCongNum = newElement("span", "caption-text bold");
    catCongNum.innerText = catObj[dimensions.num];
    const catCongText = newElement("div", "caption-text");
    catCongText.append(catCongNum);
    catCongText.innerHTML += " total congregations";

    captionB.append(catSubHead);
    captionB.append(catAffText);
    captionB.append(catCongText);
}

function captionAffiliate(dataObj) { // takes affiliate data object, creates and populates affiliate caption

    captionDelete();
    
    // caption A

    const affHeading = newElement("div", "caption-heading md");
    affHeading.innerText = dataObj[dimensions.name];

    captionA.append(affHeading);

    // caption B

    const affSubHead = newElement("div", "caption-subhead-caps");
    affSubHead.innerText = "Affiliate";

    const affCongNum = newElement("span", "caption-text bold");
    affCongNum.innerText = dataObj[dimensions.num];

    const affCongText = newElement("div", "caption-text");
    affCongText.append(affCongNum);
    affCongText.innerHTML += " congregations";

    captionB.append(affSubHead);
    // captionB.append (
    //     captionAffCats(dataObj[dimensions.cat])
    // );


}

function captionAffCats(affCats) { // takes dataObj dimensions.cat property

    const catContainer = newElement("div"); // container for all category references

    for (let i = 0; i < affCats.length; i++) { // for each of dataObj's categories

        const thisCat = categories.find(element => element.name == affCats[i]); // find category object

        const catSquare = newElement("div", "color-square text-size");
        // catSquare.style.backgroundColor = thisCat.color;

        const catName = newElement("div", "caption-text");
        catName.innerText = thisCat.name;
        
        const catRef = newElement("div", "caption-flex");
        catRef.append(catSquare);
        catRef.append(catName);

        catContainer.append(catRef);
    }

    return catContainer;
}

function focusNothing() {

}

function focusCategory() {

}

function focusAffiliate() {

}

function resetViz() {

}

function toggleFullScreen() {

}





// ------EVENT LISTENERS------

window.onload = function () {

    // using JSON fetch API (online only)
    fetchStartViz (
        getAPI_URL (
            dataSrc.url,
            dataSrc.sheetName
        )
    );

    // using d3.csv (offline)
    // startViz();

}

window.onresize = function () {
    setSVGDimensions(chartSVG);
}