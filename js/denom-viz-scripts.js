var denomDataSrc,
    denomNodes,
    denomLinks,
    denomData;

// DOM elements
const viz = document.querySelector("#denom-affiliate-viz"),
chartSVG = viz.querySelector("#viz-chart-svg");

// Fetch data

denomDataSrc = new Object();

    // ,congregations
    // ,faithTraditions
    // ,crossRef



// unified array of all fetched denomination data
denomData = new Array();

/* data object properties
    {
        id:
        denomDisplayName:
        denomDataNames: []
        faithTraditions: []
        congregations:
        
        // optional
        yearJoinedEFC:
        yearFounded:
        website:
    }
*/

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

window.onload = function()
{
    setSVGDimensions(chartSVG);
    drawViz(chartSVG);
}

window.onresize = function ()
{
    setSVGDimensions(chartSVG);
    drawViz(chartSVG);
}