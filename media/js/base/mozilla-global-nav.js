/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
    'use strict';

    var _closeButton = document.getElementById('nav-drawer-close-button');
    var _drawer = document.getElementById('moz-global-nav-drawer');
    var _menuButton = document.getElementById('nav-button-menu');
    var _nav = document.getElementById('moz-global-nav');
    var _page = document.getElementsByTagName('html')[0];
    var _navLinks;

    /**
     * Determine if node is a child element of a given parent.
     * @param {Object} parent - DOM parent node.
     * @param {Object} child - DOM child node.
     * @return {Boolean}
     */
    var _isChildNode = function(parent, child) {
        var node = child.parentNode;
        while (node !== null) {
            if (node === parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    };

    /**
     * Return Y position for an element on the page, taking scroll Y offset into account.
     * @param {Object} el - DOM node.
     * @return {Number}
     */
    var _getYOffset = function(el) {
        return el.getBoundingClientRect().top + window.pageYOffset;
    };

    /**
     * Mozilla global navigation
     */
    var mozGlobalNav = {

        // Simple feature detect for grade-A browser support.
        cutsTheMustard: function() {
            return 'querySelector' in document &&
                   'querySelectorAll' in document &&
                   'addEventListener' in window &&
                   'classList' in document.createElement('div');
        },

        // Toggle the drawer state.
        toggleDrawer: function() {
            var action;

            _page.classList.toggle('moz-nav-open');

            // If the drawer opens, shift focus to the close button.
            if (_page.classList.contains('moz-nav-open')) {
                action = 'open';
                _closeButton.focus();

                document.addEventListener('keydown', mozGlobalNav.handleEscKey, false);
                _page.addEventListener('focusin', mozGlobalNav.handleDrawerFocusOut, false);
            }
            // If the drawer closes, clear previously open & selected items and then shift
            // focus back to the menu button
            else {
                action = 'close';

                mozGlobalNav.clearSelectedNavLink();
                mozGlobalNav.closeSecondaryMenuItems();

                document.removeEventListener('keydown', mozGlobalNav.handleEscKey, false);
                _page.removeEventListener('focusin', mozGlobalNav.handleDrawerFocusOut, false);

                _menuButton.focus();
            }

            window.dataLayer.push({
                'event': 'global-nav',
                'interaction': 'menu-' + action
            });
        },

        // Keeps keyboard focus in the drawer when in open state.
        handleDrawerFocusOut: function(e) {
            var elemIsChild = _isChildNode(_drawer, e.target);

            if (!elemIsChild) {
                _closeButton.focus();
            }
        },

        /**
         * Adjust scroll position Y offset to location of element.
         * @param {Object} el - DOM node to be scrolled to.
         */
        adjustScrollPosition: function(el) {
            var scrollPosition = window.pageYOffset;
            var scrollTimeout;

            clearTimeout(scrollTimeout);

            // If visitor has scrolled down the page a little.
            if (scrollPosition && scrollPosition > 100) {
                // set a timeout to adjust the scroll position to just above the manu that was opened.
                scrollTimeout = setTimeout(function() {
                    // but only do it if the user hasn't scrolled independently during that time.
                    if (scrollPosition === window.pageYOffset) {
                        window.scrollTo(0, _getYOffset(el) - 20);
                    }
                }, 400);
            }
        },

        // Toggle vertical navigation menu in the side drawer.
        toggleDrawerMenu: function(id) {
            var link = document.querySelector('.nav-menu-primary-links > li > .summary > a[data-id="'+ id +'"]');
            var heading = link.parentNode;
            var interaction;

            if (link && heading && heading.classList.contains('summary')) {
                link.focus();

                if (!heading.classList.contains('selected')) {
                    mozGlobalNav.selectNavLink(id);
                    mozGlobalNav.closeSecondaryMenuItems();
                    interaction = 'expand';

                    // When expanding a menu, adjust the scroll position if needed.
                    mozGlobalNav.adjustScrollPosition(heading);
                } else {
                    interaction = 'collapse';
                }

                heading.classList.toggle('selected');

                window.dataLayer.push({
                    'event': 'global-nav',
                    'interaction': 'secondary-nav-' + interaction,
                    'secondary-nav-heading': id
                });
            }
        },

        // Closes all vertical navigation menu items.
        closeSecondaryMenuItems: function() {
            var menuLinks = document.querySelectorAll('.nav-menu-primary-links > li > .summary');

            for (var i = 0; i < menuLinks.length; i++) {
                menuLinks[i].classList.remove('selected');
            }
        },

        /**
         * Selects horizontal navigation link
         * @param (String) - id of item to be selected
         */
        selectNavLink: function(id) {
            var target = document.querySelector('.nav-primary-links > li > a[data-id="' + id + '"]');

            if (target) {
                mozGlobalNav.clearSelectedNavLink();
                target.classList.add('selected');
            }
        },

        // Clears the currently selected horizontal navigation link.
        clearSelectedNavLink: function() {
            for (var i = 0; i < _navLinks.length; i++) {
                _navLinks[i].classList.remove('selected');
            }
        },

        // Closes the horizontal drawer if escape key is pressed.
        handleEscKey: function(e) {
            var isEscape = false;
            e = e || window.event;

            if ('key' in e) {
                isEscape = (e.key === 'Escape' || e.key === 'Esc');
            } else {
                isEscape = (e.keyCode === 27);
            }

            if (isEscape && _page.classList.contains('moz-nav-open')) {
                mozGlobalNav.toggleDrawer();
            }
        },

        // Handle clicks on the vertical drawer navigation links.
        handleDrawerLinkClick: function(e) {
            e.preventDefault();
            var target = e.target.getAttribute('data-id');

            if (target) {
                mozGlobalNav.toggleDrawerMenu(target);
            }
        },

        // Handle clicks on the horozontal navigation links.
        handleNavLinkClick: function(e) {
            e.preventDefault();
            var id = e.target.getAttribute('data-id');

            if (id) {
                mozGlobalNav.selectNavLink(id);

                if (!_page.classList.contains('moz-nav-open')) {
                    mozGlobalNav.toggleDrawer();
                }

                mozGlobalNav.toggleDrawerMenu(id);
            }
        },

        // Bind common event handlers for the navigation menu
        bindEvents: function() {
            var menuLinks = document.querySelectorAll('.nav-menu-primary-links > li > .summary > a');

            for (var i = 0; i < menuLinks.length; i++) {
                menuLinks[i].addEventListener('click', mozGlobalNav.handleDrawerLinkClick, false);
            }

            for (var j = 0; j < _navLinks.length; j++) {
                _navLinks[j].addEventListener('click', mozGlobalNav.handleNavLinkClick, false);
            }

            _menuButton.addEventListener('click', mozGlobalNav.toggleDrawer, false);
            _closeButton.addEventListener('click', mozGlobalNav.toggleDrawer, false);

            var mask = document.getElementById('moz-global-nav-page-mask');
            mask.addEventListener('click', mozGlobalNav.toggleDrawer, false);
        },

        /**
         * Adds an element to document.body for the semi-opaque overlay visible
         * when the horizontal drawer menu is open.
         */
        createNavMask: function() {
            var mask = document.createElement('div');
            mask.id = mask.className = 'moz-global-nav-page-mask';
            document.body.appendChild(mask);
        },

        initSimpleNav: function() {
            _nav.setAttribute('class', 'moz-global-nav simple');
        },

        /**
         * Initializes the navigation for interaction
         */
        init: function() {
            if (mozGlobalNav.cutsTheMustard()) {
                _navLinks = document.querySelectorAll('.nav-primary-links > li > a');

                _menuButton.classList.remove('nav-hidden');

                mozGlobalNav.createNavMask();
                mozGlobalNav.bindEvents();
            } else {
                mozGlobalNav.initSimpleNav();
            }
        }
    };

    if (_nav) {
        mozGlobalNav.init();
    }

})();
