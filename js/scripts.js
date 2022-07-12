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

// Other variables

let fullScreen,
    catCaption,
    affCaption,
    nodeSelected,
    catSelected,
    activeNode,
    svgZoom;

// DOM elements
const viz = document.querySelector("#denom-affiliate-viz");
const wrapper = viz.querySelector("#viz-wrapper");
const chartSVG = viz.querySelector("#viz-chart-svg");
const captionA = viz.querySelector("#caption-a");
const captionB = viz.querySelector("#caption-b");
const fileLoader = viz.querySelector("#file-loader");
const fileUpload = viz.querySelector("#file-upload");
const respCheckbox = viz.querySelector("#responsive-checkbox");
const labels = viz.querySelector("#viz-chart-labels");
const footer = viz.querySelector("#viz-footer");
const buttonFullScreen = viz.querySelector("#button-fs");
const textFullScreen = viz.querySelector("#text-fs");

// D3 elements
const labelsD3 = d3.select("#viz-chart-labels");
const svgD3 = d3.select("#viz-chart-svg");







dataSrc = { // Data sources
    url: "https://docs.google.com/spreadsheets/d/1uO3PUyP6WnctX-DMGOTsI3jMxcMgy297lz-TjiVYL3s/edit#gid=0",
    csv: "../data.csv",
    sheetName: "Combined"
}

dimensions = { // which columns of spreadsheet to use for viz
    cat: "Faith Traditions", // category
    num: "Congregations", // number
    name: "Name (Display)", // display name
    short: "Name (Display Short)" // shortform name
}

dataInfo = new Object(); // stores properties relating to entire masterData array

/* masterData obj custom properties
    {
        id: "aff-" | "cat-" | "origin"
        type: "ghost" | "affiliate" | "category" | "origin"
    }
*/







// ------STARTING THE VIZ------

function startFromServer(offlineURL, onlineURL, online = false) { // takes relative path to CSV file, reads and returns data as array of data objects

    if (online) {
        fetch(onlineURL)
            .then(response => response.json())
            .then(response => runViz(response));
    } else { // offline but with live server
        d3.csv(offlineURL)
            .then(function (d) { runViz(d); });
    }
}

function startFromUpload(input) {

    let file = input.files[0];
    let fileReader = new FileReader();

    fileReader.readAsText(file);

    fileReader.onload = function () {
        let data = d3.csvParse(fileReader.result);
        runViz(data);
    }

}

// the main function that runs the whole visualization
function runViz(data) {

    // close data upload dialog
    fileLoader.classList.add("loader-hide");

    // data back-end
    masterData = formatData(data);
    vizNodes = populateNodes(masterData);
    vizLinks = populateLinks(masterData);

    // running front-end
    resizeViz();
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

    for (let i = 0; i < str.split(" ").length - 1; i++) { // delete spaces
        str = str.replace(" ", "");
    }

    return str;
}

