/*! responsive-nav.js 1.0.34
 * https://github.com/viljamis/responsive-nav.js
 * http://responsive-nav.com
 *
 * Copyright (c) 2014 @viljamis
 * Available under the MIT license
 */

(function (document, window, index) {
  // Index is used to keep multiple navs on the same page namespaced

  "use strict";

  var responsiveNav = function (el, options) {

    var computed = !!window.getComputedStyle;
    
    /**
     * getComputedStyle polyfill for old browsers
     */
    if (!computed) {
      window.getComputedStyle = function(el) {
        this.el = el;
        this.getPropertyValue = function(prop) {
          var re = /(\-([a-z]){1})/g;
          if (prop === "float") {
            prop = "styleFloat";
          }
          if (re.test(prop)) {
            prop = prop.replace(re, function () {
              return arguments[2].toUpperCase();
            });
          }
          return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        };
        return this;
      };
    }
    /* exported addEvent, removeEvent, getChildren, setAttributes, addClass, removeClass, forEach */
    
    /**
     * Add Event
     * fn arg can be an object or a function, thanks to handleEvent
     * read more at: http://www.thecssninja.com/javascript/handleevent
     *
     * @param  {element}  element
     * @param  {event}    event
     * @param  {Function} fn
     * @param  {boolean}  bubbling
     */
    var addEvent = function (el, evt, fn, bubble) {
        if ("addEventListener" in el) {
          // BBOS6 doesn't support handleEvent, catch and polyfill
          try {
            el.addEventListener(evt, fn, bubble);
          } catch (e) {
            if (typeof fn === "object" && fn.handleEvent) {
              el.addEventListener(evt, function (e) {
                // Bind fn as this and set first arg as event object
                fn.handleEvent.call(fn, e);
              }, bubble);
            } else {
              throw e;
            }
          }
        } else if ("attachEvent" in el) {
          // check if the callback is an object and contains handleEvent
          if (typeof fn === "object" && fn.handleEvent) {
            el.attachEvent("on" + evt, function () {
              // Bind fn as this
              fn.handleEvent.call(fn);
            });
          } else {
            el.attachEvent("on" + evt, fn);
          }
        }
      },
    
      /**
       * Remove Event
       *
       * @param  {element}  element
       * @param  {event}    event
       * @param  {Function} fn
       * @param  {boolean}  bubbling
       */
      removeEvent = function (el, evt, fn, bubble) {
        if ("removeEventListener" in el) {
          try {
            el.removeEventListener(evt, fn, bubble);
          } catch (e) {
            if (typeof fn === "object" && fn.handleEvent) {
              el.removeEventListener(evt, function (e) {
                fn.handleEvent.call(fn, e);
              }, bubble);
            } else {
              throw e;
            }
          }
        } else if ("detachEvent" in el) {
          if (typeof fn === "object" && fn.handleEvent) {
            el.detachEvent("on" + evt, function () {
              fn.handleEvent.call(fn);
            });
          } else {
            el.detachEvent("on" + evt, fn);
          }
        }
      },
    
      /**
       * Get the children of any element
       *
       * @param  {element}
       * @return {array} Returns matching elements in an array
       */
      getChildren = function (e) {
        if (e.children.length < 1) {
          throw new Error("The Nav container has no containing elements");
        }
        // Store all children in array
        var children = [];
        // Loop through children and store in array if child != TextNode
        for (var i = 0; i < e.children.length; i++) {
          if (e.children[i].nodeType === 1) {
            children.push(e.children[i]);
          }
        }
        return children;
      },
    
      /**
       * Sets multiple attributes at once
       *
       * @param {element} element
       * @param {attrs}   attrs
       */
      setAttributes = function (el, attrs) {
        for (var key in attrs) {
          el.setAttribute(key, attrs[key]);
        }
      },
    
      /**
       * Adds a class to any element
       *
       * @param {element} element
       * @param {string}  class
       */
      addClass = function (el, cls) {
        if (el.className.indexOf(cls) !== 0) {
          el.className += " " + cls;
          el.className = el.className.replace(/(^\s*)|(\s*$)/g,"");
        }
      },
    
      /**
       * Remove a class from any element
       *
       * @param  {element} element
       * @param  {string}  class
       */
      removeClass = function (el, cls) {
        var reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
        el.className = el.className.replace(reg, " ").replace(/(^\s*)|(\s*$)/g,"");
      },
    
      /**
       * forEach method that passes back the stuff we need
       *
       * @param  {array}    array
       * @param  {Function} callback
       * @param  {scope}    scope
       */
      forEach = function (array, callback, scope) {
        for (var i = 0; i < array.length; i++) {
          callback.call(scope, i, array[i]);
        }
      };

    var nav,
      opts,
      navToggle,
      styleElement = document.createElement("style"),
      htmlEl = document.documentElement,
      hasAnimFinished,
      isMobile,
      navOpen;

    var ResponsiveNav = function (el, options) {
        var i;

        /**
         * Default options
         * @type {Object}
         */
        this.options = {
          animate: true,                    // Boolean: Use CSS3 transitions, true or false
          transition: 284,                  // Integer: Speed of the transition, in milliseconds
          label: "Menu",                    // String: Label for the navigation toggle
          insert: "before",                 // String: Insert the toggle before or after the navigation
          customToggle: "",                 // Selector: Specify the ID of a custom toggle
          closeOnNavClick: false,           // Boolean: Close the navigation when one of the links are clicked
          openPos: "relative",              // String: Position of the opened nav, relative or static
          navClass: "nav-collapse",         // String: Default CSS class. If changed, you need to edit the CSS too!
          navActiveClass: "js-nav-active",  // String: Class that is added to <html> element when nav is active
          jsClass: "js",                    // String: 'JS enabled' class which is added to <html> element
          init: function(){},               // Function: Init callback
          open: function(){},               // Function: Open callback
          close: function(){}               // Function: Close callback
        };

        // User defined options
        for (i in options) {
          this.options[i] = options[i];
        }

        // Adds "js" class for <html>
        addClass(htmlEl, this.options.jsClass);

        // Wrapper
        this.wrapperEl = el.replace("#", "");

        // Try selecting ID first
        if (document.getElementById(this.wrapperEl)) {
          this.wrapper = document.getElementById(this.wrapperEl);

        // If element with an ID doesn't exist, use querySelector
        } else if (document.querySelector(this.wrapperEl)) {
          this.wrapper = document.querySelector(this.wrapperEl);

        // If element doesn't exists, stop here.
        } else {
          throw new Error("The nav element you are trying to select doesn't exist");
        }

        // Inner wrapper
        this.wrapper.inner = getChildren(this.wrapper);

        // For minification
        opts = this.options;
        nav = this.wrapper;

        // Init
        this._init(this);
      };

    ResponsiveNav.prototype = {

      /**
       * Unattaches events and removes any classes that were added
       */
      destroy: function () {
        this._removeStyles();
        removeClass(nav, "closed");
        removeClass(nav, "opened");
        removeClass(nav, opts.navClass);
        removeClass(nav, opts.navClass + "-" + this.index);
        removeClass(htmlEl, opts.navActiveClass);
        nav.removeAttribute("style");
        nav.removeAttribute("aria-hidden");

        removeEvent(window, "resize", this, false);
        removeEvent(window, "focus", this, false);
        removeEvent(document.body, "touchmove", this, false);
        removeEvent(navToggle, "touchstart", this, false);
        removeEvent(navToggle, "touchend", this, false);
        removeEvent(navToggle, "mouseup", this, false);
        removeEvent(navToggle, "keyup", this, false);
        removeEvent(navToggle, "click", this, false);

        if (!opts.customToggle) {
          navToggle.parentNode.removeChild(navToggle);
        } else {
          navToggle.removeAttribute("aria-hidden");
        }
      },

      /**
       * Toggles the navigation open/close
       */
      toggle: function () {
        if (hasAnimFinished === true) {
          if (!navOpen) {
            this.open();
          } else {
            this.close();
          }

          // Enable pointer events again
          this._enablePointerEvents();
        }
      },

      /**
       * Opens the navigation
       */
      open: function () {
        if (!navOpen) {
          removeClass(nav, "closed");
          addClass(nav, "opened");
          addClass(htmlEl, opts.navActiveClass);
          addClass(navToggle, "active");
          nav.style.position = opts.openPos;
          setAttributes(nav, {"aria-hidden": "false"});
          navOpen = true;
          opts.open();
        }
      },

      /**
       * Closes the navigation
       */
      close: function () {
        if (navOpen) {
          addClass(nav, "closed");
          removeClass(nav, "opened");
          removeClass(htmlEl, opts.navActiveClass);
          removeClass(navToggle, "active");
          setAttributes(nav, {"aria-hidden": "true"});

          // If animations are enabled, wait until they finish
          if (opts.animate) {
            hasAnimFinished = false;
            setTimeout(function () {
              nav.style.position = "absolute";
              hasAnimFinished = true;
            }, opts.transition + 10);

          // Animations aren't enabled, we can do these immediately
          } else {
            nav.style.position = "absolute";
          }

          navOpen = false;
          opts.close();
        }
      },

      /**
       * Resize is called on window resize and orientation change.
       * It initializes the CSS styles and height calculations.
       */
      resize: function () {

        // Resize watches navigation toggle's display state
        if (window.getComputedStyle(navToggle, null).getPropertyValue("display") !== "none") {

          isMobile = true;
          setAttributes(navToggle, {"aria-hidden": "false"});

          // If the navigation is hidden
          if (nav.className.match(/(^|\s)closed(\s|$)/)) {
            setAttributes(nav, {"aria-hidden": "true"});
            nav.style.position = "absolute";
          }

          this._createStyles();
          this._calcHeight();
        } else {

          isMobile = false;
          setAttributes(navToggle, {"aria-hidden": "true"});
          setAttributes(nav, {"aria-hidden": "false"});
          nav.style.position = opts.openPos;
          this._removeStyles();
        }
      },

      /**
       * Takes care of all even handling
       *
       * @param  {event} event
       * @return {type} returns the type of event that should be used
       */
      handleEvent: function (e) {
        var evt = e || window.event;

        switch (evt.type) {
        case "touchstart":
          this._onTouchStart(evt);
          break;
        case "touchmove":
          this._onTouchMove(evt);
          break;
        case "touchend":
        case "mouseup":
          this._onTouchEnd(evt);
          break;
        case "click":
          this._preventDefault(evt);
          break;
        case "keyup":
          this._onKeyUp(evt);
          break;
        case "focus":
        case "resize":
          this.resize(evt);
          break;
        }
      },

      /**
       * Initializes the widget
       */
      _init: function () {
        this.index = index++;

        addClass(nav, opts.navClass);
        addClass(nav, opts.navClass + "-" + this.index);
        addClass(nav, "closed");
        hasAnimFinished = true;
        navOpen = false;

        this._closeOnNavClick();
        this._createToggle();
        this._transitions();
        this.resize();

        /**
         * On IE8 the resize event triggers too early for some reason
         * so it's called here again on init to make sure all the
         * calculated styles are correct.
         */
        var self = this;
        setTimeout(function () {
          self.resize();
        }, 20);

        addEvent(window, "resize", this, false);
        addEvent(window, "focus", this, false);
        addEvent(document.body, "touchmove", this, false);
        addEvent(navToggle, "touchstart", this, false);
        addEvent(navToggle, "touchend", this, false);
        addEvent(navToggle, "mouseup", this, false);
        addEvent(navToggle, "keyup", this, false);
        addEvent(navToggle, "click", this, false);

        /**
         * Init callback here
         */
        opts.init();
      },

      /**
       * Creates Styles to the <head>
       */
      _createStyles: function () {
        if (!styleElement.parentNode) {
          styleElement.type = "text/css";
          document.getElementsByTagName("head")[0].appendChild(styleElement);
        }
      },

      /**
       * Removes styles from the <head>
       */
      _removeStyles: function () {
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      },

      /**
       * Creates Navigation Toggle
       */
      _createToggle: function () {

        // If there's no toggle, let's create one
        if (!opts.customToggle) {
          var toggle = document.createElement("a");
          toggle.innerHTML = opts.label;
          setAttributes(toggle, {
            "href": "#",
            "class": "nav-toggle"
          });

          // Determine where to insert the toggle
          if (opts.insert === "after") {
            nav.parentNode.insertBefore(toggle, nav.nextSibling);
          } else {
            nav.parentNode.insertBefore(toggle, nav);
          }

          navToggle = toggle;

        // There is a toggle already, let's use that one
        } else {
          var toggleEl = opts.customToggle.replace("#", "");

          if (document.getElementById(toggleEl)) {
            navToggle = document.getElementById(toggleEl);
          } else if (document.querySelector(toggleEl)) {
            navToggle = document.querySelector(toggleEl);
          } else {
            throw new Error("The custom nav toggle you are trying to select doesn't exist");
          }
        }
      },

      /**
       * Closes the navigation when a link inside is clicked
       */
      _closeOnNavClick: function () {
        if (opts.closeOnNavClick) {
          var links = nav.getElementsByTagName("a"),
            self = this;
          forEach(links, function (i, el) {
            addEvent(links[i], "click", function () {
              if (isMobile) {
                self.toggle();
              }
            }, false);
          });
        }
      },

      /**
       * Prevents the default tap functionality
       *
       * @param  {event} event
       */
      _preventDefault: function(e) {
        if (e.preventDefault) {
          if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
          }
          e.preventDefault();
          e.stopPropagation();
          return false;

        // This is strictly for old IE
        } else {
          e.returnValue = false;
        }
      },

      /**
       * On touch start get the location of the touch
       * and disable pointer events on the body.
       *
       * @param  {event} event
       */
      _onTouchStart: function (e) {
        this._preventDefault(e);
        addClass(document.body, "disable-pointer-events");
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.touchHasMoved = false;

        /**
         * We remove mouseup event completely here to avoid
         * double triggering of events.
         */
        removeEvent(navToggle, "mouseup", this, false);
      },

      /**
       * Check if the user is scrolling instead of tapping and
       * re-enable pointer events if movement happed.
       *
       * @param  {event} event
       */
      _onTouchMove: function (e) {
        if (Math.abs(e.touches[0].clientX - this.startX) > 10 ||
        Math.abs(e.touches[0].clientY - this.startY) > 10) {
          this._enablePointerEvents();
          this.touchHasMoved = true;
        }
      },

      /**
       * On touch end toggle either the whole navigation or
       * a sub-navigation depending on which one was tapped.
       *
       * @param  {event} event
       */
      _onTouchEnd: function (e) {
        this._preventDefault(e);
        if (!isMobile) {
          return;
        }

        // If the user isn't scrolling
        if (!this.touchHasMoved) {

          // If the event type is touch
          if (e.type === "touchend") {
            this.toggle();
            if (opts.insert === "after") {
              setTimeout(function () {
                removeClass(document.body, "disable-pointer-events");
              }, opts.transition + 300);
            }
            return;

          // Event type was click, not touch
          } else {
            var evt = e || window.event;

            // If it isn't a right click, do toggling
            if (!(evt.which === 3 || evt.button === 2)) {
              this.toggle();
            }
          }
        }
      },

      /**
       * For keyboard accessibility, toggle the navigation on Enter
       * keypress too (also sub-navigation is keyboard accessible
       * which explains the complexity here)
       *
       * @param  {event} event
       */
      _onKeyUp: function (e) {
        var evt = e || window.event;
        if (evt.keyCode === 13) {
          this.toggle();
        }
      },

      /**
       * Enable pointer events
       */
      _enablePointerEvents: function () {
        removeClass(document.body, "disable-pointer-events");
      },

      /**
       * Adds the needed CSS transitions if animations are enabled
       */
      _transitions: function () {
        if (opts.animate) {
          var objStyle = nav.style,
            transition = "max-height " + opts.transition + "ms";

          objStyle.WebkitTransition = transition;
          objStyle.MozTransition = transition;
          objStyle.OTransition = transition;
          objStyle.transition = transition;
        }
      },

      /**
       * Calculates the height of the navigation and then creates
       * styles which are later added to the page <head>
       */
      _calcHeight: function () {
        var savedHeight = 0;
        for (var i = 0; i < nav.inner.length; i++) {
          savedHeight += nav.inner[i].offsetHeight;
        }

        // Pointer event styles are also here since they might only be confusing inside the stylesheet
        var innerStyles = "." + opts.jsClass + " ." + opts.navClass + "-" + this.index + ".opened{max-height:" + savedHeight + "px !important} ." + opts.jsClass + " .disable-pointer-events{pointer-events:none !important} ." + opts.jsClass + " ." + opts.navClass + "-" + this.index + ".opened.dropdown-active {max-height:9999px !important}";


        if (styleElement.styleSheet) {
          styleElement.styleSheet.cssText = innerStyles;
        } else {
          styleElement.innerHTML = innerStyles;
        }

        innerStyles = "";
      }

    };

    /**
     * Return new Responsive Nav
     */
    return new ResponsiveNav(el, options);

  };

  window.responsiveNav = responsiveNav;

}(document, window, 0));









