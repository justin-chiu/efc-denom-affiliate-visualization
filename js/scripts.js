// Data variables

let dataSrc,
    dimensions,
    dataInfo,
    masterData,
    categories,
    vizNodes,
    vizLinks,
    catColors;

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
    activeNode;

// DOM elements
const viz = document.querySelector("#denom-affiliate-viz");
const wrapper = viz.querySelector("#viz-wrapper");
const chartSVG = viz.querySelector("#viz-chart-svg");
const captionA = viz.querySelector("#caption-a");
const captionB = viz.querySelector("#caption-b");
const fileLoader = viz.querySelector("#file-loader");
const fileUpload = viz.querySelector("#file-upload");
const labels = viz.querySelector("#viz-chart-labels");

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

catColors = {
    "Anabaptist": "#FFA800",
    "Anglican/Episcopal": "#039000",
    "Baptist": "#0A709B",
    "Holiness": "#3BA773",
    "Lutheran": "#00B2BD",
    "Pentecostal/Charismatic": "#FD291B",
    "Pietist": "#FF7CAB",
    "Reformed": "#8D1D8D",
    "Restorationist": "#B9B20D",
    "Mainline": "#D15E1D",
    "Other": "#828282"
}

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
    resizeSVG(chartSVG);
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

function radiusCircle(area, add = 0, multiplier = 2.75) {
    // add == amount to add to radius after it is calculated
    // multiplier == multiply radius proportionally

    return Math.sqrt(area / Math.PI) * multiplier + add;
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

function getColor(dataObj) {
    if (dataObj.type !== "origin") {
        for (let i = 0; i < dataObj[dimensions.cat].length; i++) {
            if (catColors[dataObj[dimensions.cat][i]]) { // first color that exists
                return catColors[dataObj[dimensions.cat][i]];
            }
        }
    } else {
        return "#32475C";
    }
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
    let nodesAdded = 0; // counter

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
                    count: 1,
                    color: catColors[newCat[k]]
                }
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

function resizeSVG(svg) // svg == element for which we are setting the width and height attributes
{
    const parentH = svg.parentElement.clientHeight;
    
    svgWidth = 1920;
    svgHeight = 720;

    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);
    // set chart labels parent as well

    // if (parentH < svgHeight) {
    //     const scale = parentH / svgHeight;
    //     svg.style.transform = "scale(" + scale + "," + scale + ")";

    // }
}

function resizeViz() {
    const viewportH = viz.clientHeight;
    const viewportW = viz.clientWidth;

    const currentWrapW = wrapper.clientWidth;
    const scale = viewportW / currentWrapW;
    const targetWrapH = viewportH / scale;

    wrapper.style.height = targetWrapH + "px";
    console.log(wrapper.style.height);
    wrapper.style.transform = "scale(" + scale + "," + scale + ")";

    resizeSVG(chartSVG);


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
                affiliate: -600
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
                category: svgHeight * 0.25,
                affiliate: svgHeight * 0.3
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
        .on("mouseenter", function (d) {
            focusNode(d);
        })
        ;

    // start force layout
    forceLayout
        .nodes(vizNodes).on("tick", ticked);
    forceLayout.force("link")
        .links(vizLinks);
}