function orderArray(array, dimension = dimensions.num, reverse = false, compareFunction = false) { // false returns array with items ordered largest to smallest, or reverse alphabetical order

    
    if (!compareFunction) { // if custom compare function not specified
        compareFunction = compareByDimension(dimension); // get a compare function for specified dimension
    }

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

function radiusCircle(area, add = 0, multiplier = 2.75) {
    // add == amount to add to radius after it is calculated
    // multiplier == multiply radius proportionally

    return Math.sqrt(area / Math.PI) * multiplier + add;
}

function newElement(tag, classList, id, innerHTML) {

    const element = document.createElement(tag);

    if (classList) {
        element.setAttribute("class", classList);
    }

    if (id) {
        element.setAttribute("id", id);
    }

    if (innerHTML) {
        element.innerHTML = innerHTML;
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

function charCountSize(str) { // return different values depending on str length
    if (str.length > 52) { return "sm"; }
    else if (str.split("<br>").length > 2) { return "sm"; }
    else { return "md"; }
}

function slashBreaks(str) { // replaces "/" with "/<br>"

    let newStr = str;

    for (let i = 0; i < str.split("/").length - 1; i++) {
        newStr = newStr.replace("/", "/<br>");
    }

    return newStr;
}

function slashUnderscore(str, reverse = false) { // replaces "/" with "_"

    let newStr = str;

    if (reverse) {
        for (let i = 0; i < str.split("_").length - 1; i++) {
            newStr = newStr.replace("_", "/");
        }
    } else {
        for (let i = 0; i < str.split("/").length - 1; i++) {
            newStr = newStr.replace("/", "_");
        }
    }

    return newStr;
}

function getColor(dataObj, index = 0) {

    const catColors = { // array of assigned colours
        "Anabaptist": "#E89A04",
        "Anglican/Episcopal": "#1B6401",
        "Baptist": "#0A709B",
        "Holiness": "#3BA773",
        "Lutheran": "#00B2BD",
        "Pentecostal/Charismatic": "#FD291B",
        "Pietist": "#FF7CAB",
        "Reformed": "#8D1D8D",
        "Restorationist": "#CABB35",
        "Mainline": "#E1730D",
        "Other": "#6C6C6C"
    }

    if (dataObj.type !== "origin") {
        if (catColors[dataObj[dimensions.cat][index]]) {
            return catColors[dataObj[dimensions.cat][index]];
        } else {
            return catColors["Other"];
        }

    } else {
        return "#32475C";
    }
}

function findInPath(path, tags, classes, ids) { // returns true if any of the classes, tags, or ids are found

    let found = false;
    let breakNow = false;

    for (let i = 0; i < path.length; i++) { // for every element in path

        if (path[i].id == "denom-affiliate-viz") { // stop loop if reached the outermost element of the viz
            break;
        }

        for (let j = 0; j < ids.length; j++) { // search for ids

            if (path[i].id == ids[j]) {
                found = true;
                breakNow = true;
                break;
            }
        }

        if (breakNow) { break; }

        for (let j = 0; j < classes.length; j++) { // search for classes

            if (path[i].classList.contains(classes[j])) { // fix this line
                found = true;
                breakNow = true;
                break;
            }
        }

        if (breakNow) { break; }

        for (let j = 0; j < tags.length; j++) { // search for tags
            if (path[i].elementName == tags[j]) {
                found = true;
                break;
            }
        }
    }

    return found;
}

function getCatAffs(dataObj, getCatNode = false) { // returns array of nodes based on the dataObj of a category node

    let selector = "." + slashUnderscore(dataObj[dimensions.cat][0]);

    if (!getCatNode) { // include only affiliate ndoes
        selector = selector + ".affiliate";
    }

    const catAffs = chartSVG.querySelectorAll(selector); // all nodes with category class
    return catAffs;
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

        // alert if name is too long
        if (data[i][dimensions.name].length > 60) {

            let message = 'WARNING: The name of the affiliate "' + data[i][dimensions.name] + '" in row ' + (i + 1) + ' exceeds 60 characters. Please consider updating data.csv and shortening this name.';

            alert(message);
            console.error(message);
        }

        // convert "#N/A" and "" to "Other"
        data[i][dimensions.cat] = data[i][dimensions.cat].replace("#N/A", "Other");
        if (data[i][dimensions.cat] == "") {
            data[i][dimensions.cat] = "Other";
        }

        // convert categories (faith traditions) to array
        data[i][dimensions.cat] = deleteChar(data[i][dimensions.cat]);
        data[i][dimensions.cat] = data[i][dimensions.cat].split(",");

        // alert if congregations value doesn't exist
        if (
            data[i][dimensions.num] == "" || 
            data[i][dimensions.num] == undefined ||
            data[i][dimensions.num] == null ||
            !data[i][dimensions.num]
        ) {
            let message = 'ERROR: The value in row ' + (i + 1) + ' for the column "Congregations" does not exist. Please update data.csv and add a number value.'

            alert(message);
            console.error(message);
        }

        // convert numbers (congregations) to float
        data[i][dimensions.num] = parseFloat(data[i][dimensions.num]);

        // alert if congregations value is not a number
        if (data[i][dimensions.num] == NaN) {

            let message = 'ERROR: The value in row ' + (i + 1) + ' for the column "Congregations" is not a valid number. Please update data.csv and remove any letters, punctuation, and/or special characters.'

            alert(message);
            console.error(message)
        }

        // count total congregations
        if (!dataInfo[dimensions.num]) { dataInfo[dimensions.num] = 0; }
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
            id: "cat-" + slashUnderscore(categories[i].name),
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
    dataInfo.catCount = 0; // count how many categories

    for (let j = 0; j < data.length; j++) { // for every data obj

        let newCat = data[j][dimensions.cat];

        for (let k = 0; k < newCat.length; k++) { // for each categpry (faith tradition) in data obj

            if (catSet.has(newCat[k])) { // if category already in set

                let catObj = categories.find(element => element.name == newCat[k]);
                catObj.count++; // add to affiliates count
                catObj[dimensions.num] += data[j][dimensions.num];

            } else { // if category not in set

                let catObj = {
                    name: newCat[k],
                    count: 1
                }
                catObj[dimensions.num] = data[j][dimensions.num];

                categories.push(catObj); // create a category object

                if (catObj.name !== "Other") { // add to global category count
                    dataInfo.catCount++;
                }
            }

            catSet.add(newCat[k]); // add category to set
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
        newLink.target = "cat-" + slashUnderscore(categories[i].name);
        newLink[dimensions.cat] = categories[i].name;
        newLink.type = "category";

        links.push(newLink);
    }

    // every aff is linked to one or more cat nodes

    for (let i = 0; i < data.length; i++) {

        for (let j = 0; j < data[i][dimensions.cat].length; j++) {

            let newLink = new Object();
            newLink.source = "cat-" + slashUnderscore(data[i][dimensions.cat][j]);
            newLink.target = data[i].id;
            newLink[dimensions.cat] = data[i][dimensions.cat][j];

            links.push(newLink);
        }
    }

    return links;
}







// ------FRONT-END------

function resizeSVG() {
    // get svg dimensions
    svgHeight = chartSVG.clientHeight;
    svgWidth = chartSVG.clientWidth;

    // set labels container to same dimensions
    labels.style.height = svgHeight + "px";
    labels.style.width = svgWidth + "px";

    // get parent height
    const parentHeight = chartSVG.parentElement.clientHeight;

    if (parentHeight < svgHeight) { // if parent is smaller than svg
        // scale svg and labels container down to fit
        const scale = parentHeight / svgHeight;
        const transform = "translate(-50%,-50%) scale(" + scale + "," + scale + ")";
        chartSVG.style.transform = transform;
        labels.style.transform = transform;
    } else {
        chartSVG.style.transform = "";
        labels.style.transform = "";
    }
}

function resizeViz() {

    if (respCheckbox.checked == true) { // if scaling option is on
        
        // get viz dimensions
        let vizHeight = viz.clientHeight;
        let vizWidth = viz.clientWidth;
        const ratio = vizWidth / vizHeight;

        // accepted aspect ratios
        const maxRatio = 18 / 9;
        const minRatio = 14 / 9;

        if (ratio < minRatio) { // viewport ratio is smaller than minimum
            vizHeight = vizWidth / minRatio;
            viz.classList.remove("widescreen");
        } else if (ratio >= minRatio && ratio <= maxRatio) { // viewport ratio within accepted range
            viz.classList.remove("widescreen");
        } else {
            vizHeight = vizWidth / maxRatio; // viewport ratio is larger than maximum
            viz.classList.add("widescreen");
        }

        const currentWrapW = wrapper.clientWidth;
        const scale = vizWidth / currentWrapW;
        const targetWrapH = vizHeight / scale;

        // scale viz down
        wrapper.style.height = targetWrapH + "px";
        wrapper.style.transform = "scale(" + scale + "," + scale + ")";

    } else { // if scaling option is off

        // remove sizing styles
        viz.classList.remove("widescreen");
        wrapper.style.height = "";
        wrapper.style.transform = "";
    }

    resizeSVG();
}

function defineViz() {

    const circSizes = { // sizes of "point", "size", and "focus" circles
        origin: { point: 6, sizeAdd: 9 },
        cat: { point: 4, sizeAdd: 7 },
        aff: { point: 0 }
    }

    const focusAdd = 18; // add to radius of circle with class "focus"

    const forceSettings = { // all custom .force() parameters for d3.forceSimulation
        link: {
            strength: 2 / 3
        },
        charge: {
            strength: {
                origin: -500,
                category: -800,
                affiliate: -650
            }
        },
        center: {
            x: svgWidth / 2,
            y: svgHeight / 2
        },
        radial: {
            x: svgWidth / 2,
            y: svgHeight / 2,
            radius: {
                origin: 0,
                category: svgHeight * 0.23,
                affiliate: svgHeight * 0.28
            },
            strength: {
                origin: 0,
                category: 0.5,
                affiliate: 0.2
            }
        }
    }

    const radiiSettings = { // all custom radii for <circle> elements
        focused: function (type, num) {
            switch (type) {
                case "origin": return circSizes.origin.point + circSizes.origin.sizeAdd + focusAdd;
                case "category": return circSizes.cat.point + circSizes.cat.sizeAdd + focusAdd;
                case "affiliate": return radiusCircle(num, circSizes.aff.point) + focusAdd;
            }
        },
        size: function (type, num) {
            switch (type) {
                case "origin": return circSizes.origin.point + circSizes.origin.sizeAdd;
                case "category": return circSizes.cat.point + circSizes.cat.sizeAdd;
                case "affiliate": return circSizes.aff.point + radiusCircle(num, circSizes.aff.point);
            }
        },
        point: function (type) {
            switch (type) {
                case "origin": return circSizes.origin.point;
                case "category": return circSizes.cat.point;
                case "affiliate": return circSizes.aff.point;
            }
        }
    }

    // defining d3 force simulation
    forceLayout = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) { // links attract
            return d.id;
        })
            .strength(forceSettings.link.strength)
        )
        .force("charge", d3.forceManyBody() // nodes repel each other
            .strength(function (d) {
                return forceSettings.charge.strength[d.type];
            })
        )
        .force("collision", d3.forceCollide() // nodes repel if touching
            .radius(function (d) {
                return d.radius;
            })
        )
        .force("center", d3.forceCenter(forceSettings.center.x, forceSettings.center.y))
        .force("radial", d3.forceRadial() // nodes attracted to a circular path
            .x(forceSettings.radial.x)
            .y(forceSettings.radial.y)
            .radius(function (d) { // different-sized circular path depending on type
                return forceSettings.radial.radius[d.type];
            })
            .strength(function (d) {
                return forceSettings.radial.strength[d.type];
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

            if (d.type) { classString += " " + d.type; } // add link type as class

            if (d[dimensions.cat]) {
                classString += " " + slashUnderscore(d[dimensions.cat]); // add link category as class
            }

            return classString;
        });

    // drawing nodes
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
                    classString += " " + slashUnderscore(d[dimensions.cat][i]); // add node category as class
                    // replace "/" with "-" for class names
                }
            }

            return classString;
        })
        .attr("id", function (d) {
            return d.id; // add node ID as id attribute
        })
        // events
        .on("mouseenter", function (e) {
            focusNode(e);
        })
        .on("click", function (e) {
            clickNode(e);
        })
        ;

    svgNode.append("circle") // circle that indicates hover or click
        .attr("class", "focused")
        .attr("r", function (d) {
            return radiiSettings.focused(d.type, d[dimensions.num]);
        })
        .attr("fill", function (d) {
            return getColor(d);
        })
        .attr("stroke", function (d) {
            return getColor(d);
        })
        ;

    svgNode.append("circle") // add a second circle
        .attr("class", "size") // circle type: size
        .attr("r", function (d) { // area of circle depends on dimensions.num (Congregataions)
            return radiiSettings.size(d.type, d[dimensions.num]);
        })
        .attr("fill", function (d) {
            return getColor(d);
        })
        .attr("stroke", function (d) {
            return getColor(d);
        })
        ;

    svgNode.append("circle") // every node has the same point circle in the middle
        .attr("class", "point") // circle type: point
        .attr("r", function (d) {
            return radiiSettings.point(d.type);
        })
        .attr("fill", function (d) {
            return getColor(d);
        })
        .attr("stroke", function (d) {
            return getColor(d);
        })
        ;

    chartLabel = labelsD3.selectAll(".chart-label")
        .data(vizNodes)
        .enter().append("div")
        .attr("class", function (d) {
            let classString = "chart-label";

            classString += " " + d.type;

            if (d.type == "category") {
                classString += " " + slashUnderscore(d[dimensions.cat][0]);
            }

            return classString;
        })
        .text(function (d) {
            if (d.type == "category") {
                return d[dimensions.cat][0];
            } else if (d.type == "origin") {
                return "EFC";
            } else if (d.type == "affiliate") {
                if (d[dimensions.short]) {
                    return d[dimensions.short];
                }
            }
        })
        .on("mouseenter", function (e) {
            focusNode(e);
        })
        .on("click", function (e) {
            clickLabel(e);
        })
        ;

    // start force layout
    forceLayout
        .nodes(vizNodes).on("tick", ticked);
    forceLayout.force("link")
        .links(vizLinks);
}

