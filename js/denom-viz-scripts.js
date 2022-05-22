let dataSrc,
    dimensions,
    masterData,
    categories,
    vizNodes,
    vizLinks;

// DOM elements
const viz = document.querySelector("#denom-affiliate-viz");
const chartSVG = viz.querySelector("#viz-chart-svg");


dataSrc = { // Data sources
    url: "https://docs.google.com/spreadsheets/d/1uO3PUyP6WnctX-DMGOTsI3jMxcMgy297lz-TjiVYL3s/edit#gid=0",
    sheetName: "Combined"
}

dimensions = { // which columns of spreadsheet to use for viz
    cat: "Faith Traditions", // category
    num: "Congregations" // number
}

/* masterData obj custom properties
    {
        "Node ID": "aff-" | "cat-" | "origin"
        "Node Type": "ghost" | "affiliate" | "category" | "origin"
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

    masterData = populatemasterData(data);
    vizNodes = populateNodes(masterData);
    vizLinks = populateLinks(masterData);
}

function populatemasterData(data) { // places and sorts fetched content into masterData

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

        // designate as affiliate node
        data[i]["Node Type"] = "affiliate";
    }

    data = orderArray(data); // order data from least to greatest number (congregations) count

    for (let i = 0; i < data.length; i++) { // assign ID to all data objects
        data[i]["Node ID"] = "aff-" + i;
    }

    return data;
}

function populateNodes(data) {

    let nodes = JSON.parse(JSON.stringify(data)); // set nodes as copy of data

    categories = new Set(); // nodes for categories (faith traditions)
    let nodesAdded = 0; // counter

    for (let j = 0; j < data.length; j++) {

        let objCats = data[j][dimensions.cat];

        for (let k = 0; k < objCats.length; k++) { 

            categories.add(objCats[k]); // add categories to categories set

            /* // GHOST NODES

            if (objCats.length > 1) { // if multiple categories (faith traditions)
                ghostNode(data[j], j, k, nodesAdded); // create ghostNode
                nodesAdded++; // how many ghost nodes were added
            }

            */
        }
    }

    categories = Array.from(categories);

    for (let i = 0; i < categories.length; i++) { // add category (faith tradition) objects to nodes array

        let newCatObj = {
            "Node ID": "cat-" + categories[i],
            "Node Type": "category"
        }

        newCatObj[dimensions.num] = 0;
        newCatObj[dimensions.cat] = categories[i];

        nodes.push(newCatObj);
    }

    nodes.push({
        "Node ID": "origin",
        "Node Type": "origin"
    });

    return nodes;

}

function populateLinks(data, dimension = dimensions.cat) {

    let links = new Array();

    // every cat is linked to origin node

    for (let i = 0; i < categories.length; i++) {
        
        let newLink = new Object();
        newLink.source = "origin";
        newLink.target = "cat-" + categories[i];
        newLink[dimensions.cat] = categories[i];

        links.push(newLink);
    }

    // every aff is linked to one or more cat nodes

    for (let i = 0; i < data.length; i++) {

        for (let j = 0; j < data[i][dimensions.cat].length; j++) {

            let newLink = new Object();
            newLink.source = "cat-" + data[i][dimensions.cat][j];
            newLink.target = data[i]["Node ID"];
            newLink[dimensions.cat] = data[i][dimensions.cat][j];

            links.push(newLink);
        }
    }

    return links;
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