function ticked() {

    let xStretch = 2.3; // stretch the diagram
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

            const xVal = (d.x - (svgWidth / 2)) * xStretch + xOffset;
            const yVal = d.y;

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

    // caption A

    const affCountNum = newElement("div", "caption-heading xl small-caps"); // number of nodes (affiliates) in xl text
    affCountNum.innerText = masterData.length;

    const affCountText = newElement("div", "caption-heading lg"); // the text "denomination affiliates" next to digits
    affCountText.innerHTML = "Denomination<br>Affiliates";

    const captionFlex = newElement("div", "caption-flex"); // container for flex layout
    captionFlex.append(affCountNum);
    captionFlex.append(affCountText);

    captionA.append(captionFlex); // add to existing container

    // caption B

    const catCountHead = newElement("div", "caption-dimension-heading");
    catCountHead.innerHTML = "Faith Traditions";

    const catCountNum = newElement("span", "caption-text");
    catCountNum.innerText = categories.length; // NEED TO SUBTRACT "Other" category

    const catCountText = newElement("div", "caption-text"); // category (faith traditions) count and text
    catCountText.append(catCountNum);
    // catCountText.innerHTML += "&nbsp;Faith&nbsp;Traditions";

    const catCountGroup = newElement("div", "caption-group");
    catCountGroup.append(catCountHead);
    catCountGroup.append(catCountText);

    const congCountHead = newElement("div", "caption-dimension-heading");
    congCountHead.innerHTML = "Congregations";

    const congCountNum = newElement("span", "caption-text");
    congCountNum.innerText = commaNumber(dataInfo[dimensions.num]); // CALCULATE # of congregations

    const congCountText = newElement("div", "caption-text"); // congregation count and text
    congCountText.append(congCountNum);
    // congCountText.innerHTML += "&nbsp;total";


    captionB.append(catCountGroup);
    captionB.append(congCountHead);
    captionB.append(congCountText);
};

function captionCategory(dataObj) { // takes category object, creates and populates category caption

    captionDelete();

    // get catObj

    const catObj = categories.find(element => element.name == slashUnderscore(dataObj.id.replace("cat-", ""), true));

    // caption A

    const catSquare = newElement("div", "icon color-swatch heading-size"); // color square for category
    catSquare.style.backgroundColor = catObj.color;

    const catName = newElement("div", "caption-heading lg"); // category name in heading
    catName.innerHTML = slashBreaks(catObj.name); // adds line break for names with "/"

    const catHeading = newElement("div", "caption-flex");

    catHeading.append(catSquare);
    catHeading.append(catName);
    captionA.append(catHeading);

    // caption B

    // how many affiliates in category
    const catAffHead = newElement("div", "caption-dimension-heading");
    catAffHead.innerHTML = "Affiliates";
    const catAffNum = newElement("span", "caption-text");
    catAffNum.innerText = catObj.count;
    const catAffText = newElement("div", "caption-text");
    catAffText.append(catAffNum);
    // catAffText.innerHTML += "&nbsp;Affiliates";

    const catAffGroup = newElement("div", "caption-group");
    catAffGroup.append(catAffHead);
    catAffGroup.append(catAffText);

    // how many congregations in category
    const catCongHead = newElement("div", "caption-dimension-heading");
    catCongHead.innerHTML = "Congregations"
    const catCongNum = newElement("span", "caption-text");
    catCongNum.innerText = commaNumber(catObj[dimensions.num]);
    const catCongText = newElement("div", "caption-text");
    catCongText.append(catCongNum);
    // catCongText.innerHTML += "&nbsp;Total&nbsp;Congregations";

    captionB.append(catAffGroup);
    captionB.append(catCongHead);
    captionB.append(catCongText);
}

function captionAffiliate(dataObj) { // takes affiliate data object, creates and populates affiliate caption

    captionDelete();

    // caption A

    const affHeading = newElement(
        "div", "caption-heading " + charCountSize(dataObj[dimensions.name])
    ); // class and size of heading determined by number of characters
    affHeading.innerHTML = dataObj[dimensions.name];

    const affSubHead = newElement("div", "caption-subhead-caps");
    affSubHead.innerHTML = "affiliate";

    captionA.append(affHeading);
    captionA.append(affSubHead);

    // caption B

    const affCatHead = newElement("div", "caption-dimension-heading");
    affCatHead.innerHTML = "Faith Tradition";

    if (dataObj[dimensions.cat].length >= 2) {
        affCatHead.innerHTML += "s"; // plural
    }

    const affCongHead = newElement("div", "caption-dimension-heading");
    affCongHead.innerHTML = "Congregations";

    const affCongNum = newElement("span", "caption-text");
    affCongNum.innerText = commaNumber(dataObj[dimensions.num]);

    const affCongText = newElement("div", "caption-text");
    affCongText.append(affCongNum);
    // affCongText.innerHTML += "&nbsp;Congregations";

    captionB.append(affCatHead);
    captionB.append(
        captionAffCats(dataObj[dimensions.cat])
    );
    captionB.append(affCongHead);
    captionB.append(affCongText);
}