function ticked() {

    let xStretch = 2.4; // stretch the diagram
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

    svgNode
        .select(".focused") // acts inside <g> on circle with class "focused"
        .attr("cx", function (d) {
            return (d.x - (svgWidth / 2)) * xStretch + xOffset;
        })
        .attr("cy", function (d) {
            return d.y;
        });

    chartLabel
        .attr("style", function (d) {

            let styleString = "";

            let xVal = (d.x - (svgWidth / 2)) * xStretch + xOffset;
            let yVal = d.y;

            styleString += "left:" + xVal + "px;";
            styleString += "top: " + yVal + "px;";

            return styleString;
        });
}







// ------INTERACTIONS------

// whether elements have been created
fullScreen = false;
catCaption = false; // category caption created?
affCaption = false; // affiliate caption created?
nodeSelected = false; // whether node has been pinned
catSelected = false; // whether a category node has been pinned
activeNode = "";


// CAPTIONS

function captionDelete() { // delete all caption elements except containers
    captionA.innerHTML = "";
    captionB.innerHTML = "";
    catCaption = false;
    affCaption = false;
}

function captionDefault() { // create and populate default caption

    captionDelete();

    const captionTxt = { // all dynamic text values for caption
        affCount: masterData.length,
        catCount: dataInfo.catCount,
        congCount: commaNumber(dataInfo[dimensions.num])
    }

    // caption A

    // number of nodes (affiliates) in xl text
    const affCountNum = newElement("div", "caption-heading xl small-caps", "", captionTxt.affCount);

    // the text "denomination affiliates" next to digits
    const affCountText = newElement("div", "caption-heading lg", "", "Denomination<br>Affiliates");

    const captionFlex = newElement("div", "caption-flex gap-lg"); // container for flex layout
    captionFlex.append(affCountNum);
    captionFlex.append(affCountText);

    captionA.append(captionFlex); // add to existing container

    // caption B

    const catCountHead = newElement("div", "caption-dimension-heading", "", "Faith Traditions");
    const catCountIcon = newElement("figure", "symbol md faith-traditions");
    const catCountNum = newElement("div", "caption-text", "", captionTxt.catCount);

    const catCountFlex = newElement("div", "caption-flex gap-md");
    catCountFlex.append(catCountIcon);
    catCountFlex.append(catCountNum);

    const catCountGroup = newElement("div", "caption-group");
    catCountGroup.append(catCountHead);
    catCountGroup.append(catCountFlex);

    const congCountHead = newElement("div", "caption-dimension-heading", "", "Congregations");
    const congCountIcon = newElement("figure", "symbol md congregations");
    // CALCULATE # of congregations
    const congCountNum = newElement("div", "caption-text", "", captionTxt.congCount);

    const congCountFlex = newElement("div", "caption-flex gap-md");
    congCountFlex.append(congCountIcon);
    congCountFlex.append(congCountNum);

    const congCountGroup = newElement("div", "caption-group");
    congCountGroup.append(congCountHead);
    congCountGroup.append(congCountFlex);

    captionB.append(catCountGroup);
    captionB.append(congCountGroup);
};

