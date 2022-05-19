let dataSrc,
    dimensions,
    masterData,
    nodes,
    links;

// DOM elements
const viz = document.querySelector("#denom-affiliate-viz");
const chartSVG = viz.querySelector("#viz-chart-svg");


dataSrc = { // Data sources
    url: "https://docs.google.com/spreadsheets/d/1uO3PUyP6WnctX-DMGOTsI3jMxcMgy297lz-TjiVYL3s/edit#gid=0",
    sheetName: "Combined"
}

dimensions = {
    cat: "Faith Traditions", // category
    num: "Congregations" // number
}

/* masterData obj custom properties
    {
        "Node ID": 
        "Node Type": "ghost" | "affiliate"
    }
*/




// ------BACK END------

// Fetch data and build data objs

function getAPI_URL(dataSrcURL, sheetName) // google sheet URL, sheet name
{
    let apiBaseDomain = "https://opensheet.elk.sh";
    let fileID = dataSrcURL.substring // get file ID string between /d/ and /edit in google sheet URL
        (
            dataSrcURL.indexOf("/d/") + 3,
            dataSrcURL.indexOf("/edit")
        );

    return apiBaseDomain + "/" + fileID + "/" + sheetName;
}

function fetchStartViz(apiURL) {
    fetch(apiURL)
        .then(response => response.json())
        .then(response => runViz(response));
}

function runViz(data) { // sets property values for masterData

    populatemasterData(data);
    populateNodes(masterData);
    populateLinks(nodes);
}

function populatemasterData(data) { // places and sorts fetched content into masterData

    for (let i = 0; i < data.length; i++) { // for each data object

        // convert Faith Traditions to array
        data[i][dimensions.cat] = deleteChar(data[i][dimensions.cat]);
        data[i][dimensions.cat] = data[i][dimensions.cat].split(",");

        // convert Congregations to float
        data[i][dimensions.num] = parseFloat(data[i][dimensions.num]);

        // designate as affiliate node
        data[i]["Node Type"] = "affiliate";
    }

    data = orderArray(data); // order data from least to greatest Congregations count

    for (let i = 0; i < data.length; i++) { // assign ID to all data objects
        data[i]["Node ID"] = i;
    }

    masterData = data;
}

function populateNodes(data) {

    nodes = JSON.parse(JSON.stringify(data)); // set nodes as copy of data

    let ghostCounter = 0;

    for (let j = 0; j < data.length; j++) {

        if (data[j][dimensions.cat].length > 1) { // if multiple categories (faith traditions)

            for (let k = 0; k < data[j][dimensions.cat].length; k++) { // for each, add a ghost node

                ghostNode(data[j], j, k, ghostCounter); // create ghostNode
                ghostCounter++; // how many ghost nodes were added
            }
        }
    }
}

function ghostNode(obj, objIndex, catIndex, counter) { 
    // objIndex == index of object in dataset
    // catIndex == index of category (faith tradition)

    let newGhost = {
        "Node ID": obj["Node ID"] + "-" + catIndex,
        "Node Type": "ghost"
    }

    newGhost[dimensions.cat] = [obj[dimensions.cat][catIndex]];
    newGhost[dimensions.num] = obj[dimensions.num];

    let addAt = objIndex + counter + 1; // where to add the ghost node
    nodes.splice(addAt, 0, newGhost);
}


function populateLinks(data, dimension = dimensions.cat) {

    let categories = new Object();

    for (let i = 0; i < data.length; i++) {

        let currentCat = data[i][dimension];

        if (currentCat.length == 0) {

        } else if (currentCat.length == 1) {

        } else {

        }

    }

}







// ------UTILITY------

function deleteChar(str, chars = [","], from = "end") { // delete chars from start/end of string

    // str == string to delete from
    // chars == array of characters to delete
    // from == delete from "start" or "end"

    for (let i = 0; i < chars.length; i++) {
        if (from == "end") {
            if (str[str.length - 1] == chars[i]) {
                str = str.substring(0, str.length - 1);
            }
        } else if (from == "start") {
            if (str[0] == chars[i]) {
                str = str.substring(1, str.length);
            }
        }
    }

    return str;
}

function orderArray(data, dimension = dimensions.num, reverse = false) { // returns array with items ordered largest to smallest

    data.sort(comparemasterData);

    if (reverse) {
        data.reverse();
    }

    return data;
}

function comparemasterData(objA, objB) { // compare function for Array.sort()

    const dimension = "Congregations"; // which dimension to sort by

    const valueA = objA[dimension];
    const valueB = objB[dimension];

    let compare = 0; // both values are equal

    if (valueA > valueB) {
        compare = 1;
    } else if (valueA < valueB) {
        compare = -1;
    }

    return compare;

} // for reference: https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/







// ------FRONT-END------

function setSVGDimensions(svg) // svg == element for which we are setting the width and height attributes
{
    var w, h;

    w = svg.parentElement.clientWidth;
    h = svg.parentElement.clientHeight;

    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
}








// ------EVENT LISTENERS------

window.onload = function () {

    // back-end

    fetchStartViz(
        getAPI_URL(
            dataSrc.url,
            dataSrc.sheetName
        ));

    // front-end
    setSVGDimensions(chartSVG);
}

window.onresize = function () {
    setSVGDimensions(chartSVG);
}