function captionAffCats(affCats) { // takes dataObj dimensions.cat property

    const catContainer = newElement("div", "caption-group"); // container for all category references

    for (let i = 0; i < affCats.length; i++) { // for each of dataObj's categories

        const thisCat = categories.find(element => element.name == affCats[i]); // find category object

        const catSquare = newElement("div", "icon color-swatch text-size");
        catSquare.style.backgroundColor = thisCat.color;

        const catName = newElement("div", "caption-text");
        catName.innerText = thisCat.name;

        const catRef = newElement("div", "caption-flex text-size");
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

function focusNode(event) { // sticky argument determines whether caption stays after mouseout

    const dataObj = event.currentTarget.__data__; // dataObj for target

    if (!nodeSelected) {

        focusNothing();

        event.currentTarget.classList.add("highlighted"); // re-highlight target node
        if (dataObj.type == "category") {
            focusCatAffiliates(dataObj);
        }

        captionNode(dataObj);

        activeNode = event.currentTarget.id;
    }
}

function focusCatAffiliates(dataObj) {

    const catName = "." + slashUnderscore(dataObj[dimensions.cat][0]);
    const catAffs = chartSVG.querySelectorAll(catName); // all affiliates with category class

    for (let i = 0; i < catAffs.length; i++) {
        catAffs[i].classList.add("highlighted");
    }
}

function focusNothing() {

    const allNodes = viz.querySelectorAll(".chart-node");

    for (let i = 0; i < allNodes.length; i++) {
        allNodes[i].classList.remove("highlighted"); // un-highlight all nodes
        allNodes[i].classList.remove("selected"); // un-select all nodes
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

    const classStr = event.target.classList.value;

    if (
        classStr.indexOf("chart-node") == -1
        && classStr.indexOf("chart-label") == -1
        && event.target.tagName !== "circle"
    ) {
        unfadeAll();
        focusNothing();
        captionDefault();

        nodeSelected = false;
        activeNode = "";
    }
}

function clickNode(event) { // selects or deselects clicked node

    const dataObj = event.currentTarget.__data__;

    if (nodeSelected) {

        if (activeNode == event.currentTarget.id) { // if clicking node to de-select

            event.currentTarget.classList.remove("selected");
            event.currentTarget.classList.remove("highlighted");
            unfadeAll();
            focusNothing();
            captionDefault();

            nodeSelected = false;
            activeNode = "";

        } else {  // if clicking another node other than the one already selected

            unfadeAll();
            focusNothing();

            event.currentTarget.classList.add("highlighted");
            event.currentTarget.classList.add("selected");

            if (dataObj.type == "category") { focusCatAffiliates(dataObj); }

            fadeOtherNodes(event);
            captionNode(dataObj);

            activeNode = event.currentTarget.id;
        }

    } else {

        if (activeNode == event.currentTarget.id) { // if clicking to select node for the first time

            event.currentTarget.classList.add("selected");
            fadeOtherNodes(event);

            nodeSelected = true;

        } else { // if clicking to select immediately after de-selecting the same node

            event.currentTarget.classList.add("highlighted");
            event.currentTarget.classList.add("selected");
            if (dataObj.type == "category") { focusCatAffiliates(dataObj); }
            fadeOtherNodes(event);
            captionNode(dataObj);

            nodeSelected = true;
            activeNode = event.currentTarget.id;
        }
    }
}


// FULL SCREEN

function toggleFullScreen() {

}



// ------EVENT LISTENERS------

window.onload = function () {

    // start viz automatically only if page is running from server
    if (window.location.protocol !== 'file:') {
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
    resizeSVG(chartSVG);
}

viz.onclick = clickOut;