function captionCategory(dataObj) { // takes category object, creates and populates category caption

    captionDelete();

    // get catObj
    const catObj = categories.find(element => element.name == slashUnderscore(dataObj.id.replace("cat-", ""), true));

    const captionTxt = { // all dynamic text values for caption
        name: slashBreaks(catObj.name),
        affCount: catObj.count,
        congCount: commaNumber(catObj[dimensions.num])
    }

    // caption A

    const catSquare = newElement("div", "color-swatch lg-category"); // color square for category
    catSquare.style.backgroundColor = getColor(dataObj);
    // category name in heading
    const catName = newElement("div", "caption-heading lg", "", captionTxt.name);

    const catSubHead = newElement("div", "caption-subhead-caps");
    catSubHead.innerHTML = "tradition";

    const catGroup = newElement("div", "caption-group");
    catGroup.append(catName);
    catGroup.append(catSubHead);

    const catFlex = newElement("div", "caption-flex gap-lg");
    catFlex.append(catSquare);
    catFlex.append(catGroup);

    captionA.append(catFlex);

    // caption B

    // how many affiliates in category
    const catAffHead = newElement("div", "caption-dimension-heading", "", "Affiliates");
    const catAffIcon = newElement("figure", "symbol md affiliates");
    const catAffNum = newElement("div", "caption-text", "", captionTxt.affCount);

    const catAffFlex = newElement("div", "caption-flex gap-md");
    catAffFlex.append(catAffIcon);
    catAffFlex.append(catAffNum);

    const catAffGroup = newElement("div", "caption-group");
    catAffGroup.append(catAffHead);
    catAffGroup.append(catAffFlex);

    // how many congregations in category
    const catCongHead = newElement("div", "caption-dimension-heading", "", "Congregations");
    const catCongIcon = newElement("figure", "symbol md congregations");
    const catCongNum = newElement("div", "caption-text", "", captionTxt.congCount);

    const catCongFlex = newElement("div", "caption-flex gap-md");
    catCongFlex.append(catCongIcon);
    catCongFlex.append(catCongNum);

    const catCongGroup = newElement("div", "caption-group");
    catCongGroup.append(catCongHead);
    catCongGroup.append(catCongFlex);

    captionB.append(catAffGroup);
    captionB.append(catCongGroup);
}

