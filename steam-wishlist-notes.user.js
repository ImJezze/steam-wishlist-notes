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
        div[data-rfd-draggable-id^="WishlistItem-"]:has(div + a + div + div + div + div + div + div)
        {
          min-height: 160px;
          height: unset;
          grid-template-rows: 32px 46px 32px auto;
        }
        div[data-rfd-draggable-id^="WishlistItem-"] > div:has(+ a + div + div + div + div + div + div) {
            grid-area: dragger;
            grid-row: 1 / 6; /* spans rows 1–5 */
        }
        .steam-custom-note-wrap {
            margin: 8px 0 -2px 0;
            grid-row: 5 / 6;    /* implicit 5th row */
            grid-column: 2 / 5; /* starts at column 2, spans through column 4 */
            align-self: stretch;
            justify-self: stretch;
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
        if (element.querySelector('.steam-custom-note-wrap')){
          return;
        }

        // extract the App ID from data-rfd-draggable-id="WishlistItem-XXXXXXX-X"
        const dragId = element.getAttribute('data-rfd-draggable-id');
        if (!dragId){
          return;
        }

        const match = dragId.match(/WishlistItem-(\d+)/);
        if (!match) {
          return;
        }

        const appId = match[1];

        // build notes elements
        const wrap = document.createElement('div');
        wrap.className = 'steam-custom-note-wrap';

        const textarea = document.createElement('textarea');
        textarea.className = 'steam-custom-note-box';
        textarea.placeholder = 'Type notes here... (auto-saves)';
        textarea.title = "These notes ares stored inside the local extensions database and wont be synced with your Steam account or Browser data.";

        // set value previously saved
        textarea.value = GM_getValue(`steam_modern_note_${appId}`, '');

        // auto-save on typing
        textarea.addEventListener('input', (e) => {
            GM_setValue(`steam_modern_note_${appId}`, e.target.value);
        });

        // block drag & frop triggers when clicking inside the text field
        textarea.addEventListener('mousedown', (e) => e.stopPropagation());
        textarea.addEventListener('keydown', (e) => e.stopPropagation());

        wrap.appendChild(textarea);

        // add notes after last element
        element.lastChild.after(wrap);
    }

    const observer = new MutationObserver((mutations) => {
        const elements = document.querySelectorAll('[data-rfd-draggable-id^="WishlistItem-"]');
        for (let i = 0; i < elements.length; i++) {
            handleWishlistItem(elements[i]);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