(function(f,e,b,g,c,d,h){/*! Jssor */
new(function(){this.$DebugMode=c;this.$Log=function(c,d){var a=f.console||{},b=this.$DebugMode;if(b&&a.log)a.log(c);else b&&d&&alert(c)};this.$Error=function(b,d){var c=f.console||{},a=this.$DebugMode;if(a&&c.error)c.error(b);else a&&alert(b);if(a)throw d||new Error(b);};this.$Fail=function(a){throw new Error(a);};this.$Assert=function(b,c){var a=this.$DebugMode;if(a)if(!b)throw new Error("Assert failed "+c||"");};this.$Trace=function(c){var a=f.console||{},b=this.$DebugMode;b&&a.log&&a.log(c)};this.$Execute=function(b){var a=this.$DebugMode;a&&b()};this.$LiveStamp=function(c,d){var b=this.$DebugMode;if(b){var a=e.createElement("DIV");a.setAttribute("id",d);c.$Live=a}};this.$C_AbstractMethod=function(){throw new Error("The method is abstract, it should be implemented by subclass.");};function a(b){if(b.constructor===a.caller)throw new Error("Cannot create instance of an abstract class.");}this.$C_AbstractClass=a});var k=f.$JssorEasing$={$EaseLinear:function(a){return a},$EaseGoBack:function(a){return 1-b.abs(2-1)},$EaseSwing:function(a){return-b.cos(a*b.PI)/2+.5},$EaseInQuad:function(a){return a*a},$EaseOutQuad:function(a){return-a*(a-2)},$EaseInOutQuad:function(a){return(a*=2)<1?1/2*a*a:-1/2*(--a*(a-2)-1)},$EaseInCubic:function(a){return a*a*a},$EaseOutCubic:function(a){return(a-=1)*a*a+1},$EaseInOutCubic:function(a){return(a*=2)<1?1/2*a*a*a:1/2*((a-=2)*a*a+2)},$EaseInQuart:function(a){return a*a*a*a},$EaseOutQuart:function(a){return-((a-=1)*a*a*a-1)},$EaseInOutQuart:function(a){return(a*=2)<1?1/2*a*a*a*a:-1/2*((a-=2)*a*a*a-2)},$EaseInQuint:function(a){return a*a*a*a*a},$EaseOutQuint:function(a){return(a-=1)*a*a*a*a+1},$EaseInOutQuint:function(a){return(a*=2)<1?1/2*a*a*a*a*a:1/2*((a-=2)*a*a*a*a+2)},$EaseInSine:function(a){return 1-b.cos(a*b.PI/2)},$EaseOutSine:function(a){return b.sin(a*b.PI/2)},$EaseInOutSine:function(a){return-1/2*(b.cos(b.PI*a)-1)},$EaseInExpo:function(a){return a==0?0:b.pow(2,10*(a-1))},$EaseOutExpo:function(a){return a==1?1:-b.pow(2,-10*a)+1},$EaseInOutExpo:function(a){return a==0||a==1?a:(a*=2)<1?1/2*b.pow(2,10*(a-1)):1/2*(-b.pow(2,-10*--a)+2)},$EaseInCirc:function(a){return-(b.sqrt(1-a*a)-1)},$EaseOutCirc:function(a){return b.sqrt(1-(a-=1)*a)},$EaseInOutCirc:function(a){return(a*=2)<1?-1/2*(b.sqrt(1-a*a)-1):1/2*(b.sqrt(1-(a-=2)*a)+1)},$EaseInElastic:function(a){if(!a||a==1)return a;var c=.3,d=.075;return-(b.pow(2,10*(a-=1))*b.sin((a-d)*2*b.PI/c))},$EaseOutElastic:function(a){if(!a||a==1)return a;var c=.3,d=.075;return b.pow(2,-10*a)*b.sin((a-d)*2*b.PI/c)+1},$EaseInOutElastic:function(a){if(!a||a==1)return a;var c=.45,d=.1125;return(a*=2)<1?-.5*b.pow(2,10*(a-=1))*b.sin((a-d)*2*b.PI/c):b.pow(2,-10*(a-=1))*b.sin((a-d)*2*b.PI/c)*.5+1},$EaseInBack:function(a){var b=1.70158;return a*a*((b+1)*a-b)},$EaseOutBack:function(a){var b=1.70158;return(a-=1)*a*((b+1)*a+b)+1},$EaseInOutBack:function(a){var b=1.70158;return(a*=2)<1?1/2*a*a*(((b*=1.525)+1)*a-b):1/2*((a-=2)*a*(((b*=1.525)+1)*a+b)+2)},$EaseInBounce:function(a){return 1-k.$EaseOutBounce(1-a)},$EaseOutBounce:function(a){return a<1/2.75?7.5625*a*a:a<2/2.75?7.5625*(a-=1.5/2.75)*a+.75:a<2.5/2.75?7.5625*(a-=2.25/2.75)*a+.9375:7.5625*(a-=2.625/2.75)*a+.984375},$EaseInOutBounce:function(a){return a<1/2?k.$EaseInBounce(a*2)*.5:k.$EaseOutBounce(a*2-1)*.5+.5},$EaseInWave:function(a){return 1-b.cos(a*b.PI*2)},$EaseOutWave:function(a){return b.sin(a*b.PI*2)},$EaseOutJump:function(a){return 1-((a*=2)<1?(a=1-a)*a*a:(a-=1)*a*a)},$EaseInJump:function(a){return(a*=2)<1?a*a*a:(a=2-a)*a*a}},o=f.$JssorDirection$={$TO_LEFT:1,$TO_RIGHT:2,$TO_TOP:4,$TO_BOTTOM:8,$HORIZONTAL:3,$VERTICAL:12,$LEFTRIGHT:3,$TOPBOTOM:12,$TOPLEFT:5,$TOPRIGHT:6,$BOTTOMLEFT:9,$BOTTOMRIGHT:10,$AROUND:15,$GetDirectionHorizontal:function(a){return a&3},$GetDirectionVertical:function(a){return a&12},$ChessHorizontal:function(a){return(~a&3)+(a&12)},$ChessVertical:function(a){return(~a&12)+(a&3)},$IsToLeft:function(a){return(a&3)==1},$IsToRight:function(a){return(a&3)==2},$IsToTop:function(a){return(a&12)==4},$IsToBottom:function(a){return(a&12)==8},$IsHorizontal:function(a){return(a&3)>0},$IsVertical:function(a){return(a&12)>0}},p={$BACKSPACE:8,$COMMA:188,$DELETE:46,$DOWN:40,$END:35,$ENTER:13,$ESCAPE:27,$HOME:36,$LEFT:37,$NUMPAD_ADD:107,$NUMPAD_DECIMAL:110,$NUMPAD_DIVIDE:111,$NUMPAD_ENTER:108,$NUMPAD_MULTIPLY:106,$NUMPAD_SUBTRACT:109,$PAGE_DOWN:34,$PAGE_UP:33,$PERIOD:190,$RIGHT:39,$SPACE:32,$TAB:9,$UP:38},m,i,a=f.$Jssor$=new function(){var i=this,L=/\S+/g,lb=1,F=2,F=3,fb=4,jb=5,q=0,l=0,t=0,Y=0,D=0,qb=navigator.appName,k=navigator.userAgent,p=e.documentElement,B;function x(){if(!q)if(qb=="Microsoft Internet Explorer"&&!!f.attachEvent&&!!f.ActiveXObject){var d=k.indexOf("MSIE");q=lb;t=n(k.substring(d+5,k.indexOf(";",d)));/*@cc_on Y=@_jscript_version@*/;l=e.documentMode||t}else if(qb=="Netscape"&&!!f.addEventListener){var c=k.indexOf("Firefox"),a=k.indexOf("Safari"),h=k.indexOf("Chrome"),b=k.indexOf("AppleWebKit");if(c>=0){q=F;l=n(k.substring(c+8))}else if(a>=0){var i=k.substring(0,a).lastIndexOf("/");q=h>=0?fb:F;l=n(k.substring(i+1,a))}if(b>=0)D=n(k.substring(b+12))}else{var g=/(opera)(?:.*version|)[ \/]([\w.]+)/i.exec(k);if(g){q=jb;l=n(g[2])}}}function s(){x();return q==lb}function N(){return s()&&(l<6||e.compatMode=="BackCompat")}function rb(){x();return q==F}function eb(){x();return q==F}function db(){x();return q==fb}function ib(){x();return q==jb}function Z(){return eb()&&D>534&&D<535}function A(){return s()&&l<9}function u(a){if(!B){j(["transform","WebkitTransform","msTransform","MozTransform","OTransform"],function(b){if(a.style[b]!=h){B=b;return c}});B=B||"transform"}return B}function ob(a){return Object.prototype.toString.call(a)}var I;function j(a,d){if(ob(a)=="[object Array]"){for(var b=0;b<a.length;b++)if(d(a[b],b,a))return c}else for(var e in a)if(d(a[e],e,a))return c}function vb(){if(!I){I={};j(["Boolean","Number","String","Function","Array","Date","RegExp","Object"],function(a){I["[object "+a+"]"]=a.toLowerCase()})}return I}function z(a){return a==g?String(a):vb()[ob(a)]||"object"}function wb(a){if(!a||z(a)!=="object"||a.nodeType||i.$IsWindow(a))return d;var b=Object.prototype.hasOwnProperty;try{if(a.constructor&&!b.call(a,"constructor")&&!b.call(a.constructor.prototype,"isPrototypeOf"))return d}catch(e){return d}var c;for(c in a);return c===h||b.call(a,c)}function y(a,b){return{x:a,y:b}}function pb(b,a){setTimeout(b,a||0)}function G(b,d,c){var a=!b||b=="inherit"?"":b;j(d,function(c){var b=c.exec(a);if(b){var d=a.substr(0,b.index),e=a.substr(b.lastIndex+1,a.length-(b.lastIndex+1));a=d+e}});a=c+(a.indexOf(" ")!=0?" ":"")+a;return a}function bb(b,a){if(l<9)b.style.filter=a}function sb(b,a,c){if(Y<9){var e=b.style.filter,g=new RegExp(/[\s]*progid:DXImageTransform\.Microsoft\.Matrix\([^\)]*\)/g),f=a?"progid:DXImageTransform.Microsoft.Matrix(M11="+a[0][0]+", M12="+a[0][1]+", M21="+a[1][0]+", M22="+a[1][1]+", SizingMethod='auto expand')":"",d=G(e,[g],f);bb(b,d);i.$CssMarginTop(b,c.y);i.$CssMarginLeft(b,c.x)}}i.$IsBrowserIE=s;i.$IsBrowserIeQuirks=N;i.$IsBrowserFireFox=rb;i.$IsBrowserSafari=eb;i.$IsBrowserChrome=db;i.$IsBrowserOpera=ib;i.$IsBrowserBadTransform=Z;i.$IsBrowserIe9Earlier=A;i.$BrowserVersion=function(){return l};i.$BrowserEngineVersion=function(){return t||l};i.$WebKitVersion=function(){x();return D};i.$Delay=pb;i.$Inherit=function(a,b){b.apply(a,[].slice.call(arguments,2));return U({},a)};function mb(a){a.constructor===mb.caller&&a.$Construct&&a.$Construct()}i.$Construct=mb;i.$GetElement=function(a){if(i.$IsString(a))a=e.getElementById(a);return a};function v(a){return a||f.event}i.$GetEvent=v;i.$EventSrc=function(a){a=v(a);return a.target||a.srcElement||e};i.$EventDst=function(a){a=v(a);return a.relatedTarget||a.toElement};i.$MousePosition=function(a){a=v(a);var b=e.body;return{x:a.pageX||a.clientX+(p.scrollLeft||b.scrollLeft||0)-(p.clientLeft||b.clientLeft||0)||0,y:a.pageY||a.clientY+(p.scrollTop||b.scrollTop||0)-(p.clientTop||b.clientTop||0)||0}};i.$PageScroll=function(){var a=e.body;return{x:(f.pageXOffset||p.scrollLeft||a.scrollLeft||0)-(p.clientLeft||a.clientLeft||0),y:(f.pageYOffset||p.scrollTop||a.scrollTop||0)-(p.clientTop||a.clientTop||0)}};i.$WindowSize=function(){var a=e.body;return{x:a.clientWidth||p.clientWidth,y:a.clientHeight||p.clientHeight}};function E(c,d,a){if(a!=h)c.style[d]=a;else{var b=c.currentStyle||c.style;a=b[d];if(a==""&&f.getComputedStyle){b=c.ownerDocument.defaultView.getComputedStyle(c,g);b&&(a=b.getPropertyValue(d)||b[d])}return a}}function V(b,c,a,d){if(a!=h){d&&(a+="px");E(b,c,a)}else return n(E(b,c))}function zb(b,d,a){return V(b,d,a,c)}function o(d,a){var b=a&2,c=a?V:E;return function(e,a){return c(e,d,a,b)}}function tb(b){if(s()&&t<9){var a=/opacity=([^)]*)/.exec(b.style.filter||"");return a?n(a[1])/100:1}else return n(b.style.opacity||"1")}function ub(c,a,f){if(s()&&t<9){var h=c.style.filter||"",i=new RegExp(/[\s]*alpha\([^\)]*\)/g),e=b.round(100*a),d="";if(e<100||f)d="alpha(opacity="+e+") ";var g=G(h,[i],d);bb(c,g)}else c.style.opacity=a==1?"":b.round(a*100)/100}function X(e,a){var d=a.$Rotate||0,c=a.$Scale==h?1:a.$Scale;if(A()){var l=i.$CreateMatrix(d/180*b.PI,c,c);sb(e,!d&&c==1?g:l,i.$GetMatrixOffset(l,a.$OriginalWidth,a.$OriginalHeight))}else{var j=u(e);if(j){var k="rotate("+d%360+"deg) scale("+c+")";if(db()&&D>535&&"ontouchstart"in f)k+=" perspective(2000px)";e.style[j]=k}}}i.$SetStyleTransform=function(b,a){if(Z())pb(i.$CreateCallback(g,X,b,a));else X(b,a)};i.$SetStyleTransformOrigin=function(b,c){var a=u(b);if(a)b.style[a+"Origin"]=c};i.$CssScale=function(a,c){if(s()&&t<9||t<10&&N())a.style.zoom=c==1?"":c;else{var b=u(a);if(b){var f="scale("+c+")",e=a.style[b],g=new RegExp(/[\s]*scale\(.*?\)/g),d=G(e,[g],f);a.style[b]=d}}};i.$EnableHWA=function(a){if(!a.style[u(a)]||a.style[u(a)]=="none")a.style[u(a)]="perspective(2000px)"};i.$DisableHWA=function(a){a.style[u(a)]="none"};var hb=0,cb=0;i.$WindowResizeFilter=function(b,a){return A()?function(){var h=c,e=N()?b.document.body:b.document.documentElement;if(e){var g=e.offsetWidth-hb,f=e.offsetHeight-cb;if(g||f){hb+=g;cb+=f}else h=d}h&&a()}:a};i.$MouseOverOutFilter=function(b,a){return function(c){c=v(c);var e=c.type,d=c.relatedTarget||(e=="mouseout"?c.toElement:c.fromElement);(!d||d!==a&&!i.$IsChild(a,d))&&b(c)}};i.$AddEvent=function(a,c,d,b){a=i.$GetElement(a);if(a.addEventListener){c=="mousewheel"&&a.addEventListener("DOMMouseScroll",d,b);a.addEventListener(c,d,b)}else if(a.attachEvent){a.attachEvent("on"+c,d);b&&a.setCapture&&a.setCapture()}};i.$RemoveEvent=function(a,c,d,b){a=i.$GetElement(a);if(a.removeEventListener){c=="mousewheel"&&a.removeEventListener("DOMMouseScroll",d,b);a.removeEventListener(c,d,b)}else if(a.detachEvent){a.detachEvent("on"+c,d);b&&a.releaseCapture&&a.releaseCapture()}};i.$FireEvent=function(c,b){var a;if(e.createEvent){a=e.createEvent("HTMLEvents");a.initEvent(b,d,d);c.dispatchEvent(a)}else{var f="on"+b;a=e.createEventObject();c.fireEvent(f,a)}};i.$AddEventBrowserMouseUp=function(b,a){i.$AddEvent(A()?e:f,"mouseup",b,a)};i.$RemoveEventBrowserMouseUp=function(b,a){i.$RemoveEvent(A()?e:f,"mouseup",b,a)};i.$CancelEvent=function(a){a=v(a);a.preventDefault&&a.preventDefault();a.cancel=c;a.returnValue=d};i.$StopEvent=function(a){a=v(a);a.stopPropagation&&a.stopPropagation();a.cancelBubble=c};i.$CreateCallback=function(d,c){var a=[].slice.call(arguments,2),b=function(){var b=a.concat([].slice.call(arguments,0));return c.apply(d,b)};return b};var J;i.$FreeElement=function(b){if(!J)J=i.$CreateDiv();if(b){a.$AppendChild(J,b);a.$ClearInnerHtml(J)}};i.$InnerText=function(a,b){if(b==h)return a.textContent||a.innerText;var c=e.createTextNode(b);i.$ClearInnerHtml(a);a.appendChild(c)};i.$InnerHtml=function(a,b){if(b==h)return a.innerHTML;a.innerHTML=b};i.$GetClientRect=function(b){var a=b.getBoundingClientRect();return{x:a.left,y:a.top,w:a.right-a.left,h:a.bottom-a.top}};i.$ClearInnerHtml=function(a){a.innerHTML=""};i.$EncodeHtml=function(b){var a=i.$CreateDiv();i.$InnerText(a,b);return i.$InnerHtml(a)};i.$DecodeHtml=function(b){var a=i.$CreateDiv();i.$InnerHtml(a,b);return i.$InnerText(a)};i.$SelectElement=function(c){var b;if(f.getSelection)b=f.getSelection();var a=g;if(e.createRange){a=e.createRange();a.selectNode(c)}else{a=e.body.createTextRange();a.moveToElementText(c);a.select()}b&&b.addRange(a)};i.$DeselectElements=function(){if(e.selection)e.selection.empty();else f.getSelection&&f.getSelection().removeAllRanges()};i.$Children=function(c){for(var b=[],a=c.firstChild;a;a=a.nextSibling)a.nodeType==1&&b.push(a);return b};function nb(a,c,e,b){b=b||"u";for(a=a?a.firstChild:g;a;a=a.nextSibling)if(a.nodeType==1){if(R(a,b)==c)return a;if(!e){var d=nb(a,c,e,b);if(d)return d}}}i.$FindChild=nb;function P(a,d,f,b){b=b||"u";var c=[];for(a=a?a.firstChild:g;a;a=a.nextSibling)if(a.nodeType==1){R(a,b)==d&&c.push(a);if(!f){var e=P(a,d,f,b);if(e.length)c=c.concat(e)}}return c}function gb(a,c,d){for(a=a?a.firstChild:g;a;a=a.nextSibling)if(a.nodeType==1){if(a.tagName==c)return a;if(!d){var b=gb(a,c,d);if(b)return b}}}i.$FindChildByTag=gb;function ab(a,c,e){var b=[];for(a=a?a.firstChild:g;a;a=a.nextSibling)if(a.nodeType==1){(!c||a.tagName==c)&&b.push(a);if(!e){var d=ab(a,c,e);if(d.length)b=b.concat(d)}}return b}i.$FindChildrenByTag=ab;i.$GetElementsByTag=function(b,a){return b.getElementsByTagName(a)};function U(c){for(var b=1;b<arguments.length;b++){var a=arguments[b];if(a)for(var d in a)c[d]=a[d]}return c}i.$Extend=U;function yb(b,d){var c={};for(var a in b)if(b[a]!==d[a])c[a]=b[a];return c}i.$Unextend=yb;i.$IsUndefined=function(a){return z(a)=="undefined"};i.$IsFunction=function(a){return z(a)=="function"};i.$IsArray=function(a){return z(a)=="array"};i.$IsString=function(a){return z(a)=="string"};i.$IsNumeric=function(a){return!isNaN(n(a))&&isFinite(a)};i.$IsWindow=function(a){return a&&a==a.window};i.$Type=z;i.$Each=j;i.$IsPlainObject=wb;function O(a){return e.createElement(a)}i.$CreateElement=O;i.$CreateDiv=function(){return O("DIV",e)};i.$CreateSpan=function(){return O("SPAN",e)};i.$EmptyFunction=function(){};function S(b,c,a){if(a==h)return b.getAttribute(c);b.setAttribute(c,a)}function R(a,b){return S(a,b)||S(a,"data-"+b)}i.$Attribute=S;i.$AttributeEx=R;function r(b,a){if(a==h)return b.className;b.className=a}i.$ClassName=r;function K(b){var a={};j(b,function(b){a[b]=b});return a}i.$ToHash=K;function W(b,c){var a="";j(c,function(c){a&&(a+=b);a+=c});return a}i.$Join=W;i.$AddClass=function(a,c){var b=r(a)+" "+c;r(a,W(" ",K(b.match(L))))};i.$RemoveClass=function(a,b){r(a,W(" ",i.$Unextend(K(r(a).match(L)),K(b.match(L)))))};i.$ParentNode=function(a){return a.parentNode};i.$HideElement=function(a){i.$CssDisplay(a,"none")};i.$EnableElement=function(a,b){if(b)i.$Attribute(a,"disabled",c);else i.$RemoveAttribute(a,"disabled")};i.$HideElements=function(b){for(var a=0;a<b.length;a++)i.$HideElement(b[a])};i.$ShowElement=function(a,b){i.$CssDisplay(a,b?"none":"")};i.$ShowElements=function(b,c){for(var a=0;a<b.length;a++)i.$ShowElement(b[a],c)};i.$RemoveAttribute=function(b,a){b.removeAttribute(a)};i.$CanClearClip=function(){return s()&&l<10};i.$SetStyleClip=function(d,c){if(c)d.style.clip="rect("+b.round(c.$Top)+"px "+b.round(c.$Right)+"px "+b.round(c.$Bottom)+"px "+b.round(c.$Left)+"px)";else{var g=d.style.cssText,f=[new RegExp(/[\s]*clip: rect\(.*?\)[;]?/i),new RegExp(/[\s]*cliptop: .*?[;]?/i),new RegExp(/[\s]*clipright: .*?[;]?/i),new RegExp(/[\s]*clipbottom: .*?[;]?/i),new RegExp(/[\s]*clipleft: .*?[;]?/i)],e=G(g,f,"");a.$CssCssText(d,e)}};i.$GetNow=function(){return+new Date};i.$AppendChild=function(b,a){b.appendChild(a)};i.$AppendChildren=function(b,a){j(a,function(a){i.$AppendChild(b,a)})};i.$InsertBefore=function(c,b,a){c.insertBefore(b,a)};i.$InsertAdjacentHtml=function(b,a,c){b.insertAdjacentHTML(a,c)};i.$RemoveChild=function(b,a){b.removeChild(a)};i.$RemoveChildren=function(b,a){j(a,function(a){i.$RemoveChild(b,a)})};i.$ClearChildren=function(a){i.$RemoveChildren(a,i.$Children(a))};i.$ParseInt=function(b,a){return parseInt(b,a||10)};function n(a){return parseFloat(a)}i.$ParseFloat=n;i.$IsChild=function(b,a){var c=e.body;while(a&&b!=a&&c!=a)try{a=a.parentNode}catch(f){return d}return b==a};function T(d,c,b){var a=d.cloneNode(!c);!b&&i.$RemoveAttribute(a,"id");return a}i.$CloneNode=T;function M(a){if(a){var b=a.$FlyDirection;if(b&1)a.x=a.$ScaleHorizontal||1;if(b&2)a.x=-a.$ScaleHorizontal||-1;if(b&4)a.y=a.$ScaleVertical||1;if(b&8)a.y=-a.$ScaleVertical||-1;if(a.$Rotate==c)a.$Rotate=1;M(a.$Brother)}}i.$TranslateTransitions=function(a){if(a){for(var b=0;b<a.length;b++)M(a[b]);for(var c in a)M(a[c])}};i.$LoadImage=function(e,f){var a=new Image;function b(c){i.$RemoveEvent(a,"load",b);i.$RemoveEvent(a,"abort",d);i.$RemoveEvent(a,"error",d);f&&f(a,c)}function d(){b(c)}if(ib()&&l<11.6||!e)b(!e);else{i.$AddEvent(a,"load",b);i.$AddEvent(a,"abort",d);i.$AddEvent(a,"error",d);a.src=e}};i.$LoadImages=function(d,a,e){var c=d.length+1;function b(b){c--;if(a&&b&&b.src==a.src)a=b;!c&&e&&e(a)}j(d,function(a){i.$LoadImage(a.src,b)});b()};i.$BuildElement=function(c,h,j,i){if(i)c=T(c);var d=P(c,h);if(!d.length)d=a.$GetElementsByTag(c,h);for(var f=d.length-1;f>-1;f--){var b=d[f],e=T(j);r(e,r(b));a.$CssCssText(e,b.style.cssText);var g=a.$ParentNode(b);a.$InsertBefore(g,e,b);a.$RemoveChild(g,b)}return c};var C;function xb(b){var k=this,m,l,f,e;function g(){var a=m;if(e)a+="ds";else if(l)a+="dn";else if(f==2)a+="pv";else if(f)a+="av";r(b,a)}function n(a){if(e)i.$CancelEvent(a);else{C.push(k);l=c;g()}}k.$MouseUp=function(){l=d;g()};k.$Selected=function(a){if(a!=h){f=a;g()}else return f};k.$Enable=function(a){if(a!=h){e=!a;g()}else return!e};b=i.$GetElement(b);if(!C){i.$AddEventBrowserMouseUp(function(){var a=C;C=[];j(a,function(a){a.$MouseUp()})});C=[]}m=r(b);a.$AddEvent(b,"mousedown",n)}i.$Buttonize=function(a){return new xb(a)};i.$Css=E;i.$CssN=V;i.$CssP=zb;i.$CssOverflow=o("overflow");i.$CssTop=o("top",2);i.$CssLeft=o("left",2);i.$CssWidth=o("width",2);i.$CssHeight=o("height",2);i.$CssMarginLeft=o("marginLeft",2);i.$CssMarginTop=o("marginTop",2);i.$CssPosition=o("position");i.$CssDisplay=o("display");i.$CssZIndex=o("zIndex",1);i.$CssFloat=function(b,a){return E(b,s()?"styleFloat":"cssFloat",a)};i.$CssOpacity=function(b,a,c){if(a!=h)ub(b,a,c);else return tb(b)};i.$CssCssText=function(a,b){if(b!=h)a.style.cssText=b;else return a.style.cssText};var Q={$Opacity:i.$CssOpacity,$Top:i.$CssTop,$Left:i.$CssLeft,$Width:i.$CssWidth,$Height:i.$CssHeight,$Position:i.$CssPosition,$Display:i.$CssDisplay,$ZIndex:i.$CssZIndex},w;function H(){if(!w)w=U({$MarginTop:i.$CssMarginTop,$MarginLeft:i.$CssMarginLeft,$Clip:i.$SetStyleClip,$Transform:i.$SetStyleTransform},Q);return w}function kb(){H();w.$Transform=w.$Transform;return w}i.$StyleSetter=H;i.$StyleSetterEx=kb;i.$GetStyles=function(c,b){H();var a={};j(b,function(d,b){if(Q[b])a[b]=Q[b](c)});return a};i.$SetStyles=function(c,b){var a=H();j(b,function(d,b){a[b]&&a[b](c,d)})};i.$SetStylesEx=function(b,a){kb();i.$SetStyles(b,a)};m=new function(){var a=this;function b(d,g){for(var j=d[0].length,i=d.length,h=g[0].length,f=[],c=0;c<i;c++)for(var k=f[c]=[],b=0;b<h;b++){for(var e=0,a=0;a<j;a++)e+=d[c][a]*g[a][b];k[b]=e}return f}a.$ScaleX=function(b,c){return a.$ScaleXY(b,c,0)};a.$ScaleY=function(b,c){return a.$ScaleXY(b,0,c)};a.$ScaleXY=function(a,c,d){return b(a,[[c,0],[0,d]])};a.$TransformPoint=function(d,c){var a=b(d,[[c.x],[c.y]]);return y(a[0][0],a[1][0])}};i.$CreateMatrix=function(d,a,c){var e=b.cos(d),f=b.sin(d);return[[e*a,-f*c],[f*a,e*c]]};i.$GetMatrixOffset=function(d,c,a){var e=m.$TransformPoint(d,y(-c/2,-a/2)),f=m.$TransformPoint(d,y(c/2,-a/2)),g=m.$TransformPoint(d,y(c/2,a/2)),h=m.$TransformPoint(d,y(-c/2,a/2));return y(b.min(e.x,f.x,g.x,h.x)+c/2,b.min(e.y,f.y,g.y,h.y)+a/2)};i.$Transform=function(j,k,t,q,u,w,h){var c=k;if(j){c={};for(var e in k){var x=w[e]||1,r=u[e]||[0,1],d=(t-r[0])/r[1];d=b.min(b.max(d,0),1);d=d*x;var o=b.floor(d);if(d!=o)d-=o;var v=q[e]||q.$Default,p=v(d),f,s=j[e],n=k[e];if(a.$IsNumeric(n))f=s+(n-s)*p;else{f=a.$Extend({$Offset:{}},j[e]);a.$Each(n.$Offset,function(c,b){var a=c*p;f.$Offset[b]=a;f[b]+=a})}c[e]=f}if(j.$Zoom)c.$Transform={$Rotate:c.$Rotate||0,$Scale:c.$Zoom,$OriginalWidth:h.$OriginalWidth,$OriginalHeight:h.$OriginalHeight}}if(k.$Clip&&h.$Move){var i=c.$Clip.$Offset,m=(i.$Top||0)+(i.$Bottom||0),l=(i.$Left||0)+(i.$Right||0);c.$Left=(c.$Left||0)+l;c.$Top=(c.$Top||0)+m;c.$Clip.$Left-=l;c.$Clip.$Right-=l;c.$Clip.$Top-=m;c.$Clip.$Bottom-=m}if(c.$Clip&&a.$CanClearClip()&&!c.$Clip.$Top&&!c.$Clip.$Left&&c.$Clip.$Right==h.$OriginalWidth&&c.$Clip.$Bottom==h.$OriginalHeight)c.$Clip=g;return c}},l=f.$JssorObject$=function(){var b=this,d=[],c=[];function i(a,b){d.push({$EventName:a,$Handler:b})}function h(b,c){a.$Each(d,function(a,e){a.$EventName==b&&a.$Handler===c&&d.splice(e,1)})}function g(){d=[]}function e(){a.$Each(c,function(b){a.$RemoveEvent(b.$Obj,b.$EventName,b.$Handler)});c=[]}b.$Listen=function(e,b,d,f){a.$AddEvent(e,b,d,f);c.push({$Obj:e,$EventName:b,$Handler:d})};b.$Unlisten=function(e,b,d){a.$Each(c,function(f,g){if(f.$Obj===e&&f.$EventName==b&&f.$Handler===d){a.$RemoveEvent(e,b,d);c.splice(g,1)}})};b.$UnlistenAll=e;b.$On=b.addEventListener=i;b.$Off=b.removeEventListener=h;b.$TriggerEvent=function(b){var c=[].slice.call(arguments,1);a.$Each(d,function(a){try{a.$EventName==b&&a.$Handler.apply(f,c)}catch(d){}})};b.$Destroy=function(){e();g();for(var a in b)delete b[a]}};i=function(n,z,i,R,P,L){n=n||0;var e=this,r,O,o,p,x,A=0,I,J,H,C,E=0,l=0,u=0,D,m=n,t=n+z,j,h,q,y=[],B;function M(a){j+=a;h+=a;m+=a;t+=a;l+=a;u+=a;E=a}function Q(a,b){var c=a-j+n*b;M(c);return h}function w(g,n){var d=g;if(q&&(d>=h||d<=j))d=((d-j)%q+q)%q+j;if(!D||x||n||l!=d){var f=b.min(d,h);f=b.max(f,j);if(!D||x||n||f!=u){if(L){var k=(f-m)/(z||1);if(i.$Reverse)k=1-k;var o=a.$Transform(P,L,k,I,H,J,i);a.$Each(o,function(b,a){B[a]&&B[a](R,b)})}e.$OnInnerOffsetChange(u-m,f-m)}u=f;a.$Each(y,function(b,c){var a=g<l?y[y.length-c-1]:b;a.$GoToPosition(g-E,n)});var r=l,p=g;l=d;D=c;e.$OnPositionChange(r,p)}}function F(a,c,d){c&&a.$Locate(h,1);!d&&(h=b.max(h,a.$GetPosition_OuterEnd()+E));y.push(a)}var s=f.requestAnimationFrame||f.webkitRequestAnimationFrame||f.mozRequestAnimationFrame||f.msRequestAnimationFrame;if(a.$IsBrowserSafari()&&a.$BrowserVersion()<7)s=g;s=s||function(b){a.$Delay(b,i.$Interval)};function K(){if(r){var d=a.$GetNow(),e=b.min(d-A,i.$IntervalMax),c=l+e*p;A=d;if(c*p>=o*p)c=o;w(c);if(!x&&c*p>=o*p)N(C);else s(K)}}function v(d,f,g){if(!r){r=c;x=g;C=f;d=b.max(d,j);d=b.min(d,h);o=d;p=o<l?-1:1;e.$OnStart();A=a.$GetNow();s(K)}}function N(a){if(r){x=r=C=d;e.$OnStop();a&&a()}}e.$Play=function(a,b,c){v(a?l+a:h,b,c)};e.$PlayToPosition=v;e.$PlayToBegin=function(a,b){v(j,a,b)};e.$PlayToEnd=function(a,b){v(h,a,b)};e.$Stop=N;e.$Continue=function(a){v(a)};e.$GetPosition=function(){return l};e.$GetPlayToPosition=function(){return o};e.$GetPosition_Display=function(){return u};e.$GoToPosition=w;e.$GoToBegin=function(){w(j,c)};e.$GoToEnd=function(){w(h,c)};e.$Move=function(a){w(l+a)};e.$CombineMode=function(){return O};e.$GetDuration=function(){return z};e.$IsPlaying=function(){return r};e.$IsOnTheWay=function(){return l>m&&l<=t};e.$SetLoopLength=function(a){q=a};e.$Locate=Q;e.$Shift=M;e.$Join=F;e.$Combine=function(a){F(a,0)};e.$Chain=function(a){F(a,1)};e.$GetPosition_InnerBegin=function(){return m};e.$GetPosition_InnerEnd=function(){return t};e.$GetPosition_OuterBegin=function(){return j};e.$GetPosition_OuterEnd=function(){return h};e.$OnPositionChange=e.$OnStart=e.$OnStop=e.$OnInnerOffsetChange=a.$EmptyFunction;e.$Version=a.$GetNow();i=a.$Extend({$Interval:16,$IntervalMax:50},i);q=i.$LoopLength;B=a.$Extend({},a.$StyleSetter(),i.$Setter);j=m=n;h=t=n+z;J=i.$Round||{};H=i.$During||{};I=a.$Extend({$Default:a.$IsFunction(i.$Easing)&&i.$Easing||k.$EaseSwing},i.$Easing)};var q,j=f.$JssorSlideshowFormations$={};new function(){var u=0,t=1,w=2,v=3,I=1,H=2,J=4,G=8,O=256,P=512,N=1024,M=2048,z=M+I,y=M+H,E=P+I,C=P+H,D=O+J,A=O+G,B=N+J,F=N+G;function S(a){return(a&H)==H}function T(a){return(a&J)==J}function x(b,a,c){c.push(a);b[a]=b[a]||[];b[a].push(c)}j.$FormationStraight=function(f){for(var d=f.$Cols,e=f.$Rows,k=f.$Assembly,l=f.$Count,j=[],a=0,b=0,h=d-1,i=e-1,g=l-1,c,b=0;b<e;b++)for(a=0;a<d;a++){switch(k){case z:c=g-(a*e+(i-b));break;case B:c=g-(b*d+(h-a));break;case E:c=g-(a*e+b);case D:c=g-(b*d+a);break;case y:c=a*e+b;break;case A:c=b*d+(h-a);break;case C:c=a*e+(i-b);break;default:c=b*d+a}x(j,c,[b,a])}return j};j.$FormationSwirl=function(e){var l=e.$Cols,m=e.$Rows,p=e.$Assembly,k=e.$Count,o=[],n=[],i=0,a=0,b=0,f=l-1,g=m-1,h,d,j=0;switch(p){case z:a=f;b=0;d=[w,t,v,u];break;case B:a=0;b=g;d=[u,v,t,w];break;case E:a=f;b=g;d=[v,t,w,u];break;case D:a=f;b=g;d=[t,v,u,w];break;case y:a=0;b=0;d=[w,u,v,t];break;case A:a=f;b=0;d=[t,w,u,v];break;case C:a=0;b=g;d=[v,u,w,t];break;default:a=0;b=0;d=[u,w,t,v]}i=0;while(i<k){h=b+","+a;if(a>=0&&a<l&&b>=0&&b<m&&!n[h]){n[h]=c;x(o,i++,[b,a])}else switch(d[j++%d.length]){case u:a--;break;case w:b--;break;case t:a++;break;case v:b++}switch(d[j%d.length]){case u:a++;break;case w:b++;break;case t:a--;break;case v:b--}}return o};j.$FormationZigZag=function(d){var k=d.$Cols,l=d.$Rows,n=d.$Assembly,j=d.$Count,h=[],i=0,a=0,b=0,e=k-1,f=l-1,m,c,g=0;switch(n){case z:a=e;b=0;c=[w,t,v,t];break;case B:a=0;b=f;c=[u,v,t,v];break;case E:a=e;b=f;c=[v,t,w,t];break;case D:a=e;b=f;c=[t,v,u,v];break;case y:a=0;b=0;c=[w,u,v,u];break;case A:a=e;b=0;c=[t,w,u,w];break;case C:a=0;b=f;c=[v,u,w,u];break;default:a=0;b=0;c=[u,w,t,w]}i=0;while(i<j){m=b+","+a;if(a>=0&&a<k&&b>=0&&b<l&&typeof h[m]=="undefined"){x(h,i++,[b,a]);switch(c[g%c.length]){case u:a++;break;case w:b++;break;case t:a--;break;case v:b--}}else{switch(c[g++%c.length]){case u:a--;break;case w:b--;break;case t:a++;break;case v:b++}switch(c[g++%c.length]){case u:a++;break;case w:b++;break;case t:a--;break;case v:b--}}}return h};j.$FormationStraightStairs=function(h){var l=h.$Cols,m=h.$Rows,e=h.$Assembly,k=h.$Count,i=[],j=0,c=0,d=0,f=l-1,g=m-1,o=k-1;switch(e){case z:case C:case E:case y:var a=0,b=0;break;case A:case B:case D:case F:var a=f,b=0;break;default:e=F;var a=f,b=0}c=a;d=b;while(j<k){if(T(e)||S(e))x(i,o-j++,[d,c]);else x(i,j++,[d,c]);switch(e){case z:case C:c--;d++;break;case E:case y:c++;d--;break;case A:case B:c--;d--;break;case F:case D:default:c++;d++}if(c<0||d<0||c>f||d>g){switch(e){case z:case C:a++;break;case A:case B:case E:case y:b++;break;case F:case D:default:a--}if(a<0||b<0||a>f||b>g){switch(e){case z:case C:a=f;b++;break;case E:case y:b=g;a++;break;case A:case B:b=g;a--;break;case F:case D:default:a=0;b++}if(b>g)b=g;else if(b<0)b=0;else if(a>f)a=f;else if(a<0)a=0}d=b;c=a}}return i};j.$FormationSquare=function(h){var a=h.$Cols||1,c=h.$Rows||1,i=[],d,e,f,g,j;f=a<c?(c-a)/2:0;g=a>c?(a-c)/2:0;j=b.round(b.max(a/2,c/2))+1;for(d=0;d<a;d++)for(e=0;e<c;e++)x(i,j-b.min(d+1+f,e+1+g,a-d+f,c-e+g),[e,d]);return i};j.$FormationRectangle=function(f){var d=f.$Cols||1,e=f.$Rows||1,g=[],a,c,h;h=b.round(b.min(d/2,e/2))+1;for(a=0;a<d;a++)for(c=0;c<e;c++)x(g,h-b.min(a+1,c+1,d-a,e-c),[c,a]);return g};j.$FormationRandom=function(d){for(var e=[],a,c=0;c<d.$Rows;c++)for(a=0;a<d.$Cols;a++)x(e,b.ceil(1e5*b.random())%13,[c,a]);return e};j.$FormationCircle=function(d){for(var e=d.$Cols||1,f=d.$Rows||1,g=[],a,h=e/2-.5,i=f/2-.5,c=0;c<e;c++)for(a=0;a<f;a++)x(g,b.round(b.sqrt(b.pow(c-h,2)+b.pow(a-i,2))),[a,c]);return g};j.$FormationCross=function(d){for(var e=d.$Cols||1,f=d.$Rows||1,g=[],a,h=e/2-.5,i=f/2-.5,c=0;c<e;c++)for(a=0;a<f;a++)x(g,b.round(b.min(b.abs(c-h),b.abs(a-i))),[a,c]);return g};j.$FormationRectangleCross=function(f){for(var g=f.$Cols||1,h=f.$Rows||1,i=[],a,d=g/2-.5,e=h/2-.5,j=b.max(d,e)+1,c=0;c<g;c++)for(a=0;a<h;a++)x(i,b.round(j-b.max(d-b.abs(c-d),e-b.abs(a-e)))-1,[a,c]);return i};function Q(a){var b=a.$Formation(a);return a.$Reverse?b.reverse():b}function K(g,f){var e={$Interval:f,$Duration:1,$Delay:0,$Cols:1,$Rows:1,$Opacity:0,$Zoom:0,$Clip:0,$Move:d,$SlideOut:d,$Reverse:d,$Formation:j.$FormationRandom,$Assembly:F,$ChessMode:{$Column:0,$Row:0},$Easing:k.$EaseSwing,$Round:{},$Blocks:[],$During:{}};a.$Extend(e,g);e.$Count=e.$Cols*e.$Rows;if(a.$IsFunction(e.$Easing))e.$Easing={$Default:e.$Easing};e.$FramesCount=b.ceil(e.$Duration/e.$Interval);e.$EasingInstance=R(e);e.$GetBlocks=function(b,a){b/=e.$Cols;a/=e.$Rows;var f=b+"x"+a;if(!e.$Blocks[f]){e.$Blocks[f]={$Width:b,$Height:a};for(var c=0;c<e.$Cols;c++)for(var d=0;d<e.$Rows;d++)e.$Blocks[f][d+","+c]={$Top:d*a,$Right:c*b+b,$Bottom:d*a+a,$Left:c*b}}return e.$Blocks[f]};if(e.$Brother){e.$Brother=K(e.$Brother,f);e.$SlideOut=c}return e}function R(d){var c=d.$Easing;if(!c.$Default)c.$Default=k.$EaseSwing;var e=d.$FramesCount,f=c.$Cache;if(!f){var g=a.$Extend({},d.$Easing,d.$Round);f=c.$Cache={};a.$Each(g,function(n,l){var g=c[l]||c.$Default,j=d.$Round[l]||1;if(!a.$IsArray(g.$Cache))g.$Cache=[];var h=g.$Cache[e]=g.$Cache[e]||[];if(!h[j]){h[j]=[0];for(var k=1;k<=e;k++){var i=k/e*j,m=b.floor(i);if(i!=m)i-=m;h[j][k]=g(i)}}f[l]=h})}return f}function L(C,i,e,x,n,k){var A=this,u,v={},m={},l=[],g,f,s,q=e.$ChessMode.$Column||0,r=e.$ChessMode.$Row||0,h=e.$GetBlocks(n,k),p=Q(e),D=p.length-1,t=e.$Duration+e.$Delay*D,y=x+t,j=e.$SlideOut,z;y+=a.$IsBrowserChrome()?260:50;A.$EndTime=y;A.$ShowFrame=function(c){c-=x;var d=c<t;if(d||z){z=d;if(!j)c=t-c;var f=b.ceil(c/e.$Interval);a.$Each(m,function(c,e){var d=b.max(f,c.$Min);d=b.min(d,c.length-1);if(c.$LastFrameIndex!=d){if(!c.$LastFrameIndex&&!j)a.$ShowElement(l[e]);else d==c.$Max&&j&&a.$HideElement(l[e]);c.$LastFrameIndex=d;a.$SetStylesEx(l[e],c[d])}})}};function w(b){a.$DisableHWA(b);var c=a.$Children(b);a.$Each(c,function(a){w(a)})}i=a.$CloneNode(i);w(i);if(a.$IsBrowserIe9Earlier()){var E=!i["no-image"],B=a.$FindChildrenByTag(i);a.$Each(B,function(b){(E||b["jssor-slider"])&&a.$CssOpacity(b,a.$CssOpacity(b),c)})}a.$Each(p,function(i,l){a.$Each(i,function(K){var O=K[0],N=K[1],y=O+","+N,t=d,w=d,z=d;if(q&&N%2){if(o.$IsHorizontal(q))t=!t;if(o.$IsVertical(q))w=!w;if(q&16)z=!z}if(r&&O%2){if(o.$IsHorizontal(r))t=!t;if(o.$IsVertical(r))w=!w;if(r&16)z=!z}e.$Top=e.$Top||e.$Clip&4;e.$Bottom=e.$Bottom||e.$Clip&8;e.$Left=e.$Left||e.$Clip&1;e.$Right=e.$Right||e.$Clip&2;var F=w?e.$Bottom:e.$Top,C=w?e.$Top:e.$Bottom,E=t?e.$Right:e.$Left,D=t?e.$Left:e.$Right;e.$Clip=F||C||E||D;s={};f={$Top:0,$Left:0,$Opacity:1,$Width:n,$Height:k};g=a.$Extend({},f);u=a.$Extend({},h[y]);if(e.$Opacity)f.$Opacity=2-e.$Opacity;if(e.$ZIndex){f.$ZIndex=e.$ZIndex;g.$ZIndex=0}var M=e.$Cols*e.$Rows>1||e.$Clip;if(e.$Zoom||e.$Rotate){var L=c;if(a.$IsBrowserIE()&&a.$BrowserEngineVersion()<9)if(e.$Cols*e.$Rows>1)L=d;else M=d;if(L){f.$Zoom=e.$Zoom?e.$Zoom-1:1;g.$Zoom=1;if(a.$IsBrowserIe9Earlier()||a.$IsBrowserOpera())f.$Zoom=b.min(f.$Zoom,2);var R=e.$Rotate;f.$Rotate=R*360*(z?-1:1);g.$Rotate=0}}if(M){if(e.$Clip){var x=e.$ScaleClip||1,p=u.$Offset={};if(F&&C){p.$Top=h.$Height/2*x;p.$Bottom=-p.$Top}else if(F)p.$Bottom=-h.$Height*x;else if(C)p.$Top=h.$Height*x;if(E&&D){p.$Left=h.$Width/2*x;p.$Right=-p.$Left}else if(E)p.$Right=-h.$Width*x;else if(D)p.$Left=h.$Width*x}s.$Clip=u;g.$Clip=h[y]}var P=t?1:-1,Q=w?1:-1;if(e.x)f.$Left+=n*e.x*P;if(e.y)f.$Top+=k*e.y*Q;a.$Each(f,function(b,c){if(a.$IsNumeric(b))if(b!=g[c])s[c]=b-g[c]});v[y]=j?g:f;var J=b.round(l*e.$Delay/e.$Interval);m[y]=new Array(J);m[y].$Min=J;for(var B=e.$FramesCount,I=0;I<=B;I++){var i={};a.$Each(s,function(f,c){var m=e.$EasingInstance[c]||e.$EasingInstance.$Default,l=m[e.$Round[c]||1],k=e.$During[c]||[0,1],d=(I/B-k[0])/k[1]*B;d=b.round(b.min(B,b.max(d,0)));var j=l[d];if(a.$IsNumeric(f))i[c]=g[c]+f*j;else{var h=i[c]=a.$Extend({},g[c]);h.$Offset=[];a.$Each(f.$Offset,function(c,b){var a=c*j;h.$Offset[b]=a;h[b]+=a})}});if(g.$Zoom)i.$Transform={$Rotate:i.$Rotate||0,$Scale:i.$Zoom,$OriginalWidth:n,$OriginalHeight:k};if(i.$Clip&&e.$Move){var A=i.$Clip.$Offset,H=(A.$Top||0)+(A.$Bottom||0),G=(A.$Left||0)+(A.$Right||0);i.$Left=(i.$Left||0)+G;i.$Top=(i.$Top||0)+H;i.$Clip.$Left-=G;i.$Clip.$Right-=G;i.$Clip.$Top-=H;i.$Clip.$Bottom-=H}i.$ZIndex=i.$ZIndex||1;m[y].push(i)}})});p.reverse();a.$Each(p,function(b){a.$Each(b,function(c){var f=c[0],e=c[1],d=f+","+e,b=i;if(e||f)b=a.$CloneNode(i);a.$SetStyles(b,v[d]);a.$CssOverflow(b,"hidden");a.$CssPosition(b,"absolute");C.$AddClipElement(b);l[d]=b;a.$ShowElement(b,!j)})})}f.$JssorSlideshowRunner$=function(h,m,j,n,p){var d=this,o,e,c,s=0,r=n.$TransitionsOrder,k,f=8;function q(){var a=this,b=0;i.call(a,0,o);a.$OnPositionChange=function(d,a){if(a-b>f){b=a;c&&c.$ShowFrame(a);e&&e.$ShowFrame(a)}};a.$Transition=k}d.$GetTransition=function(){var a=0,c=n.$Transitions,d=c.length;if(r)a=s++%d;else a=b.floor(b.random()*d);c[a]&&(c[a].$Index=a);return c[a]};d.$Initialize=function(w,x,n,p,a){k=a;a=K(a,f);var l=p.$Item,i=n.$Item;l["no-image"]=!p.$Image;i["no-image"]=!n.$Image;var q=l,r=i,v=a,g=a.$Brother||K({},f);if(!a.$SlideOut){q=i;r=l}var s=g.$Shift||0;e=new L(h,r,g,b.max(s-g.$Interval,0),m,j);c=new L(h,q,v,b.max(g.$Interval-s,0),m,j);e.$ShowFrame(0);c.$ShowFrame(0);o=b.max(e.$EndTime,c.$EndTime);d.$Index=w};d.$Clear=function(){h.$Clear();e=g;c=g};d.$GetProcessor=function(){var a=g;if(c)a=new q;return a};if(a.$IsBrowserIe9Earlier()||a.$IsBrowserOpera()||p&&a.$WebKitVersion()<537)f=16;l.call(d);i.call(d,-1e7,1e7)};function m(q,lc){var j=this;function Hc(){var a=this;i.call(a,-1e8,2e8);a.$GetCurrentSlideInfo=function(){var c=a.$GetPosition_Display(),d=b.floor(c),f=u(d),e=c-b.floor(c);return{$Index:f,$VirtualIndex:d,$Position:e}};a.$OnPositionChange=function(d,a){var e=b.floor(a);if(e!=a&&a>d)e++;Yb(e,c);j.$TriggerEvent(m.$EVT_POSITION_CHANGE,u(a),u(d),a,d)}}function Gc(){var b=this;i.call(b,0,0,{$LoopLength:t});a.$Each(D,function(a){E&1&&a.$SetLoopLength(t);b.$Chain(a);a.$Shift(mb/fc)})}function Fc(){var a=this,b=Xb.$Elmt;i.call(a,-1,2,{$Easing:k.$EaseLinear,$Setter:{$Position:dc},$LoopLength:t},b,{$Position:1},{$Position:-1});a.$Wrapper=b}function uc(n,l){var a=this,e,f,h,k,b;i.call(a,-1e8,2e8,{$IntervalMax:100});a.$OnStart=function(){S=c;Y=g;j.$TriggerEvent(m.$EVT_SWIPE_START,u(y.$GetPosition()),y.$GetPosition())};a.$OnStop=function(){S=d;k=d;var a=y.$GetCurrentSlideInfo();j.$TriggerEvent(m.$EVT_SWIPE_END,u(y.$GetPosition()),y.$GetPosition());!a.$Position&&Jc(a.$VirtualIndex,s)};a.$OnPositionChange=function(g,d){var a;if(k)a=b;else{a=f;if(h){var c=d/h;a=o.$SlideEasing(c)*(f-e)+e}}y.$GoToPosition(a)};a.$PlayCarousel=function(b,d,c,g){e=b;f=d;h=c;y.$GoToPosition(b);a.$GoToPosition(0);a.$PlayToPosition(c,g)};a.$StandBy=function(d){k=c;b=d;a.$Play(d,g,c)};a.$SetStandByPosition=function(a){b=a};a.$MoveCarouselTo=function(a){y.$GoToPosition(a)};y=new Hc;y.$Combine(n);y.$Combine(l)}function vc(){var c=this,b=cc();a.$CssZIndex(b,0);a.$Css(b,"pointerEvents","none");c.$Elmt=b;c.$AddClipElement=function(c){a.$AppendChild(b,c);a.$ShowElement(b)};c.$Clear=function(){a.$HideElement(b);a.$ClearInnerHtml(b)}}function Ec(p,n){var e=this,r,x,I,y,h,A=[],G,q,S,H,P,F,f,w,k,db;i.call(e,-v,v+1,{$SlideItemAnimator:c});function E(a){x&&x.$Revert();r&&r.$Revert();R(p,a);F=c;r=new K.$Class(p,K,1);x=new K.$Class(p,K);x.$GoToBegin();r.$GoToBegin()}function Z(){r.$Version<K.$Version&&E()}function J(n,q,l){if(!H){H=c;if(h&&l){var f=l.width,b=l.height,k=f,i=b;if(f&&b&&o.$FillMode){if(o.$FillMode&3&&(!(o.$FillMode&4)||f>N||b>M)){var g=d,p=N/M*b/f;if(o.$FillMode&1)g=p>1;else if(o.$FillMode&2)g=p<1;k=g?f*M/b:N;i=g?M:b*N/f}a.$CssWidth(h,k);a.$CssHeight(h,i);a.$CssTop(h,(M-i)/2);a.$CssLeft(h,(N-k)/2)}a.$CssPosition(h,"absolute");j.$TriggerEvent(m.$EVT_LOAD_END,ic)}}a.$HideElement(q);n&&n(e)}function W(b,c,d,f){if(f==Y&&s==n&&T)if(!Ic){var a=u(b);B.$Initialize(a,n,c,e,d);c.$HideContentForSlideshow();fb.$Locate(a,1);fb.$GoToPosition(a);z.$PlayCarousel(b,b,0)}}function ab(b){if(b==Y&&s==n){if(!f){var a=g;if(B)if(B.$Index==n)a=B.$GetProcessor();else B.$Clear();Z();f=new Cc(p,n,a,e.$GetCaptionSliderIn(),e.$GetCaptionSliderOut());f.$SetPlayer(k)}!f.$IsPlaying()&&f.$Replay()}}function Q(d,c,j){if(d==n){if(d!=c)D[c]&&D[c].$ParkOut();else!j&&f&&f.$AdjustIdleOnPark();k&&k.$Enable();var l=Y=a.$GetNow();e.$LoadImage(a.$CreateCallback(g,ab,l))}else{var i=b.abs(n-d),h=v+o.$LazyLoading;(!P||i<=h||t-i<=h)&&e.$LoadImage()}}function bb(){if(s==n&&f){f.$Stop();k&&k.$Quit();k&&k.$Disable();f.$OpenSlideshowPanel()}}function cb(){s==n&&f&&f.$Stop()}function O(b){if(V)a.$CancelEvent(b);else j.$TriggerEvent(m.$EVT_CLICK,n,b)}function L(){k=w.pInstance;f&&f.$SetPlayer(k)}e.$LoadImage=function(d,b){b=b||y;if(A.length&&!H){a.$ShowElement(b);if(!S){S=c;j.$TriggerEvent(m.$EVT_LOAD_START);a.$Each(A,function(b){if(!b.src){b.src=a.$AttributeEx(b,"src2");a.$CssDisplay(b,b["display-origin"])}})}a.$LoadImages(A,h,a.$CreateCallback(g,J,d,b))}else J(d,b)};e.$GoForNextSlide=function(){if(B){var b=B.$GetTransition(t);if(b){var e=Y=a.$GetNow(),c=n+bc,d=D[u(c)];return d.$LoadImage(a.$CreateCallback(g,W,c,d,b,e),y)}}gb(s+o.$AutoPlaySteps*bc)};e.$TryActivate=function(){Q(n,n,c)};e.$ParkOut=function(){k&&k.$Quit();k&&k.$Disable();e.$UnhideContentForSlideshow();f&&f.$Abort();f=g;E()};e.$StampSlideItemElements=function(a){a=db+"_"+a};e.$HideContentForSlideshow=function(){a.$HideElement(p)};e.$UnhideContentForSlideshow=function(){a.$ShowElement(p)};e.$EnablePlayer=function(){k&&k.$Enable()};function R(b,f,e){if(b["jssor-slider"])return;e=e||0;if(!F){if(b.tagName=="IMG"){A.push(b);if(!b.src){P=c;b["display-origin"]=a.$CssDisplay(b);a.$HideElement(b)}}a.$IsBrowserIe9Earlier()&&a.$CssZIndex(b,(a.$CssZIndex(b)||0)+1);if(o.$HWA&&a.$WebKitVersion())(!X||a.$WebKitVersion()<534||!kb&&!a.$IsBrowserChrome())&&a.$EnableHWA(b)}var g=a.$Children(b);a.$Each(g,function(g){var j=a.$AttributeEx(g,"u");if(j=="player"&&!w){w=g;if(w.pInstance)L();else a.$AddEvent(w,"dataavailable",L)}if(j=="caption"){if(!a.$IsBrowserIE()&&!f){var i=a.$CloneNode(g,d,c);a.$InsertBefore(b,i,g);a.$RemoveChild(b,g);g=i;f=c}}else if(!F&&!e&&!h){if(g.tagName=="A"){if(a.$AttributeEx(g,"u")=="image")h=a.$FindChildByTag(g,"IMG");else h=a.$FindChild(g,"image",c);if(h){G=g;a.$SetStyles(G,U);q=a.$CloneNode(G,c);a.$AddEvent(q,"click",O);a.$CssDisplay(q,"block");a.$SetStyles(q,U);a.$CssOpacity(q,0);a.$Css(q,"backgroundColor","#000")}}else if(g.tagName=="IMG"&&a.$AttributeEx(g,"u")=="image")h=g;if(h){h.border=0;a.$SetStyles(h,U)}}R(g,f,e+1)})}e.$OnInnerOffsetChange=function(c,b){var a=v-b;dc(I,a)};e.$GetCaptionSliderIn=function(){return r};e.$GetCaptionSliderOut=function(){return x};e.$Index=n;l.call(e);var C=a.$FindChild(p,"thumb",c);if(C){e.$Thumb=a.$CloneNode(C);a.$RemoveAttribute(C,"id");a.$HideElement(C)}a.$ShowElement(p);y=a.$CloneNode(jb);a.$CssZIndex(y,1e3);a.$AddEvent(p,"click",O);E(c);e.$Image=h;e.$Link=q;e.$Item=p;e.$Wrapper=I=p;a.$AppendChild(I,y);j.$On(203,Q);j.$On(28,cb);j.$On(24,bb)}function Cc(F,h,q,v,u){var b=this,l=0,x=0,n,g,e,f,k,r,w,t,p=D[h];i.call(b,0,0);function y(){a.$ClearChildren(P);jc&&k&&p.$Link&&a.$AppendChild(P,p.$Link);a.$ShowElement(P,!k&&p.$Image)}function z(){if(r){r=d;j.$TriggerEvent(m.$EVT_ROLLBACK_END,h,e,l,g,e,f);b.$GoToPosition(g)}b.$Replay()}function A(a){t=a;b.$Stop();b.$Replay()}b.$Replay=function(){var a=b.$GetPosition_Display();if(!C&&!S&&!t&&s==h){if(!a){if(n&&!k){k=c;b.$OpenSlideshowPanel(c);j.$TriggerEvent(m.$EVT_SLIDESHOW_START,h,l,x,n,f)}y()}var d,o=m.$EVT_STATE_CHANGE;if(a!=f)if(a==e)d=f;else if(a==g)d=e;else if(!a)d=g;else if(a>e){r=c;d=e;o=m.$EVT_ROLLBACK_START}else d=b.$GetPlayToPosition();j.$TriggerEvent(o,h,a,l,g,e,f);var i=T&&(!L||H);if(a==f)(e!=f&&!(L&12)||i)&&p.$GoForNextSlide();else(i||a!=e)&&b.$PlayToPosition(d,z)}};b.$AdjustIdleOnPark=function(){e==f&&e==b.$GetPosition_Display()&&b.$GoToPosition(g)};b.$Abort=function(){B&&B.$Index==h&&B.$Clear();var a=b.$GetPosition_Display();a<f&&j.$TriggerEvent(m.$EVT_STATE_CHANGE,h,-a-1,l,g,e,f)};b.$OpenSlideshowPanel=function(b){q&&a.$CssOverflow(ob,b&&q.$Transition.$Outside?"":"hidden")};b.$OnInnerOffsetChange=function(b,a){if(k&&a>=n){k=d;y();p.$UnhideContentForSlideshow();B.$Clear();j.$TriggerEvent(m.$EVT_SLIDESHOW_END,h,l,x,n,f)}j.$TriggerEvent(m.$EVT_PROGRESS_CHANGE,h,a,l,g,e,f)};b.$SetPlayer=function(a){if(a&&!w){w=a;a.$On($JssorPlayer$.$EVT_SWITCH,A)}};q&&b.$Chain(q);n=b.$GetPosition_OuterEnd();b.$GetPosition_OuterEnd();b.$Chain(v);g=v.$GetPosition_OuterEnd();e=g+(a.$ParseFloat(a.$AttributeEx(F,"idle"))||o.$AutoPlayInterval);u.$Shift(e);b.$Combine(u);f=b.$GetPosition_OuterEnd()}function dc(e,g){var f=w>0?w:nb,c=Fb*g*(f&1),d=Gb*g*(f>>1&1);if(a.$IsBrowserChrome()&&a.$BrowserVersion()<38){c=c.toFixed(3);d=d.toFixed(3)}else{c=b.round(c);d=b.round(d)}if(a.$IsBrowserIE()&&a.$BrowserVersion()>=10&&a.$BrowserVersion()<11)e.style.msTransform="translate("+c+"px, "+d+"px)";else if(a.$IsBrowserChrome()&&a.$BrowserVersion()>=30&&a.$BrowserVersion()<34){e.style.WebkitTransition="transform 0s";e.style.WebkitTransform="translate3d("+c+"px, "+d+"px, 0px) perspective(2000px)"}else{a.$CssLeft(e,c);a.$CssTop(e,d)}}function Ac(c){var b=a.$EventSrc(c).tagName;!O&&b!="INPUT"&&b!="TEXTAREA"&&b!="SELECT"&&yc()&&zc(c)}function Tb(){vb=S;Pb=z.$GetPlayToPosition();F=y.$GetPosition()}function mc(){Tb();if(C||!H&&L&12){z.$Stop();j.$TriggerEvent(m.$EVT_FREEZE)}}function kc(e){e&&Tb();if(!C&&(H||!(L&12))&&!z.$IsPlaying()){var c=y.$GetPosition(),a=b.ceil(F);if(e&&b.abs(G)>=o.$MinDragOffsetToSlide){a=b.ceil(c);a+=lb}if(!(E&1))a=b.min(t-v,b.max(a,0));var d=b.abs(a-c);d=1-b.pow(1-d,5);if(!V&&vb)z.$Continue(Pb);else if(c==a){yb.$EnablePlayer();yb.$TryActivate()}else z.$PlayCarousel(c,a,d*Zb)}}function zc(b){C=c;Eb=d;Y=g;a.$AddEvent(e,tb,gc);a.$GetNow();V=0;mc();if(!vb)w=0;if(hb){var h=b.touches[0];zb=h.clientX;Ab=h.clientY}else{var f=a.$MousePosition(b);zb=f.x;Ab=f.y;a.$CancelEvent(b)}G=0;ib=0;lb=0;j.$TriggerEvent(m.$EVT_DRAG_START,u(F),F,b)}function gc(e){if(C&&(!a.$IsBrowserIe9Earlier()||e.button)){var f;if(hb){var l=e.touches;if(l&&l.length>0)f={x:l[0].clientX,y:l[0].clientY}}else f=a.$MousePosition(e);if(f){var j=f.x-zb,k=f.y-Ab;if(b.floor(F)!=F)w=w||nb&O;if((j||k)&&!w){if(O==3)if(b.abs(k)>b.abs(j))w=2;else w=1;else w=O;if(X&&w==1&&b.abs(k)-b.abs(j)>3)Eb=c}if(w){var d=k,i=Gb;if(w==1){d=j;i=Fb}if(!(E&1)){if(d>0){var g=i*s,h=d-g;if(h>0)d=g+b.sqrt(h)*5}if(d<0){var g=i*(t-v-s),h=-d-g;if(h>0)d=-g-b.sqrt(h)*5}}if(G-ib<-2)lb=0;else if(G-ib>2)lb=-1;ib=G;G=d;xb=F-G/i/(eb||1);if(G&&w&&!Eb){a.$CancelEvent(e);if(!S)z.$StandBy(xb);else z.$SetStandByPosition(xb)}else a.$IsBrowserIe9Earlier()&&a.$CancelEvent(e)}}}else Jb(e)}function Jb(f){wc();if(C){C=d;a.$GetNow();a.$RemoveEvent(e,tb,gc);V=G;V&&a.$CancelEvent(f);z.$Stop();var b=y.$GetPosition();j.$TriggerEvent(m.$EVT_DRAG_END,u(b),b,u(F),F,f);kc(c)}}function tc(a){D[s];s=u(a);yb=D[s];Yb(a);return s}function Jc(a,b){w=0;tc(a);j.$TriggerEvent(m.$EVT_PARK,u(a),b)}function Yb(b,c){Cb=b;a.$Each(R,function(a){a.$SetCurrentIndex(u(b),b,c)})}function yc(){var b=m.$DragRegistry||0,a=Q;if(X)a&1&&(a&=1);m.$DragRegistry|=a;return O=a&~b}function wc(){if(O){m.$DragRegistry&=~Q;O=0}}function cc(){var b=a.$CreateDiv();a.$SetStyles(b,U);a.$CssPosition(b,"absolute");return b}function u(a){return(a%t+t)%t}function qc(a,c){if(c)if(!E){a=b.min(b.max(a+Cb,0),t-v);c=d}else if(E&2){a=u(a+Cb);c=d}gb(a,o.$SlideDuration,c)}function Db(){a.$Each(R,function(a){a.$Show(a.$Options.$ChanceToShow<=H)})}function oc(){if(!H){H=1;Db();if(!C){L&12&&kc();L&3&&D[s].$TryActivate()}}}function nc(){if(H){H=0;Db();C||!(L&12)||mc()}}function pc(){U={$Width:N,$Height:M,$Top:0,$Left:0};a.$Each(Z,function(b){a.$SetStyles(b,U);a.$CssPosition(b,"absolute");a.$CssOverflow(b,"hidden");a.$HideElement(b)});a.$SetStyles(jb,U)}function rb(b,a){gb(b,a,c)}function gb(g,f,k){if(Vb&&(!C||o.$NaviQuitDrag)){S=c;C=d;z.$Stop();if(f==h)f=Zb;var e=Kb.$GetPosition_Display(),a=g;if(k){a=e+g;if(g>0)a=b.ceil(a);else a=b.floor(a)}if(E&2)a=u(a);if(!(E&1))a=b.max(0,b.min(a,t-v));var j=(a-e)%t;a=e+j;var i=e==a?0:f*b.abs(j);i=b.min(i,f*v*1.5);z.$PlayCarousel(e,a,i||1)}}j.$PlayTo=gb;j.$GoTo=function(a){gb(a,1)};j.$Next=function(){rb(1)};j.$Prev=function(){rb(-1)};j.$Pause=function(){T=d};j.$Play=function(){if(!T){T=c;D[s]&&D[s].$TryActivate()}};j.$SetSlideshowTransitions=function(b){a.$TranslateTransitions(b);o.$SlideshowOptions.$Transitions=b};j.$SetCaptionTransitions=function(b){a.$TranslateTransitions(b);K.$CaptionTransitions=b;K.$Version=a.$GetNow()};j.$SlidesCount=function(){return Z.length};j.$CurrentIndex=function(){return s};j.$IsAutoPlaying=function(){return T};j.$IsDragging=function(){return C};j.$IsSliding=function(){return S};j.$IsMouseOver=function(){return!H};j.$LastDragSucceded=function(){return V};function db(){return a.$CssWidth(x||q)}function pb(){return a.$CssHeight(x||q)}j.$OriginalWidth=j.$GetOriginalWidth=db;j.$OriginalHeight=j.$GetOriginalHeight=pb;function Mb(c,f){if(c==h)return a.$CssWidth(q);if(!x){var b=a.$CreateDiv(e);a.$ClassName(b,a.$ClassName(q));a.$CssCssText(b,a.$CssCssText(q));a.$CssDisplay(b,"block");a.$CssPosition(b,"relative");a.$CssTop(b,0);a.$CssLeft(b,0);a.$CssOverflow(b,"visible");x=a.$CreateDiv(e);a.$CssPosition(x,"absolute");a.$CssTop(x,0);a.$CssLeft(x,0);a.$CssWidth(x,a.$CssWidth(q));a.$CssHeight(x,a.$CssHeight(q));a.$SetStyleTransformOrigin(x,"0 0");a.$AppendChild(x,b);var k=a.$Children(q);a.$AppendChild(q,x);a.$Css(q,"backgroundImage","");var j={navigator:bb&&bb.$Scale==d,arrowleft:J&&J.$Scale==d,arrowright:J&&J.$Scale==d,thumbnavigator:I&&I.$Scale==d,thumbwrapper:I&&I.$Scale==d};a.$Each(k,function(c){a.$AppendChild(j[a.$AttributeEx(c,"u")]?q:b,c)})}eb=c/(f?a.$CssHeight:a.$CssWidth)(x);a.$CssScale(x,eb);var i=f?eb*db():c,g=f?c:eb*pb();a.$CssWidth(q,i);a.$CssHeight(q,g);a.$Each(R,function(a){a.$Relocate(i,g)})}j.$ScaleHeight=j.$GetScaleHeight=function(b){if(b==h)return a.$CssHeight(q);Mb(b,c)};j.$ScaleWidth=j.$SetScaleWidth=j.$GetScaleWidth=Mb;j.$GetVirtualIndex=function(a){var d=b.ceil(u(mb/fc)),c=u(a-s+d);if(c>v){if(a-s>t/2)a-=t;else if(a-s<=-t/2)a+=t}else a=s+c-d;return a};l.call(j);j.$Elmt=q=a.$GetElement(q);var o=a.$Extend({$FillMode:0,$LazyLoading:1,$StartIndex:0,$AutoPlay:d,$Loop:1,$HWA:c,$NaviQuitDrag:c,$AutoPlaySteps:1,$AutoPlayInterval:3e3,$PauseOnHover:1,$SlideDuration:500,$SlideEasing:k.$EaseOutQuad,$MinDragOffsetToSlide:20,$SlideSpacing:0,$DisplayPieces:1,$ParkingPosition:0,$UISearchMode:1,$PlayOrientation:1,$DragOrientation:1},lc),nb=o.$PlayOrientation&3,bc=(o.$PlayOrientation&4)/-4||1,cb=o.$SlideshowOptions,K=a.$Extend({$Class:r,$PlayInMode:1,$PlayOutMode:1},o.$CaptionSliderOptions);a.$TranslateTransitions(K.$CaptionTransitions);var bb=o.$BulletNavigatorOptions,J=o.$ArrowNavigatorOptions,I=o.$ThumbnailNavigatorOptions,W=!o.$UISearchMode,x,A=a.$FindChild(q,"slides",W),jb=a.$FindChild(q,"loading",W)||a.$CreateDiv(e),Ob=a.$FindChild(q,"navigator",W),hc=a.$FindChild(q,"arrowleft",W),ec=a.$FindChild(q,"arrowright",W),Nb=a.$FindChild(q,"thumbnavigator",W),sc=a.$CssWidth(A),rc=a.$CssHeight(A),U,Z=[],Bc=a.$Children(A);a.$Each(Bc,function(b){b.tagName=="DIV"&&!a.$AttributeEx(b,"u")&&Z.push(b)});var s=-1,Cb,yb,t=Z.length,N=o.$SlideWidth||sc,M=o.$SlideHeight||rc,ac=o.$SlideSpacing,Fb=N+ac,Gb=M+ac,fc=nb&1?Fb:Gb,v=b.min(o.$DisplayPieces,t),ob,w,O,Eb,hb,X,R=[],Ub,Wb,Sb,jc,Ic,T,L=o.$PauseOnHover,Zb=o.$SlideDuration,wb,kb,mb,Vb=v<t,E=Vb?o.$Loop:0,Q,V,H=1,S,C,Y,zb=0,Ab=0,G,ib,lb,Kb,y,fb,z,Xb=new vc,eb;T=o.$AutoPlay;j.$Options=lc;pc();q["jssor-slider"]=c;a.$CssZIndex(A,a.$CssZIndex(A)||0);a.$CssPosition(A,"absolute");ob=a.$CloneNode(A,c);a.$InsertBefore(a.$ParentNode(A),ob,A);if(cb){jc=cb.$ShowLink;wb=cb.$Class;a.$TranslateTransitions(cb.$Transitions);kb=v==1&&t>1&&wb&&(!a.$IsBrowserIE()||a.$BrowserVersion()>=8)}mb=kb||v>=t||!(E&1)?0:o.$ParkingPosition;Q=(v>1||mb?nb:-1)&o.$DragOrientation;var Bb=A,D=[],B,P,Ib="mousedown",tb="mousemove",Lb="mouseup",sb,F,vb,Pb,xb,ab;if(f.navigator.pointerEnabled||(ab=f.navigator.msPointerEnabled)){X=c;Ib=ab?"MSPointerDown":"pointerdown";tb=ab?"MSPointerMove":"pointermove";Lb=ab?"MSPointerUp":"pointerup";sb=ab?"MSPointerCancel":"pointercancel";if(Q){var Hb="auto";if(Q==2)Hb="pan-x";else if(Q)Hb="pan-y";a.$Css(Bb,ab?"msTouchAction":"touchAction",Hb)}}else if("ontouchstart"in f||"createTouch"in e){hb=c;X=c;Ib="touchstart";tb="touchmove";Lb="touchend";sb="touchcancel"}fb=new Fc;if(kb)B=new wb(Xb,N,M,cb,hb);a.$AppendChild(ob,fb.$Wrapper);a.$CssOverflow(A,"hidden");P=cc();a.$Css(P,"backgroundColor","#000");a.$CssOpacity(P,0);a.$InsertBefore(Bb,P,Bb.firstChild);for(var ub=0;ub<Z.length;ub++){var Dc=Z[ub],ic=new Ec(Dc,ub);D.push(ic)}a.$HideElement(jb);Kb=new Gc;z=new uc(Kb,fb);if(Q){a.$AddEvent(A,Ib,Ac);a.$AddEvent(e,Lb,Jb);sb&&a.$AddEvent(e,sb,Jb)}L&=X?10:5;if(Ob&&bb){Ub=new bb.$Class(Ob,bb,db(),pb());R.push(Ub)}if(J&&hc&&ec){J.$Loop=E;Wb=new J.$Class(hc,ec,J,db(),pb());R.push(Wb)}if(Nb&&I){I.$StartIndex=o.$StartIndex;Sb=new I.$Class(Nb,I);R.push(Sb)}a.$Each(R,function(a){a.$Reset(t,D,jb);a.$On(n.$NAVIGATIONREQUEST,qc)});Mb(db());a.$AddEvent(q,"mouseout",a.$MouseOverOutFilter(oc,q));a.$AddEvent(q,"mouseover",a.$MouseOverOutFilter(nc,q));Db();o.$ArrowKeyNavigation&&a.$AddEvent(e,"keydown",function(a){if(a.keyCode==p.$LEFT)rb(-1);else a.keyCode==p.$RIGHT&&rb(1)});var qb=o.$StartIndex;if(!(E&1))qb=b.max(0,b.min(qb,t-v));z.$PlayCarousel(qb,qb,0)}m.$EVT_CLICK=21;m.$EVT_DRAG_START=22;m.$EVT_DRAG_END=23;m.$EVT_SWIPE_START=24;m.$EVT_SWIPE_END=25;m.$EVT_LOAD_START=26;m.$EVT_LOAD_END=27;m.$EVT_FREEZE=28;m.$EVT_POSITION_CHANGE=202;m.$EVT_PARK=203;m.$EVT_SLIDESHOW_START=206;m.$EVT_SLIDESHOW_END=207;m.$EVT_PROGRESS_CHANGE=208;m.$EVT_STATE_CHANGE=209;m.$EVT_ROLLBACK_START=210;m.$EVT_ROLLBACK_END=211;f.$JssorSlider$=q=m};var n={$NAVIGATIONREQUEST:1,$INDEXCHANGE:2,$RESET:3};f.$JssorBulletNavigator$=function(f,D){var h=this;l.call(h);f=a.$GetElement(f);var t,u,s,r,m=0,e,o,k,y,z,j,i,q,p,C=[],A=[];function x(a){a!=-1&&A[a].$Selected(a==m)}function v(a){h.$TriggerEvent(n.$NAVIGATIONREQUEST,a*o)}h.$Elmt=f;h.$GetCurrentIndex=function(){return r};h.$SetCurrentIndex=function(a){if(a!=r){var d=m,c=b.floor(a/o);m=c;r=a;x(d);x(c)}};h.$Show=function(b){a.$ShowElement(f,b)};var B;h.$Relocate=function(g,b){if(!B||e.$Scale==d){e.$AutoCenter&1&&a.$CssLeft(f,(g-u)/2);e.$AutoCenter&2&&a.$CssTop(f,(b-s)/2);B=c}};var w;h.$Reset=function(D){if(!w){t=b.ceil(D/o);m=0;var n=q+y,r=p+z,l=b.ceil(t/k)-1;u=q+n*(!j?l:k-1);s=p+r*(j?l:k-1);a.$CssWidth(f,u);a.$CssHeight(f,s);for(var d=0;d<t;d++){var B=a.$CreateSpan();a.$InnerText(B,d+1);var h=a.$BuildElement(i,"numbertemplate",B,c);a.$CssPosition(h,"absolute");var x=d%(l+1);a.$CssLeft(h,!j?n*x:d%k*n);a.$CssTop(h,j?r*x:b.floor(d/(l+1))*r);a.$AppendChild(f,h);C[d]=h;e.$ActionMode&1&&a.$AddEvent(h,"click",a.$CreateCallback(g,v,d));e.$ActionMode&2&&a.$AddEvent(h,"mouseover",a.$MouseOverOutFilter(a.$CreateCallback(g,v,d),h));A[d]=a.$Buttonize(h)}w=c}};h.$Options=e=a.$Extend({$SpacingX:0,$SpacingY:0,$Orientation:1,$ActionMode:1},D);i=a.$FindChild(f,"prototype");q=a.$CssWidth(i);p=a.$CssHeight(i);a.$RemoveChild(f,i);o=e.$Steps||1;k=e.$Lanes||1;y=e.$SpacingX;z=e.$SpacingY;j=e.$Orientation-1};f.$JssorArrowNavigator$=function(e,h,j,o){var b=this;l.call(b);var u,f,i,k,r=a.$CssWidth(e),p=a.$CssHeight(e);function m(a){b.$TriggerEvent(n.$NAVIGATIONREQUEST,a,c)}function s(b){a.$ShowElement(e,b||!j.$Loop&&f==0);a.$ShowElement(h,b||!j.$Loop&&f==u-1)}b.$GetCurrentIndex=function(){return f};b.$SetCurrentIndex=function(b,a,c){if(c)f=a;else{f=b;s()}};b.$Show=s;var t;b.$Relocate=function(f,b){if(!t||i.$Scale==d){if(i.$AutoCenter&1){a.$CssLeft(e,(o-r)/2);a.$CssLeft(h,(o-r)/2)}if(i.$AutoCenter&2){a.$CssTop(e,(b-p)/2);a.$CssTop(h,(b-p)/2)}t=c}};var q;b.$Reset=function(b){u=b;f=0;if(!q){a.$AddEvent(e,"click",a.$CreateCallback(g,m,-k));a.$AddEvent(h,"click",a.$CreateCallback(g,m,k));a.$Buttonize(e);a.$Buttonize(h);q=c}};b.$Options=i=a.$Extend({$Steps:1},j);k=i.$Steps};f.$JssorThumbnailNavigator$=function(i,A){var h=this,x,m,e,u=[],y,w,f,o,p,t,s,k,r,g,j;l.call(h);i=a.$GetElement(i);function z(o,d){var g=this,b,l,k;function p(){l.$Selected(m==d)}function i(){if(!r.$LastDragSucceded()){var a=f-d%f,b=r.$GetVirtualIndex((d+a)/f-1),c=b*f+f-a;h.$TriggerEvent(n.$NAVIGATIONREQUEST,c)}}g.$Index=d;g.$Highlight=p;k=o.$Thumb||o.$Image||a.$CreateDiv();g.$Wrapper=b=a.$BuildElement(j,"thumbnailtemplate",k,c);l=a.$Buttonize(b);e.$ActionMode&1&&a.$AddEvent(b,"click",i);e.$ActionMode&2&&a.$AddEvent(b,"mouseover",a.$MouseOverOutFilter(i,b))}h.$GetCurrentIndex=function(){return m};h.$SetCurrentIndex=function(c,d,e){var a=m;m=c;a!=-1&&u[a].$Highlight();u[c].$Highlight();!e&&r.$PlayTo(r.$GetVirtualIndex(b.floor(d/f)))};h.$Show=function(b){a.$ShowElement(i,b)};h.$Relocate=a.$EmptyFunction;var v;h.$Reset=function(F,D){if(!v){x=F;b.ceil(x/f);m=-1;k=b.min(k,D.length);var h=e.$Orientation&1,n=t+(t+o)*(f-1)*(1-h),l=s+(s+p)*(f-1)*h,C=n+(n+o)*(k-1)*h,A=l+(l+p)*(k-1)*(1-h);a.$CssPosition(g,"absolute");a.$CssOverflow(g,"hidden");e.$AutoCenter&1&&a.$CssLeft(g,(y-C)/2);e.$AutoCenter&2&&a.$CssTop(g,(w-A)/2);a.$CssWidth(g,C);a.$CssHeight(g,A);var j=[];a.$Each(D,function(l,e){var i=new z(l,e),d=i.$Wrapper,c=b.floor(e/f),k=e%f;a.$CssLeft(d,(t+o)*k*(1-h));a.$CssTop(d,(s+p)*k*h);if(!j[c]){j[c]=a.$CreateDiv();a.$AppendChild(g,j[c])}a.$AppendChild(j[c],d);u.push(i)});var E=a.$Extend({$HWA:d,$AutoPlay:d,$NaviQuitDrag:d,$SlideWidth:n,$SlideHeight:l,$SlideSpacing:o*h+p*(1-h),$MinDragOffsetToSlide:12,$SlideDuration:200,$PauseOnHover:1,$PlayOrientation:e.$Orientation,$DragOrientation:e.$DisableDrag?0:e.$Orientation},e);r=new q(i,E);v=c}};h.$Options=e=a.$Extend({$SpacingX:3,$SpacingY:3,$DisplayPieces:1,$Orientation:1,$AutoCenter:3,$ActionMode:1},A);y=a.$CssWidth(i);w=a.$CssHeight(i);g=a.$FindChild(i,"slides",c);j=a.$FindChild(g,"prototype");t=a.$CssWidth(j);s=a.$CssHeight(j);a.$RemoveChild(g,j);f=e.$Lanes||1;o=e.$SpacingX;p=e.$SpacingY;k=e.$DisplayPieces};function r(){i.call(this,0,0);this.$Revert=a.$EmptyFunction}f.$JssorCaptionSlider$=function(q,k,g){var d=this,j,o=g?k.$PlayInMode:k.$PlayOutMode,f=k.$CaptionTransitions,p={$Transition:"t",$Delay:"d",$Duration:"du",x:"x",y:"y",$Rotate:"r",$Zoom:"z",$Opacity:"f",$BeginTime:"b"},e={$Default:function(b,a){if(!isNaN(a.$Value))b=a.$Value;else b*=a.$Percent;return b},$Opacity:function(b,a){return this.$Default(b-1,a)}};e.$Zoom=e.$Opacity;i.call(d,0,0);function m(r,l){var k=[],i,j=[],c=[];function h(c,d){var b={};a.$Each(p,function(g,h){var e=a.$AttributeEx(c,g+(d||""));if(e){var f={};if(g=="t")f.$Value=e;else if(e.indexOf("%")+1)f.$Percent=a.$ParseFloat(e)/100;else f.$Value=a.$ParseFloat(e);b[h]=f}});return b}function n(){return f[b.floor(b.random()*f.length)]}function d(g){var h;if(g=="*")h=n();else if(g){var e=f[a.$ParseInt(g)]||f[g];if(a.$IsArray(e)){if(g!=i){i=g;c[g]=0;j[g]=e[b.floor(b.random()*e.length)]}else c[g]++;e=j[g];if(a.$IsArray(e)){e=e.length&&e[c[g]%e.length];if(a.$IsArray(e))e=e[b.floor(b.random()*e.length)]}}h=e;if(a.$IsString(h))h=d(h)}return h}var q=a.$Children(r);a.$Each(q,function(b){var c=[];c.$Elmt=b;var f=a.$AttributeEx(b,"u")=="caption";a.$Each(g?[0,3]:[2],function(k,n){if(f){var j,g;if(k!=2||!a.$AttributeEx(b,"t3")){g=h(b,k);if(k==2&&!g.$Transition){g.$Delay=g.$Delay||{$Value:0};g=a.$Extend(h(b,0),g)}}if(g&&g.$Transition){j=d(g.$Transition.$Value);if(j){var i=a.$Extend({$Delay:0},j);a.$Each(g,function(c,a){var b=(e[a]||e.$Default).apply(e,[i[a],g[a]]);if(!isNaN(b))i[a]=b});if(!n)if(g.$BeginTime)i.$BeginTime=g.$BeginTime.$Value||0;else if(o&2)i.$BeginTime=0}}c.push(i)}if(l%2&&!n)c.$Children=m(b,l+1)});k.push(c)});return k}function n(x,d,A){var h={$Easing:d.$Easing,$Round:d.$Round,$During:d.$During,$Reverse:g&&!A,$Optimize:c},j=x,s=a.$ParentNode(x),n=a.$CssWidth(j),m=a.$CssHeight(j),z=a.$CssWidth(s),y=a.$CssHeight(s),f={},k={},l=d.$ScaleClip||1;if(d.$Opacity)f.$Opacity=2-d.$Opacity;h.$OriginalWidth=n;h.$OriginalHeight=m;if(d.$Zoom||d.$Rotate){f.$Zoom=d.$Zoom?d.$Zoom-1:1;if(a.$IsBrowserIe9Earlier()||a.$IsBrowserOpera())f.$Zoom=b.min(f.$Zoom,2);k.$Zoom=1;var C=d.$Rotate||0;f.$Rotate=C*360;k.$Rotate=0}else if(d.$Clip){var t={$Top:0,$Right:n,$Bottom:m,$Left:0},w=a.$Extend({},t),e=w.$Offset={},v=d.$Clip&4,q=d.$Clip&8,u=d.$Clip&1,r=d.$Clip&2;if(v&&q){e.$Top=m/2*l;e.$Bottom=-e.$Top}else if(v)e.$Bottom=-m*l;else if(q)e.$Top=m*l;if(u&&r){e.$Left=n/2*l;e.$Right=-e.$Left}else if(u)e.$Right=-n*l;else if(r)e.$Left=n*l;h.$Move=d.$Move;f.$Clip=w;k.$Clip=t}var o=0,p=0;if(d.x)o-=z*d.x;if(d.y)p-=y*d.y;if(o||p||h.$Move){f.$Left=o+a.$CssLeft(j);f.$Top=p+a.$CssTop(j)}var B=d.$Duration;k=a.$Extend(k,a.$GetStyles(j,f));h.$Setter=a.$StyleSetterEx();return new i(d.$Delay,B,h,j,k,f)}function l(b,c){a.$Each(c,function(a){var e,g=a.$Elmt,c=a[0],i=a[1];if(c){e=n(g,c);b=e.$Locate(c.$BeginTime==h?b:c.$BeginTime,1)}b=l(b,a.$Children);if(i){var f=n(g,i,1);f.$Locate(b,1);d.$Combine(f);j.$Combine(f)}e&&d.$Combine(e)});return b}d.$Revert=function(){d.$GoToPosition(d.$GetPosition_OuterEnd()*(g||0));j.$GoToBegin()};j=new i(0,0);l(0,o?m(q,1):[])}})(window,document,Math,null,true,false)