function captionAffiliate(dataObj) { // takes affiliate data object, creates and populates affiliate caption

    const captionTxt = { // all dynamic text values for caption
        name: dataObj[dimensions.name],
        affCats: captionAffCats(dataObj),
        congCount: commaNumber(dataObj[dimensions.num])
    }

    captionDelete();

    // caption A

    const affHeading = newElement(
        "div",
        "caption-heading",
        "",
        captionTxt.name
    ); // class and size of heading determined by number of characters

    const affSubIcon = newElement("figure", "symbol sm affiliate");
    const affSubHead = newElement("div", "caption-subhead-caps", "", "affiliate");

    const affSubFlex = newElement("div", "caption-flex gap-sm");
    affSubFlex.append(affSubIcon);
    affSubFlex.append(affSubHead);

    captionA.append(affHeading);
    captionA.append(affSubFlex);

    // caption B

    const affCatHead = newElement("div", "caption-dimension-heading", "", "Faith&nbsp;Tradition");

    if (dataObj[dimensions.cat].length >= 2) {
        affCatHead.innerHTML += "s"; // plural
    }

    const affCatGroup = newElement("div", "caption-group");
    affCatGroup.append(affCatHead);
    affCatGroup.append(captionTxt.affCats);

    const affCongHead = newElement("div", "caption-dimension-heading", "", "Congregations");

    const affCongIcon = newElement("figure", "symbol md congregations");
    const affCongNum = newElement("div", "caption-text", "", captionTxt.congCount);

    const affCongFlex = newElement("div", "caption-flex gap-md");
    affCongFlex.append(affCongIcon);
    affCongFlex.append(affCongNum);

    const affCongGroup = newElement("div", "caption-group");
    affCongGroup.append(affCongHead);
    affCongGroup.append(affCongFlex);

    captionB.append(affCatGroup);
    captionB.append(affCongGroup);
}

