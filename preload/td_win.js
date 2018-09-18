(function() {
    const { ipcRenderer } = require('electron');
    
    let twtType = (/https:\/\/twitter.com/.test(document.location.href) ? 'web' : (/https:\/\/mobile.twitter.com/.test(document.location.href) ? 'mobile' : 'unknown'));
    
    function suggest_tweet_forEach(fn) {
        ['suggest_activity_tweet','suggest_recycled_tweet_inline','suggest_pyle_tweet','suggest_sc_tweet'].forEach(fn);
    }
    
    if (twtType == 'web') {
        suggest_tweet_forEach(e => {
            $('html').find(`[data-component-context="${e}"]`).remove();
        });
    }

    window.tbh = {
        remove: 0
    };

    (function(xhr) {
        var data;

        function modify_mobile_web(twt_obj) {
            if (twt_obj && twt_obj.timeline && twt_obj.timeline.instructions && twt_obj.timeline.instructions[0] && typeof twt_obj.timeline.instructions[0].addEntries === 'object') {
                twt_obj.timeline.instructions[0].addEntries.entries.forEach((c, idx, obj) => {
                    if (c && c.content && c.content.item && c.content.item.clientEventInfo && typeof c.content.item.clientEventInfo.component === 'string') {
                        let evtInfo = c.content.item.clientEventInfo.component;

                        // suggest_activity_tweet : ㅇㅇ님이 마음에 들어 합니다
                        // suggest_recycled_tweet_inline : ㅇㅇ님이 마음에 들어 합니다
                        // suggest_pyle_tweet : ㅇㅇ님이 팔로우합니다
                        // suggest_sc_tweet : ㅇㅇ님이 팔로우합니다
                        
                        // suggest_organic_conversation 
                        // suggest_ranked_organic_tweet
                        suggest_tweet_forEach(e => {

                            if (evtInfo == e) {
                                obj.slice(idx, 1);
                                delete twt_obj.globalObjects.tweets[c.sortIndex];
                                tbh.remove++;
                                console.error(tbh.remove, 'removed');
                            }
                        });
                    }
                })

                return twt_obj;

            }
        }

        function modify_web(twt_obj) {
            if (twt_obj && twt_obj.inner && typeof twt_obj.inner.items_html === 'string')
            {
                let element = document.createElement('div');
                element.innerHTML = twt_obj.inner.items_html;

                suggest_tweet_forEach(e => {
                    let el = $(element).find(`[data-component-context="${e}"]`);
                    if (el.length) {
                        el.remove();
                        tbh.remove += el.length;
                        console.error(tbh.remove, 'removed');
                    }
                });

                twt_obj.inner.items_html = element.innerHTML;
            }
            
            return twt_obj;
        }

        function modify_web_body() {
            let html = $('html');
            html.find('a').remove()
        }

        function setupHook(xhr) {
            function getter() {
        
                //console.log('get responseText', xhr.readyState);

                delete xhr.responseText;
                var resText = xhr.responseText;
                var ret = resText;
                setup();

                //console.info('Response:', ret.substring(0, 30));

                let twt_obj;

                try
                {
                    twt_obj = JSON.parse(ret)

                    if (/api.twitter.com\/1.1\/statuses\/home_timeline.json/.test(xhr.responseURL)) {
                        console.log(twt_obj);
                        ipcRenderer.send('home_timeline', twt_obj);
                    }
                
                    if (typeof twt_obj !== 'undefined') {
                        if (twtType == 'mobile')
                            twt_obj = modify_mobile_web(twt_obj);       // https://mobile.twitter.com/home.json
                        else if (twtType == 'web')
                            twt_obj = modify_web(twt_obj);              // https://twitter.com/i/timeline/
                    }
                
                    ret = JSON.stringify(twt_obj);
                }
                catch (e) {
                    ret = resText;
                }

                if (typeof ret === 'undefined')
                {
                    ret = resText;
                }
                return ret;
            }
        
            function setter(str) {
                this._responseText = str.substring(0, 20);
                console.info('set responseText: %s', str.substring(0, 20));
                _responseText = str;
            }
        
            function setup() {
                Object.defineProperty(xhr, 'responseText', {
                    get: getter,
                    set: setter,
                    configurable: true
                });
            }
            setup();
        }
        
        var open = xhr.open;
        xhr.open = function(method, url, async) {
            if (!this._hooked) {
                this._hooked = true;
                setupHook(this);
            }

            return open.apply(this, arguments);
        };
    })(window.XMLHttpRequest.prototype);
})();