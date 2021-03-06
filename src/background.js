// Generated by CoffeeScript 1.6.3
$(document).ready(
    function () {
        var domain = "104.224.165.191:8080",
            promoteList, pacScript;
        var getNowString = function () {
            var d = new Date();
            return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
        };

        var getPacScript = function (callback) {
            $.ajax({
                type: "POST",
                url: "http://" + domain + "/proxy/pacScript",
                success: function (data) {
                    if (data.code === 200) {
                        pacScript = data.data;
                        console.log("getPacScript success");
                        if (typeof callback === 'function') {
                            callback()
                        }
                    } else {
                        console.warn("Unable to load pacScript")
                    }
                }
            });
        };

        var getPromoteList = function (callback) {
            $.ajax({
                type: "POST",
                url: "http://" + domain + "/proxy/promoteList",
                success: function (data) {
                    if (data.code === 200) {
                        promoteList = data.data.split(",");
                        console.log("getPromoteList success");
                        if (typeof callback === 'function') {
                            callback()
                        }
                    } else {
                        console.warn("Unable to load promoteList")
                    }
                }
            });
        };


        var init = function () {
            getPromoteList(function () {
                getPacScript(function () {
                    console.log("startProxy");
                    chrome.storage.local.get(["lg_agree", "lg_auto"], function (data) {
                        if (data.lg_auto && data.lg_agree) {
                            openPromote();
                            switch_proxy(true);
                        } else {
                            switch_proxy(false);
                        }
                        display_status();
                    });
                });
            });

        };
        //绑定事件
        chrome.runtime.onStartup.addListener(init);

        chrome.runtime.onInstalled.addListener(function () {
            chrome.runtime.openOptionsPage();
        });


        //chrome.browserAction.onClicked.addListener(switch_proxy);

        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            console.log(request.func);

            if (request.func === "start") {
                chrome.storage.local.get(["lg_agree"],function(data){
                    if(data.lg_agree){
                        openPromote();
                        getPacScript(function () {
                            switch_proxy(true);
                        })
                    }else{
                       alert("请先同意打开主页！");
                       chrome.runtime.openOptionsPage();
                    }
                })
                
            } else if (request.func === "stop") {
                switch_proxy(false);
            }


            if (sendResponse) {
                return sendResponse("bye " + request.func);
            }
        });
        //请求主页地址，请求proxy script;
        //getPromoteList();


        var openPromote = function () {
            var open = function () {
                var now = getNowString();
                var promoteOpenDate = sessionStorage["promoteOpenDate"];
                console.log("now = " + now + ",promoteOpenDate = " + promoteOpenDate);
                if (!promoteOpenDate || promoteOpenDate !== now) {
                    console.log("openPromote");
                    for (var i in promoteList) {
                        var url = promoteList[i];
                        if (url) {
                            chrome.tabs.create({
                                "url": url
                            });
                        }
                    }
                    sessionStorage["promoteOpenDate"] = now;
                }

            };

            if (promoteList) {
                open();
            } else {
                getPromoteList(open);
            }


        };

        var test_proxy = function (cb) {
            return cb(true);
        };

        var proxy = function (enable, callback) {
            if (enable && !pacScript) {
                alert("服务异常，请关闭重启。");
                getPacScript();
                proxy(false);
                return;
            }

            var config;
            console.log("proxy " + (!!enable));
            if (enable) {
                config = {
                    mode: "pac_script",
                    pacScript: {
                        data: pacScript
                    }
                };
                return chrome.proxy.settings.set({
                    value: config,
                    scope: 'regular'
                }, test_proxy(callback));
            } else {

                config = {
                    mode: "system"
                };
                return chrome.proxy.settings.set({
                    value: config,
                    scope: 'regular'
                }, function () {
                    return callback(null);
                });
            }
        };

        var switch_proxy = function (enable) {
            return chrome.storage.local.get(["lg_enabled"], function (data) {
                data.lg_enabled = enable;
                return proxy(data.lg_enabled, function (enabled) {
                    data.lg_enabled = enabled;
                    return chrome.storage.local.set({
                        "lg_enabled": data.lg_enabled
                    }, function () {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                        }
                        return display_status();
                    });
                });
            });
        };

        var display_status = function () {
            return chrome.storage.local.get("lg_enabled", function (data) {
                return chrome.browserAction.setBadgeText({
                    text: data.lg_enabled ? "on" : "off"
                });
            });
        };


        init();

    });