function captionAffCats(dataObj) { // takes dataObj dimensions.cat property

    const catContainer = newElement("div", "caption-group"); // container for all category references

    for (let i = 0; i < dataObj[dimensions.cat].length; i++) { // for each of dataObj's categories

        const thisCat = categories.find(element => element.name == dataObj[dimensions.cat][i]); // find category object

        const catSquare = newElement("div", "color-swatch md");
        catSquare.style.backgroundColor = getColor(dataObj, i);

        const catName = newElement("div", "caption-text", "", thisCat.name);

        const catRef = newElement("div", "caption-flex gap-md");
        catRef.append(catSquare);
        catRef.append(catName);

        catContainer.append(catRef);
    }

    return catContainer;
}

function captionNode(dataObj) { // determines which caption function to run
    switch (dataObj.type) { // caption
        case "category":
            captionCategory(dataObj);
            break;
        case "affiliate":
            captionAffiliate(dataObj);
            break;
        case "origin":
            captionDefault();
            break;
    }
}


// HOVERS

function focusNode(event) {

    const dataObj = event.currentTarget.__data__; // dataObj for target
    let target = event.currentTarget;

    if (event.currentTarget.classList.contains("chart-label")) { // if currentTarget is a label, get referenced node
        target = chartSVG.querySelector("#" + dataObj.id);
    }

    if (!nodeSelected) {

        focusNothing();

        target.classList.add("hl-full"); // re-highlight target node

        if (dataObj.type == "category") {
            focusCatAffiliates(dataObj);
        }

        captionNode(dataObj);

        activeNode = target.id;

    } else if (catSelected) {

        const selectedCat = chartSVG.querySelector(".selected");
        const targetNode = event.currentTarget;

        if ( // targetNode belongs to selectedCat category
            targetNode.classList.contains(slashUnderscore(selectedCat.__data__[dimensions.cat][0]))
        ) {

            const catAffs = getCatAffs(selectedCat.__data__, true);

            changeHighlight(catAffs, false);

            changeHighlight([targetNode], true);

            captionNode(dataObj);
        }
    }
}

function focusCatAffiliates(dataObj) {

    const catName = "." + slashUnderscore(dataObj[dimensions.cat][0]);
    const catAffs = chartSVG.querySelectorAll(catName); // all affiliates with category class

    for (let i = 0; i < catAffs.length; i++) {
        if (!catAffs[i].classList.contains("category")) { // if not the category node
            catAffs[i].classList.add("hl-half");
        }
    }
}

function focusNothing() {

    const allNodes = viz.querySelectorAll(".chart-node");

    for (let i = 0; i < allNodes.length; i++) {
        allNodes[i].classList.remove("hl-full"); // un-highlight all nodes
        allNodes[i].classList.remove("hl-half");
        allNodes[i].classList.remove("selected"); // un-select all nodes
    }
}

function changeHighlight(nodes, darken = true) {
    // for each node in nodes array, changes class from hl-half to highlighted or vice versa if darken == false

    for (let i = 0; i < nodes.length; i++) {
        if (darken) {
            nodes[i].classList.remove("hl-half");
            nodes[i].classList.add("hl-full");
        } else {
            nodes[i].classList.remove("hl-full");
            nodes[i].classList.add("hl-half");
        }
    }
}


