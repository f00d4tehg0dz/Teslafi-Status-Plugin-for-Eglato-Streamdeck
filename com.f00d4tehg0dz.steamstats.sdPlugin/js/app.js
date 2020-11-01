let intervals = {};
    if ($SD) {
        const actionName = "com.f00d4tehg0dz.steamstat.action";

        $SD.on("connected", function (jsonObj) {
            console.log("Connected!13");
      
        });
        
        $SD.on(actionName + ".willAppear", function (jsonObj) {
            let settings = jsonObj.payload.settings;
            if(settings.automaticRefresh){
                initiateStatus(jsonObj.context, jsonObj.payload.settings);
            }  
        });

        $SD.on(actionName + ".sendToPlugin", function (jsonObj) {
            $SD.api.setSettings(jsonObj.context, jsonObj.payload);
            initiateStatus(jsonObj.context, jsonObj.payload);
        });

        // When pressed, TeslaFi status gets updated!
        $SD.on(actionName + ".keyUp", function (jsonObj) {
          
            initiateStatus(jsonObj.context, jsonObj.payload.settings);
            console.log();
        });
    
        function initiateStatus(context, settings) {
            if (intervals[context]) {
                let interval = intervals[context];
                clearInterval(interval);
            }

            // Initial call for the first time
            setTitleStatus(context, settings);

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
            ctx.textBaseline = 'middle';

             // Schedule for every 1 hours.
            intervals[context] = setInterval(() => {
                    let clonedSettings = {};
                    // Just making sure we are not hurt by closure.
                    Object.assign(clonedSettings, settings);
                    setTitleStatus(context, clonedSettings);
                },
                moment.duration(1, 'hours').asMilliseconds());
        }

        function setTitleStatus(context, settings) {
            $SD.api.setTitle(context, "Updating");
            getResults(result => resultCallback(result, context));
                
        }

        function resultCallback(result, context) {


            
        // == Color Rules ==
        // Minor = #26c6da
        // Major = #ffc107
        // Delay = #26c6da light-blue
        // N/A = #8a8db7 grey
        // Normal = Green

        // OnlineSteam
        function delayed() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Delayed", 10, 25);
        }
        function normal() {
            ctx.fillStyle = "#008000";
            ctx.fill();
            ctx.fillText(result.OnlineOnSteam, 10, 25);
        }
        function na() {
            ctx.fillStyle = "#8a8db7";
            ctx.fill();
            ctx.fillText("N/A", 10, 25);
        }
        function majoroutage() {
            ctx.fillStyle = "#ffc107";
            ctx.fill();
            ctx.fillText("Major", 10, 25);
        }
        function partialoutage() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Minor", 10, 25);
        }


        // InGame
        function delayedP() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Delayed", 10, 50);
        }
        function normalP() {
            ctx.fillStyle = "#008000";
            ctx.fill();
            ctx.fillText(result.InGameOnSteam, 10, 50);
        }
        function na() {
            ctx.fillStyle = "#8a8db7";
            ctx.fill();
            ctx.fillText("N/A", 10, 50);
        }
        function majoroutageP() {
            ctx.fillStyle = "#ffc107";
            ctx.fill();
            ctx.fillText("Major", 10, 50);
        }
        function partialoutageP() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Minor", 10, 50);
        }

     
        // Store
        function delayedE() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Delayed", 10, 75);
        }
        function normalE() {
            ctx.fillStyle = "#008000";
            ctx.fill();
            ctx.fillText("Normal", 10, 75);
        }
        function naE() {
            ctx.fillStyle = "#8a8db7";
            ctx.fill();
            ctx.fillText("N/A", 10, 75);
        }
        function majoroutageE() {
            ctx.fillStyle = "#ffc107";
            ctx.fill();
            ctx.fillText("Major", 10, 75);
        }
        function partialoutageE() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Minor", 10, 75);
        }

        // Community
        function delayedF() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Delayed", 10, 100);
        }
        function normalF() {
            ctx.fillStyle = "#008000";
            ctx.fill();
            ctx.fillText("Normal", 10, 100);
        }
        function naF() {
            ctx.fillStyle = "#8a8db7";
            ctx.fill();
            ctx.fillText("N/A", 10, 100);
        }
        function majoroutageF() {
            ctx.fillStyle = "#ffc107";
            ctx.fill();
            ctx.fillText("Major", 10, 100);
        }
        function partialoutageF() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Minor", 10, 100);
        }

        // SteamWebAPI
        function delayedG() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Delayed", 10, 125);
        }
        function normalG() {
            ctx.fillStyle = "#008000";
            ctx.fill();
            ctx.fillText("Normal", 10, 125);
        }
        function naG() {
            ctx.fillStyle = "#8a8db7";
            ctx.fill();
            ctx.fillText("N/A", 10, 125);
        }
        function majoroutageG() {
            ctx.fillStyle = "#ffc107";
            ctx.fill();
            ctx.fillText("Major", 10, 125);
        }
        function partialoutageG() {
            ctx.fillStyle = "#26c6da";
            ctx.fill();
            ctx.fillText("Minor", 10, 125);
        }


            // Testing with String to see if everything outputted ok
            if (!result.hasOwnProperty("Object")) {
                // Clean up String
                const json = JSON.stringify(result, null, 1);
                console.log(result);
                // load bg-image
                ctx = canvas.getContext("2d");
                img = document.getElementById("bg");
                ctx.drawImage(img, 0, 0);
                
                // Add to String and Split Lines

                splitlines = ("ON" + ' ' + result.OnlineOnSteam.replace(new RegExp(' ', 'g'), ' ') + '\n' + "IN" + ' ' + result.InGameOnSteam + '\n' + "ST" + ' ' + result.SteamStore + '\n' + "CM" + ' ' + result.SteamCommunity + '\n' + "AP" + ' ' + result.SteamWebAPI + '\n' )
                // Split Lines
                var lines = splitlines.split('\n');
 
                var arr = [lines.shift(),lines.shift(), lines.shift(), lines.shift(), lines.shift(), lines.shift(), lines.join(' ')];
                const online = arr[0];
                const ingame = arr[1];
                const store = arr[2];
                const community = arr[3];
                const webAPI = arr[4];

                // If online contains a text swap out THAT specific text
                if (online.includes('million') == true) {
                    normal();
                } else if (online.includes('Delayed') == true) {
                    delayed();
                } else if (online.includes('N/A') == true) {
                    na();
                } else if (online.includes('major') == true) {
                    majoroutage();
                } else if (online.includes('minor') == true) {
                    partialoutage();
                }

                // If ingame contains a text swap out THAT specific text
                if (ingame.includes('million') == true) {
                    normalP();
                } else if (ingame.includes('Delayed') == true) {
                    delayedP();
                } else if (ingame.includes('N/A') == true) {
                    naP();
                } else if (ingame.includes('major') == true) {
                    majoroutageP();
                } else if (ingame.includes('minor') == true) {
                    partialoutageP();
                }

                // If store contains a text swap out THAT specific text
                if (store.includes('Normal') == true) {
                    normalE();
                } else if (store.includes('Delayed') == true) {
                    delayedE();
                } else if (store.includes('N/A') == true) {
                    naE();
                } else if (store.includes('major') == true) {
                    majoroutageE();
                } else if (store.includes('minor') == true) {
                    partialoutageE();
                }

                 // If community contains a text swap out THAT specific text
                 if (community.includes('Normal') == true) {
                    normalF();
                } else if (community.includes('Delayed') == true) {
                    delayedF();
                } else if (community.includes('N/A') == true) {
                    naF();
                } else if (community.includes('major') == true) {
                    majoroutageF();
                } else if (community.includes('minor') == true) {
                    partialoutageF();
                }

                 // If community contains a text swap out THAT specific text
                 if (webAPI.includes('Normal') == true) {
                    normalG();
                } else if (webAPI.includes('N/A') == true) {
                    naG();
                } else if (webAPI.includes('Delayed') == true) {
                    delayedG();
                } else if (webAPI.includes('major') == true) {
                    majoroutageG();
                } else if (webAPI.includes('minor') == true) {
                    partialoutageG();
                }

                // Null the Title so Nothing Shows
                $SD.api.setTitle(context, '', null);
                $SD.api.setImage(
                    context,
                    block.getImageData()
                );
                return;
            }
        }
        function getResults(updateTitleFn) {
            let endPoint = "http://localhost:3000/stats";
            $.getJSON(endPoint)
                .done(function (response) {
                    // updateTitleFn(response[0].status)
                    updateTitleFn(
                       response[0]
                    );                   
                })
                .fail(function (jqxhr, textStatus, error) {
                    if (jqxhr.status === 503) {
                        updateTitleFn("Exceeded...!")
                    } else {
                        updateTitleFn(error);
                    }
                });
        }
    }