const { clipboard, ipcRenderer, shell } = require('electron');
const db = require('./dbdexie');

let baseUrl = 'https://api.github.com/gists';
const request = require('request').defaults({
  url: baseUrl,
  headers: { 'User-Agent': 'Clipmaster 9000' }
});

const clippingsList = document.getElementById('clippings-list');
const copyFromClipboardButton = document.getElementById('copy-from-clipboard');

ipcRenderer.on('create-new-clipping', () => {
  addClippingToList();
  new Notification('Clipping Added', {
    body: `${clipboard.readText()}`
  });
});

ipcRenderer.on('write-to-clipboard', () => {
  const clipping = clippingsList.firstChild;
  writeToClipboard(getClippingText(clipping));
  new Notification('Clipping Copied', {
    body: `${clipboard.readText()}`
  });
});

ipcRenderer.on('publish-clipping', () => {
  const clipping = clippingsList.firstChild;
  publishClipping(getClippingText(clipping));
});

const initClippingElement = () => {
  /*
  db.clips
    //.reverse() //按主键降序排列
    .each(clip => {
      let clippingElement = createClippingElement(clip.id, clip.value);
      clippingsList.prepend(clippingElement);
    });
*/
  db.clips
    .orderBy('id')
    //.reverse()  //按主键降序排列
    .toArray((clips) => {
      for (var clip of clips) {
        let clippingElement = createClippingElement(clip.id, clip.value);
        clippingsList.prepend(clippingElement);
      }
    });
}

const createClippingElement = (clipId, clippingText) => {
  const clippingElement = document.createElement('article');

  clippingElement.classList.add('clippings-list-item');

  clippingElement.innerHTML = `
    <div class="clipping-text" disabled="true"></div>
    <div class="clipping-controls">
      <button class="copy-clipping">&rarr; Clipboard</button>
      <button class="publish-clipping">Publish</button>
      <button class="remove-clipping" data-clipId='${clipId}'>Remove</button>
    </div>
  `;

  clippingElement.querySelector('.clipping-text').innerText = clippingText;

  return clippingElement;
};

const addClippingToList = () => {
  const clippingText = clipboard.readText();
  db.clips.add({ value: clippingText, data: Date.now() })
    .then(id => {
      return db.clips.get(id);
    }).then(item => {
      const clippingElement = createClippingElement(item.id, item.value);
      clippingsList.prepend(clippingElement);
    }).catch(err => {
      alert("Error: " + (err.stack || err));
    });
};

copyFromClipboardButton.addEventListener('click', addClippingToList);

clippingsList.addEventListener('click', (event) => {
  const hasClass = className => event.target.classList.contains(className);
  let clipId = parseInt(event.target.getAttribute("data-clipId"));
  const clippingListItem = getButtonParent(event);

  if (hasClass('remove-clipping')) removeClipping(clipId, clippingListItem);
  if (hasClass('copy-clipping')) writeToClipboard(getClippingText(clippingListItem));
  if (hasClass('publish-clipping')) publishClipping(getClippingText(clippingListItem));
});

const removeClipping = (clipId, target) => {
  db.clips.delete(clipId).then(result => {
    //Promise that resolves successfully with an undefined result, no matter if a record was deleted or not. 
    //不管删没删，都是返回：undefined
    target.remove();
  });
};

const writeToClipboard = (clippingText) => {
  clipboard.writeText(clippingText);
};

const publishClipping = (clippingText) => {

  request.post(baseUrl, toJSON(clippingText), (err, response, body) => {

    if (err) {
      return new Notification('Error Publishing Your Clipping', {
        body: JSON.parse(err).message
      });
    }

    const gistUrl = JSON.parse(body).documentation_url; //   const gistUrl = JSON.parse(body).html_url;
    const notification = new Notification('Your Clipping Has Been Published', {
      body: `Click to open ${gistUrl} in your browser.`
    });

    notification.onclick = () => { shell.openExternal(gistUrl); };

    clipboard.writeText(gistUrl);
  });

};

const getButtonParent = ({ target }) => {
  return target.parentNode.parentNode;
};

const getClippingText = (clippingListItem) => {
  return clippingListItem.querySelector('.clipping-text').innerText;
};

const toJSON = (clippingText) => {
  return {
    body: JSON.stringify({
      description: 'Created with Clipmaster 9000',
      public: 'true',
      files: {
        'clipping.txt': { content: clippingText }
      }
    })
  };
};

initClippingElement();