// FADING

function fadeThese(elements, fade = true) { // takes an array of elements and fades or unfades them

    for (let i = 0; i < elements.length; i++) {
        if (fade) { elements[i].classList.add("faded"); }
        else { elements[i].classList.remove("faded"); }
    }

}

function fadeOtherNodes(event) {

    const dataObj = event.currentTarget.__data__;

    if (dataObj.type == "category") {

        const catClass = "." + slashUnderscore(dataObj[dimensions.cat][0]);

        const fadeNodes = chartSVG.querySelectorAll(".chart-node:not(" + catClass + "):not(.origin)");
        fadeThese(fadeNodes);

        const fadeLabels = viz.querySelectorAll(".chart-label:not(" + catClass + "):not(.origin)");
        fadeThese(fadeLabels);

        const fadeLines = chartSVG.querySelectorAll(".chart-link:not(" + catClass + ")");
        fadeThese(fadeLines);

    } else if (dataObj.type == "affiliate") {

        const notThisID = ":not(" + "#" + event.currentTarget.getAttribute("id") + ")";
        const selectors = catSelectors(event); // get strings of :not() selectors and array of ids for related cat nodes

        const fadeNodes = chartSVG.querySelectorAll(".chart-node" + selectors.notIDs + notThisID);
        fadeThese(fadeNodes);

        const fadeLabels = viz.querySelectorAll(".chart-label" + selectors.notClasses + ":not(.origin)");
        fadeThese(fadeLabels);

        let fadeLinks = viz.querySelectorAll(".chart-link");

        for (let i = 0; i < fadeLinks.length; i++) {

            const fadeStatus = linkFadeOrNot(dataObj, fadeLinks[i].__data__, selectors.ids);

            if (!fadeStatus) {
                fadeThese([fadeLinks[i]]);
            }
        }
    }
}

function catSelectors(event) { // returns obj with cat IDs and selectors in array and string format

    const dataObj = event.currentTarget.__data__;

    const catIDs = new Array(); // ids of cat nodes to which the affiliate belongs
    let notCatIDs = new String(); // ids as a string of CSS :not() selectors
    let notCatClasses = new String(); // classes of cat labels as a string of CSS :not() selectors

    for (let i = 0; i < dataObj[dimensions.cat].length; i++) {

        const id = slashUnderscore(dataObj[dimensions.cat][i]);

        catIDs.push("cat-" + id);
        notCatClasses = notCatClasses + ":not(." + id + ")";
        notCatIDs = notCatIDs + ":not(#cat-" + id + ")";
    }

    const selectors = {
        ids: catIDs,
        notClasses: notCatClasses,
        notIDs: notCatIDs
    }

    return selectors;

}

function linkFadeOrNot(dataObj, linkObj, catIDs) {
    // evaluates whether or not a link should be faded or not based on which node has been clicked

    let match = false;

    for (let j = 0; j < catIDs.length; j++) {

        if (linkObj.target.id == catIDs[j]) { // end point of line == a category node that the affiliate belongs to
            match = true;
        }
        if (
            linkObj.source.id == catIDs[j] // beginning point of line == a category node that the affiliate belongs to
            && linkObj.target.id == dataObj.id // end point of line == this affiliate node
        ) {
            match = true;
        }
    }

    return match;
}

function unfadeAll() { // unfades all nodes, labels, and links

    const allNodes = viz.querySelectorAll(".chart-node, .chart-label, .chart-link");
    fadeThese(allNodes, false);
}


// SELECTING

function clickOut(event) { // deselects all nodes and shows default caption

    const foundExceptions = findInPath( // value == true if found any of the values below
        event.path,
        ["button", "circle"], // tags
        ["chart-node", "chart-label"], // classes
        ["file-loader", "viz-controls", "viz-footer-content", "viz-header-left", "caption-a", "caption-b"] // ids
    )

    if (!foundExceptions) { // if no tags, classes, ids found
        unfadeAll();
        focusNothing();
        captionDefault();

        nodeSelected = false;
        catSelected = false;
        activeNode = "";
    }
}

