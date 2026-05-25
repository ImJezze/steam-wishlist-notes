// ==UserScript==
// @name          Steam Wishlist Notes
// @author        Tobias Bindel
// @license       MIT
// @version       1.0
// @description   Adds a persistent notes field to wishlist items
// @match         https://store.steampowered.com/wishlist/*
// @grant         GM_setValue
// @grant         GM_getValue
// @run-at        document-end
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.innerHTML = `
        div:has(> .steam-custom-note-wrap):has(> div > span > span[title="Windows"])
        {
            min-height: 160px;
            height: unset;
            grid-template-columns: fit-content(0) 292px auto auto;
            grid-template-rows: 32px 46px 32px auto;
            grid-template-areas:
                "dragger capsule upper    upper   "
                "dragger capsule lower    remove  "
                "dragger capsule mid      purchase"
                "dragger capsule platform purchase"
                "dragger note note note";
        }
        div:has(> .steam-custom-note-wrap):has(> div > span > span[title="Windows"]) .steam-custom-note-wrap {
            grid-area: note;
            margin: 8px 0 -2px 0;
        }
        .steam-custom-note-box {
            width: 100%;
            background-color: transparent;
            border: 1px solid transparent;
            color: #c7d5df;
            padding: 8px;
            border-radius: 3px;
            font-size: 0.75rem;
            box-sizing: border-box;
            resize: none;
            height: 2.0rem;
            overflow: hidden
            font-family: inherit;
        }
        .steam-custom-note-box:hover {
            background-color: #313c48;
            box-shadow: 1px 1px #0003 inset;
        }
        .steam-custom-note-box:focus {
            resize: vertical;
        }
    `;
    document.head.appendChild(style);

    function handleWishlistItem(element) {
        const imageElement = element;

        const itemElement = element.parentElement.parentElement.parentElement;
        if (itemElement.querySelector('.steam-custom-note-wrap')) {
          return;
        }

        const imageSrc = imageElement.getAttribute('src');
        if (!imageSrc) {
          return;
        }

        const match = imageSrc.match(/steam\/apps\/(\d+)/);
        if (!match) {
          return;
        }

        const appId = match[1];

        // build notes elements
        const wrap = document.createElement('div');
        wrap.className = 'steam-custom-note-wrap';

        const textarea = document.createElement('textarea');
        textarea.className = 'steam-custom-note-box';
        textarea.placeholder = 'Type notes here...';
        textarea.title = "Notes are saved automatically in the local extensions database.";

        // set value previously saved
        textarea.value = GM_getValue(`steam_note_${appId}`, '');

        // auto-save on typing
        textarea.addEventListener('input', (e) => {
            GM_setValue(`steam_note_${appId}`, e.target.value);
        });

        // block drag & frop triggers when clicking inside the text field
        textarea.addEventListener('mousedown', (e) => e.stopPropagation());
        textarea.addEventListener('keydown', (e) => e.stopPropagation());

        wrap.appendChild(textarea);

        // add notes after last element
        itemElement.lastChild.after(wrap);
    }

    const observer = new MutationObserver((mutations) => {
        const elements = document.querySelectorAll('a > div > img');
        for (let i = 0; i < elements.length; i++) {
            handleWishlistItem(elements[i]);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
