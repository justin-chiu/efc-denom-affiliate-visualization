let denomDataSrcs,
    denomDataTemp,
    denomNodes,
    denomLinks,
    denomDataObjs;

// DOM elements
const viz = document.querySelector("#denom-affiliate-viz"),
    chartSVG = viz.querySelector("#viz-chart-svg");


denomDataSrcs = // Data sources
    [
        {
            desc: "cross-ref",
            url: "https://docs.google.com/spreadsheets/d/1qup1cS0s2_p4CY46n7KiNvo1Zifq3CnlsLIk2enk2zg/edit#gid=1615120225",
            sheetName: "Sheet1"
        },
        {
            desc: "congregations",
            url: "https://docs.google.com/spreadsheets/d/1fIJtTGk8mCbpTAIZrTuPXqF5OSiidUG681B5wI0GuE8/edit#gid=929585413",
            sheetName: "Sheet1"
        },
        {
            desc: "faith-traditions",
            url: "https://docs.google.com/spreadsheets/d/1-iLskNGVgf5kiRlBKmdGjvChjJHmaWtaJH2TWEzjB30/edit#gid=1852950188",
            sheetName: "Sheet1"
        }
    ]

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

function fetchBuildData(apiURL, desc) {
    fetch(apiURL)
        .then(response => response.json())
        .then(response => buildDataObjs(response, desc));
}

function buildDataObjs(data, desc) { // sets property values for denomDataObjs
    
    console.log(data);

    denomDataTemp[desc] = data; // store all datasets in denomDataTemp temporarily

    if (denomDataTemp.length == denomDataSrcs.length) {
        
        for (let i = 0; i < denomDataTemp["cross-ref"].length; i++) {

            let displayName;

            // if Alias exists, set displayName as alias.
            // otherwise, use name Affiliate Denominations
            if (denomDataTemp["cross-ref"][i]["Alias"]) {
                displayName = denomDataTemp["cross-ref"][i]["Alias"];
            } else {
                displayName = denomDataTemp["cross-ref"][i]["Affiliate Denominations"];
            }

            denomDataObjs.push (
                {
                    id: i,
                    displayName: displayName
                }
            );


        }

    }
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

function drawViz(svg) // svg == element in which we are drawing the viz
{

}








// ------EVENT LISTENERS------

window.onload = function () {

    // back-end

    for (let i = 0; i < denomDataSrcs.length; i++) {
        fetchBuildData(
            getAPI_URL(
                denomDataSrcs[i].url,
                denomDataSrcs[i].sheetName
            ),
            denomDataSrcs[i].desc
        );
    }


    // front-end
    setSVGDimensions(chartSVG);
    drawViz(chartSVG);
}

window.onresize = function () {
    setSVGDimensions(chartSVG);
    drawViz(chartSVG);
}