function clickNode(event) { // selects or deselects clicked node

    const dataObj = event.currentTarget.__data__;

    if (nodeSelected) {

        if (activeNode == event.currentTarget.id) { // if clicking node to de-select

            unfadeAll();
            focusNothing();
            captionDefault();

            nodeSelected = false;
            catSelected = false;
            activeNode = "";

        } else {  // if clicking another node other than the one already selected

            unfadeAll();
            focusNothing();

            event.currentTarget.classList.add("hl-full");
            event.currentTarget.classList.add("selected");

            if (dataObj.type == "category") {
                focusCatAffiliates(dataObj);
                catSelected = true;
            } else {
                catSelected = false;
            }

            fadeOtherNodes(event);
            captionNode(dataObj);

            activeNode = event.currentTarget.id;
        }

    } else {

        if (activeNode == event.currentTarget.id) { // if clicking to select node for the first time

            event.currentTarget.classList.add("selected");
            fadeOtherNodes(event);

            nodeSelected = true;
            if (dataObj.type == "category") { catSelected = true; }

        } else { // if clicking to select immediately after de-selecting the same node

            event.currentTarget.classList.add("hl-full");
            event.currentTarget.classList.add("selected");

            if (dataObj.type == "category") {
                focusCatAffiliates(dataObj);
                catSelected = true;
            }
            fadeOtherNodes(event);
            captionNode(dataObj);

            nodeSelected = true;
            activeNode = event.currentTarget.id;
        }
    }
}

function clickLabel(event) { // selects or deselects node based on clicked label

    const dataObj = event.currentTarget.__data__;
    const refNode = chartSVG.querySelector("#" + dataObj.id);

    if (nodeSelected) {

        if (activeNode == dataObj.id) { // clicking to deselect

            unfadeAll();
            focusNothing();
            captionDefault();

            nodeSelected = false;
            catSelected = false;
            activeNode = "";

        } else { // clicking to select another node

            unfadeAll();
            focusNothing();

            refNode.classList.add("hl-full");
            refNode.classList.add("selected");

            if (dataObj.type == "category") {
                focusCatAffiliates(dataObj);
                catSelected = true;
            } else {
                catSelected = false;
            }

            fadeOtherNodes(event);
            captionNode(dataObj);

            activeNode = dataObj.id;
        }

    } else {

        if (activeNode == dataObj.id) { // if clicking to select node for the first time

            refNode.classList.add("selected");
            fadeOtherNodes(event);

            nodeSelected = true;
            if (dataObj.type == "category") { catSelected = true; }

        } else { // if clicking to select immediately after de-selecting the same node

            refNode.classList.add("hl-full");
            refNode.classList.add("selected");

            if (dataObj.type == "category") {
                focusCatAffiliates(dataObj);
                catSelected = true;
            }
            fadeOtherNodes(event);
            captionNode(dataObj);

            nodeSelected = true;
            activeNode = dataObj.id;
        }

    }
}

// FULL SCREEN

function toggleFullScreen() {

    const doc = document.documentElement;

    if (fullScreen) { // exit full-screen

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE11
            document.msExitFullscreen();
        }

    } else { // enter full-screen

        if (doc.requestFullscreen) {
            doc.requestFullscreen();
        } else if (doc.webkitRequestFullscreen) { // Safari
            doc.webkitRequestFullscreen();
        } else if (doc.msRequestFullscreen) { // IE11
            doc.msRequestFullscreen();
        }
    }
}

function fsButton() { // changes icon on full-screen button
    buttonFullScreen.querySelector("#enter").classList.toggle("invisible");
    buttonFullScreen.querySelector("#exit").classList.toggle("invisible");
}

function fsText (status) { // toggle "enter" and "exit" in full-screen button label text
    
    if (status && textFullScreen.innerHTML.indexOf("enter") != -1) {
        textFullScreen.innerHTML = textFullScreen.innerHTML.replace("enter", "exit");
    } else if (!status && textFullScreen.innerHTML.indexOf("exit") != -1) {
        textFullScreen.innerHTML = textFullScreen.innerHTML.replace("exit", "enter");
    }
}






// ------EVENT LISTENERS------

window.onload = function () {

    respCheckbox.checked = true; // scaling option on by default
    resizeViz();

    if (window.location.protocol !== 'file:') { // start viz automatically only if page is running from server
        startFromServer(
            dataSrc.csv, // offline data source
            getAPI_URL(dataSrc.url, dataSrc.sheetName), // online data source
            false // false --> run the viz based on an offline data source
        );
    } else { // start viz on file upload if page is running
        fileLoader.classList.remove("loader-hide"); // show file uploader
        fileUpload.onchange = function () { // when user uploads data file
            startFromUpload(this);
        }
    }
}

window.onresize = function () {
    resizeViz();
}

viz.onclick = clickOut;

buttonFullScreen.onclick = toggleFullScreen;

document.addEventListener("fullscreenchange", function () {
    
    resizeViz();
    fsButton();
    fullScreen = !fullScreen;
    fsText(fullScreen);
});