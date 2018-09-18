(function() {
    const { ipcRenderer } = require('electron');
    let ignoreMouseEventStatus;

    let max_id = 0;
    ipcRenderer.on('home_timeline', (evt, twt_obj) => {

        twt_obj.reverse();

        Array.from(twt_obj).forEach((item, idx) => {
            if (max_id >= item.id) return;
            max_id = item.id;
            console.info(idx, item);
            let el = document.createElement('li');
            el.innerHTML = `<div class="name">${item.user.name}&nbsp;@${item.user.screen_name}</div>${item.full_text}`;
            document.querySelector('.timeline_box > ul').appendChild(el);

            let path = require('path')
            let circle = document.querySelector('.timeline_box')

            let timeline_box = document.querySelector('.timeline_box');
            timeline_box.scrollTop = timeline_box.scrollHeight;
        })
    });

})();