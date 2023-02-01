
let intervals = {};

if ($SD) {
    const actionName = "com.f00d4tehg0dz.teslafi.action";

    $SD.on("connected", function (jsonObj) {
        console.log("Connected!");
    });

    $SD.on(actionName + ".willAppear", function (jsonObj) {
        let settings = jsonObj.payload.settings;
        //initiateTeslaFiStatus(jsonObj.context, jsonObj.payload.settings);
        if(settings.automaticRefresh &&
            settings.apiKey && settings.distanceType && settings.degreeType){
            initiateTeslaFiStatus(jsonObj.context, jsonObj.payload.settings);
        }
    });

    $SD.on(actionName + ".sendToPlugin", function (jsonObj) {
        $SD.api.setSettings(jsonObj.context, jsonObj.payload);
        initiateTeslaFiStatus(jsonObj.context, jsonObj.payload);
    });

    // When pressed, TeslaFi status gets updated!
    $SD.on(actionName + ".keyUp", function (jsonObj) {
        initiateTeslaFiStatus(jsonObj.context, jsonObj.payload.settings);
    });

    function initiateTeslaFiStatus(context, settings) {
        if (intervals[context]) {
            let interval = intervals[context];
            clearInterval(interval);
        }

        // Initial call for the first time
        setTitleWithTeslaFiStatus(context, settings);

        // Start Canvas
        canvas = document.createElement('canvas');  
        canvas.width = 144;
        canvas.height = 144;
        block = new Block(canvas);
        ctx = canvas.getContext('2d');

        // Set the text font styles
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = "white";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Schedule for every 1 hours.
        intervals[context] = setInterval(() => {
                let clonedSettings = {};
                // Just making sure we are not hurt by closure.
                Object.assign(clonedSettings, settings);
                setTitleWithTeslaFiStatus(context, clonedSettings);
            },
            moment.duration(15, 'minutes').asMilliseconds());
    }

    function setTitleWithTeslaFiStatus(context, settings) {
        $SD.api.setTitle(context, "Updating");
            getResults(settings, result => resultCallback(result, context));
            getDegreeResults(settings, result => resultDegreeCallback(result, context));
            getDistanceResults(settings, result => resultDistanceCallback(result, context));
    }

    function resultCallback(result, context) {
        if (!result.hasOwnProperty("Object")) {
            
            const json = JSON.stringify(result, null, 1);
            const removeBracket = json.replace(/{/g, '').replace(/}/g, '');
            const unquoted = removeBracket.replace(/\"/g, "");  
            const comma = unquoted.replace(/,/g, "");   

            function clearCanvas(context, canvas) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                var w = canvas.width;
                canvas.width = 1;
                canvas.width = w;
              }

            // load bg-image
            ctx = canvas.getContext("2d");
            img = document.getElementById("bg");
            ctx.drawImage(img, 0, 0);

            // Remove spaces
            comma.replace(/\s/g, "");   
            // Split Lines
            var lines = comma.split('\n');
            
            // Join Lines together
            var arr = [ lines.shift(), lines.shift(), lines.shift(), lines.shift(), lines.join('')];
            
            //  // Remove first line in array
            arr.splice(0, 1);   
            // Build Canvas
            ctx = canvas.getContext("2d");
            // Handle Line Breaks
            var BadConn = 'Poor\nConnection\nOr\nAPI Rate\nLimit';
            var lineheight = 20;
            var lines = BadConn.split('\n');
            var x = 72;
            var y = 35;
            if (arr[0] == undefined) {
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = "white";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.drawImage(img, 144, 144);
                
                // Create Canvas Image
                clearCanvas(context, canvas)
                for (var i = 0; i<lines.length; i++)
                    ctx.fillText(lines[i], x, y + (i*lineheight) );
                $SD.api.setTitle(context, '', null);
                $SD.api.setImage(
                    context,
                    block.getImageData()
                );
            }
            if (arr[0].includes("Na")) {
                ctx.fillStyle = "#ffffff"; //white
                img = document.getElementById("car-icon");
                if (arr[0].includes(null) || arr[0] == "None")
                {
                    ctx.font = 'bold 20px Arial';
                    ctx.fillStyle = "white";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.drawImage(img, 144, 144);
                    for (var i = 0; i<lines.length; i++)
                        ctx.fillText(lines[i], x, y + (i*lineheight) );
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
                else {
                    ctx.drawImage(img, 10, 20);
                    ctx.fillText(arr[0], -30, 20);
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
                
            } else {
                arr.splice(0, 3); 
                ctx.fillStyle = "#ffffff"; //white
            }     
            if (arr[1].includes("Ch")) {
                ctx.fillStyle = "#c7f464"; //green
                img = document.getElementById("charging-icon");
                if (arr[0].includes(null) || arr[0] == "None")
                {
                    ctx.font = 'bold 20px Arial';
                    ctx.fillStyle = "white";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.drawImage(img, 144, 144);
                    for (var i = 0; i<lines.length; i++)
                        ctx.fillText(lines[i], x, y + (i*lineheight) );
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
                else {
                    ctx.drawImage(img, 10, 110);
                    ctx.fillText(arr[1], -30, 110);
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
            } else{
                arr.splice(0, 3); 
                ctx.fillStyle = "#ffffff"; //white
                $SD.api.setTitle(context, '', null);
                $SD.api.setImage(
                    context,
                    block.getImageData()
                );
            }
        // Create Canvas Image
            $SD.api.setTitle(context, '', null);
            $SD.api.setImage(
                context,
                block.getImageData()
            );
        return;
        }
    }

    function getResults(settings, updateTitleFn) {
        let endPoint = "https://www.teslafi.com/feed.php?token={tokenhere}"
            .replace("{tokenhere}", settings.apiKey);
        // let endPoint = 'test.json'
        // $.getJSON(endPoint)
        $.getJSON(endPoint, {apikey: settings.apiKey})
            .done(function (response) {
                updateTitleFn({
                    "Na   ": response.display_name,
                    "Ch   ": response.charging_state,
                });
            })
            .fail(function (jqxhr, textStatus, error) {
                if (jqxhr.status === 503) {
                    updateTitleFn("Exceeded...!")
                } else {
                    updateTitleFn(error);
                }
            });
    }

    function resultDistanceCallback(result, context) {
        if (!result.hasOwnProperty("Object")) {

            ctx = canvas.getContext("2d");
            var x = 20;
            var y = 80;

            // If the Celsius is selected by the user, then converting the displayed temperature and unit to Celsius.
            // The default is F, which is 0. So, no need to touch anything if it is selected.
            if (result.DistanceType == 1) {
                result.Distance = convertToKm(result.Distance);
                distanceTotal = result.Distance + "km";
                
                ctx.fillStyle = "#45b6fe"; //blue
                img = document.getElementById("distance-icon");
                if (distanceTotal.includes(null) || distanceTotal.includes("None"))
                {
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
                else {
                    ctx.drawImage(img, 10, 80);
                    ctx.fillText("Dist" + ' ' + distanceTotal, x, y);
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }

            }     
            else {
                distanceTotal = result.Distance + "mi";
                ctx.fillStyle = "#45b6fe"; //blue
                img = document.getElementById("distance-icon");
                if (distanceTotal.includes(null) || distanceTotal.includes("None"))
                {
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
                else {
                    ctx.drawImage(img, 10, 80);
                    ctx.fillText("Dist" + ' ' + distanceTotal, x, y);
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
            }
            
            }       
        
            // Create Canvas Image
            $SD.api.setTitle(context, '', null);
            $SD.api.setImage(
                context,
                block.getImageData()
            );
        return;
    
    }


    function resultDegreeCallback(result, context) {
        if (!result.hasOwnProperty("Object")) {
            ctx = canvas.getContext("2d");
            var x = 20;
            var y = 50;
            // If the Celsius is selected by the user, then converting the displayed temperature and unit to Celsius.
            // The default is F, which is 0. So, no need to touch anything if it is selected.
            if (result.DegreeType == 1) {
                result.Temp = convertToCelsius(result.Temp);
                degreeTotal = result.Temp + "C";
                ctx.fillStyle = "#ff6b6b"; //red
                img = document.getElementById("temperature-icon");
                if (degreeTotal.includes(null) || degreeTotal.includes("None"))
                {
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                } 
                else {
                    ctx.drawImage(img, 10, 50);
                    ctx.fillText("Temp" + ' ' + degreeTotal, x, y);
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
            }     
            else {
                degreeTotal = result.Temp + "F";
                ctx.fillStyle = "#ff6b6b"; //red
                img = document.getElementById("temperature-icon");
                if (degreeTotal.includes(null) || degreeTotal.includes("None"))
                {
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                } 
                else {
                    ctx.drawImage(img, 10, 50);
                    ctx.fillText("Temp" + ' ' + degreeTotal, x, y);
                    $SD.api.setTitle(context, '', null);
                    $SD.api.setImage(
                        context,
                        block.getImageData()
                    );
                }
            }
            
            }       
        
            // Create Canvas Image
            $SD.api.setTitle(context, '', null);
            $SD.api.setImage(
                context,
                block.getImageData()
            );
        return;
        
    }
    function getDegreeResults(settings, updateDegree) {
        let endPoint = "https://www.teslafi.com/feed.php?token={tokenhere}"
            .replace("{tokenhere}", settings.apiKey);
        //let endPoint = 'test.json'    
       $.getJSON(endPoint, {apikey: settings.apiKey})
        //$.getJSON(endPoint)
            .done(function (response) {
                updateDegree({
                    "DegreeType":settings.degreeType,
                    "Temp": response.inside_tempF,
                });
            })
            .fail(function (jqxhr, textStatus, error) {
                if (jqxhr.status === 503) {
                    updateTitleFn("Exceeded...!")
                } else {
                    updateTitleFn(error);
                }
            });
    }

    function getDistanceResults(settings, updateDistance) {
        let endPoint = "https://www.teslafi.com/feed.php?encode=1&token={tokenhere}"
            .replace("{tokenhere}", settings.apiKey);
         //let endPoint = 'test.json'
        //  $.getJSON(endPoint)
        $.getJSON(endPoint, {apikey: settings.apiKey})
            .done(function (response) {
                updateDistance({
                    "DistanceType":settings.distanceType,
                    "Distance": response.battery_range,
                });
                
            })
            .fail(function (jqxhr, textStatus, error) {
                if (jqxhr.status === 503) {
                    updateTitleFn("Exceeded...!")
                } else {
                    updateTitleFn(error);
                }
            });
    }

    function toDataURL(src, callback, outputFormat) {
        let img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function () {
            let canvas = document.createElement('CANVAS');
            let ctx = canvas.getContext('2d');
            let dataURL;
            canvas.height = this.naturalHeight;
            canvas.width = this.naturalWidth;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.toDataURL(outputFormat);
            callback(dataURL);
        };
        img.src = src;
        if (img.complete || img.complete === undefined) {
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
            img.src = src;
        }
    }

    function convertToCelsius(fahrenheit) {
        return parseInt((fahrenheit - 32) * (5 / 9));
    }

    function convertToKm(mi) {
        return parseInt((mi * 1.609344));
    }
}
