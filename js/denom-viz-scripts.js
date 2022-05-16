let denomDataSrc, // formerly denomDataSrcs
    // denomDataTemp, // not needed with only one data source
    denomDataObjs,
    denomNodes,
    denomLinks;

// DOM elements
const viz = document.querySelector("#denom-affiliate-viz"),
    chartSVG = viz.querySelector("#viz-chart-svg");


denomDataSrc = { // Data sources
    url: "https://docs.google.com/spreadsheets/d/1uO3PUyP6WnctX-DMGOTsI3jMxcMgy297lz-TjiVYL3s/edit#gid=0",
    sheetName: "Combined"
}

denomDataTemp = new Array(); // temporary storage of datasets
denomDataObjs = new Array(); // unified array of all fetched denomination data

/* data object properties
    {
        id:
        displayName:
        "congregations-name":
        "faith-traditions-name":
        faithTraditions: []
        congregations:
        
        // optional
        yearJoinedEFC:
        yearFounded:
        website:
    }
*/






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

function runViz(data) { // sets property values for denomDataObjs

    buildDataObjs(data);
    populateLinks();
    populateNodes();
}

function buildDataObjs(data) {
    // target == var to place built data objects

    for (let i = 0; i < data.length; i++) { // for each data object

        // convert Faith Traditions to array
        data[i]["Faith Traditions"] = deleteChar(data[i]["Faith Traditions"]);
        data[i]["Faith Traditions"] = data[i]["Faith Traditions"].split(",");

        // convert Congregations to float
        data[i]["Congregations"] = parseFloat(data[i]["Congregations"]);

    }
    console.log(data);
    denomDataObjs = data;
}

function populateLinks() {

    let links = orderArray(denomDataObjs);

}
function populateNodes() { }





// UTILITY

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

function orderArray(data, dimension = "Congregations", dir = "small-large") { // returns array with items ordered largest to smallest

    var sorted = [];

    if (dir == "small-large") {

        for (var i = 0; i < data.length; i++) {

            if (i == 0) { // add first item
                
                sorted.push(data[i]);

            } else {

                for (let j = 0; j < sorted.length; j++) {
                    if (data[i][dimension] < sorted[j][dimension]) {
                        // if smaller than item in array, add in front
                        // sorted.splice(j, 0, data[i]); // ERROR
                        break;
                    } else if (j == sorted.length - 1) {
                        // if not smaller than last item in sorted array, add to end
                        // sorted.push(data[i]); // ERROR
                    }
                }
            }
        }
    }

    return sorted;
}



// d3 arrays which take values from denomData
denomNodes = new Array();
denomLinks = new Array();

// node data object takes most properties and values from denomData
// link data object properties {source: "", target: ""}







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
            denomDataSrc.url,
            denomDataSrc.sheetName
        ));

    // front-end
    setSVGDimensions(chartSVG);
}

window.onresize = function () {
    setSVGDimensions(chartSVG);
}