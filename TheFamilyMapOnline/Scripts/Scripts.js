//______________jquery.cycle.js____________
/*!
 * jQuery Cycle Plugin (with Transition Definitions)
 * Examples and documentation at: http://jquery.malsup.com/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version: 2.9999.3 (08-MAR-2012)
 * Dual licensed under the MIT and GPL licenses.
 * http://jquery.malsup.com/license.html
 * Requires: jQuery v1.3.2 or later
 */
; (function ($, undefined) {

    var ver = '2.9999.3';

    // if $.support is not defined (pre jQuery 1.3) add what I need
    if ($.support == undefined) {
        $.support = {
            opacity: !($.browser.msie)
        };
    }

    function debug(s) {
        $.fn.cycle.debug && log(s);
    }
    function log() {
        window.console && console.log && console.log('[cycle] ' + Array.prototype.join.call(arguments, ' '));
    }
    $.expr[':'].paused = function (el) {
        return el.cyclePause;
    };


    // the options arg can be...
    //   a number  - indicates an immediate transition should occur to the given slide index
    //   a string  - 'pause', 'resume', 'toggle', 'next', 'prev', 'stop', 'destroy' or the name of a transition effect (ie, 'fade', 'zoom', etc)
    //   an object - properties to control the slideshow
    //
    // the arg2 arg can be...
    //   the name of an fx (only used in conjunction with a numeric value for 'options')
    //   the value true (only used in first arg == 'resume') and indicates
    //	 that the resume should occur immediately (not wait for next timeout)

    $.fn.cycle = function (options, arg2) {
        var o = { s: this.selector, c: this.context };

        // in 1.3+ we can fix mistakes with the ready state
        if (this.length === 0 && options != 'stop') {
            if (!$.isReady && o.s) {
                log('DOM not ready, queuing slideshow');
                $(function () {
                    $(o.s, o.c).cycle(options, arg2);
                });
                return this;
            }
            // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
            log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
            return this;
        }

        // iterate the matched nodeset
        return this.each(function () {
            var opts = handleArguments(this, options, arg2);
            if (opts === false)
                return;

            opts.updateActivePagerLink = opts.updateActivePagerLink || $.fn.cycle.updateActivePagerLink;

            // stop existing slideshow for this container (if there is one)
            if (this.cycleTimeout)
                clearTimeout(this.cycleTimeout);
            this.cycleTimeout = this.cyclePause = 0;

            var $cont = $(this);
            var $slides = opts.slideExpr ? $(opts.slideExpr, this) : $cont.children();
            var els = $slides.get();

            var opts2 = buildOptions($cont, $slides, els, opts, o);
            if (opts2 === false)
                return;

            if (els.length < 2) {
                log('terminating; too few slides: ' + els.length);
                return;
            }

            var startTime = opts2.continuous ? 10 : getTimeout(els[opts2.currSlide], els[opts2.nextSlide], opts2, !opts2.backwards);

            // if it's an auto slideshow, kick it off
            if (startTime) {
                startTime += (opts2.delay || 0);
                if (startTime < 10)
                    startTime = 10;
                debug('first timeout: ' + startTime);
                this.cycleTimeout = setTimeout(function () { go(els, opts2, 0, !opts.backwards) }, startTime);
            }
        });
    };

    function triggerPause(cont, byHover, onPager) {
        var opts = $(cont).data('cycle.opts');
        var paused = !!cont.cyclePause;
        if (paused && opts.paused)
            opts.paused(cont, opts, byHover, onPager);
        else if (!paused && opts.resumed)
            opts.resumed(cont, opts, byHover, onPager);
    }

    // process the args that were passed to the plugin fn
    function handleArguments(cont, options, arg2) {
        if (cont.cycleStop == undefined)
            cont.cycleStop = 0;
        if (options === undefined || options === null)
            options = {};
        if (options.constructor == String) {
            switch (options) {
                case 'destroy':
                case 'stop':
                    var opts = $(cont).data('cycle.opts');
                    if (!opts)
                        return false;
                    cont.cycleStop++; // callbacks look for change
                    if (cont.cycleTimeout)
                        clearTimeout(cont.cycleTimeout);
                    cont.cycleTimeout = 0;
                    opts.elements && $(opts.elements).stop();
                    $(cont).removeData('cycle.opts');
                    if (options == 'destroy')
                        destroy(cont, opts);
                    return false;
                case 'toggle':
                    cont.cyclePause = (cont.cyclePause === 1) ? 0 : 1;
                    checkInstantResume(cont.cyclePause, arg2, cont);
                    triggerPause(cont);
                    return false;
                case 'pause':
                    cont.cyclePause = 1;
                    triggerPause(cont);
                    return false;
                case 'resume':
                    cont.cyclePause = 0;
                    checkInstantResume(false, arg2, cont);
                    triggerPause(cont);
                    return false;
                case 'prev':
                case 'next':
                    var opts = $(cont).data('cycle.opts');
                    if (!opts) {
                        log('options not found, "prev/next" ignored');
                        return false;
                    }
                    $.fn.cycle[options](opts);
                    return false;
                default:
                    options = { fx: options };
            };
            return options;
        }
        else if (options.constructor == Number) {
            // go to the requested slide
            var num = options;
            options = $(cont).data('cycle.opts');
            if (!options) {
                log('options not found, can not advance slide');
                return false;
            }
            if (num < 0 || num >= options.elements.length) {
                log('invalid slide index: ' + num);
                return false;
            }
            options.nextSlide = num;
            if (cont.cycleTimeout) {
                clearTimeout(cont.cycleTimeout);
                cont.cycleTimeout = 0;
            }
            if (typeof arg2 == 'string')
                options.oneTimeFx = arg2;
            go(options.elements, options, 1, num >= options.currSlide);
            return false;
        }
        return options;

        function checkInstantResume(isPaused, arg2, cont) {
            if (!isPaused && arg2 === true) { // resume now!
                var options = $(cont).data('cycle.opts');
                if (!options) {
                    log('options not found, can not resume');
                    return false;
                }
                if (cont.cycleTimeout) {
                    clearTimeout(cont.cycleTimeout);
                    cont.cycleTimeout = 0;
                }
                go(options.elements, options, 1, !options.backwards);
            }
        }
    };

    function removeFilter(el, opts) {
        if (!$.support.opacity && opts.cleartype && el.style.filter) {
            try { el.style.removeAttribute('filter'); }
            catch (smother) { } // handle old opera versions
        }
    };

    // unbind event handlers
    function destroy(cont, opts) {
        if (opts.next)
            $(opts.next).unbind(opts.prevNextEvent);
        if (opts.prev)
            $(opts.prev).unbind(opts.prevNextEvent);

        if (opts.pager || opts.pagerAnchorBuilder)
            $.each(opts.pagerAnchors || [], function () {
                this.unbind().remove();
            });
        opts.pagerAnchors = null;
        $(cont).unbind('mouseenter.cycle mouseleave.cycle');
        if (opts.destroy) // callback
            opts.destroy(opts);
    };

    // one-time initialization
    function buildOptions($cont, $slides, els, options, o) {
        var startingSlideSpecified;
        // support metadata plugin (v1.0 and v2.0)
        var opts = $.extend({}, $.fn.cycle.defaults, options || {}, $.metadata ? $cont.metadata() : $.meta ? $cont.data() : {});
        var meta = $.isFunction($cont.data) ? $cont.data(opts.metaAttr) : null;
        if (meta)
            opts = $.extend(opts, meta);
        if (opts.autostop)
            opts.countdown = opts.autostopCount || els.length;

        var cont = $cont[0];
        $cont.data('cycle.opts', opts);
        opts.$cont = $cont;
        opts.stopCount = cont.cycleStop;
        opts.elements = els;
        opts.before = opts.before ? [opts.before] : [];
        opts.after = opts.after ? [opts.after] : [];

        // push some after callbacks
        if (!$.support.opacity && opts.cleartype)
            opts.after.push(function () { removeFilter(this, opts); });
        if (opts.continuous)
            opts.after.push(function () { go(els, opts, 0, !opts.backwards); });

        saveOriginalOpts(opts);

        // clearType corrections
        if (!$.support.opacity && opts.cleartype && !opts.cleartypeNoBg)
            clearTypeFix($slides);

        // container requires non-static position so that slides can be position within
        if ($cont.css('position') == 'static')
            $cont.css('position', 'relative');
        if (opts.width)
            $cont.width(opts.width);
        if (opts.height && opts.height != 'auto')
            $cont.height(opts.height);

        if (opts.startingSlide != undefined) {
            opts.startingSlide = parseInt(opts.startingSlide, 10);
            if (opts.startingSlide >= els.length || opts.startSlide < 0)
                opts.startingSlide = 0; // catch bogus input
            else
                startingSlideSpecified = true;
        }
        else if (opts.backwards)
            opts.startingSlide = els.length - 1;
        else
            opts.startingSlide = 0;

        // if random, mix up the slide array
        if (opts.random) {
            opts.randomMap = [];
            for (var i = 0; i < els.length; i++)
                opts.randomMap.push(i);
            opts.randomMap.sort(function (a, b) { return Math.random() - 0.5; });
            if (startingSlideSpecified) {
                // try to find the specified starting slide and if found set start slide index in the map accordingly
                for (var cnt = 0; cnt < els.length; cnt++) {
                    if (opts.startingSlide == opts.randomMap[cnt]) {
                        opts.randomIndex = cnt;
                    }
                }
            }
            else {
                opts.randomIndex = 1;
                opts.startingSlide = opts.randomMap[1];
            }
        }
        else if (opts.startingSlide >= els.length)
            opts.startingSlide = 0; // catch bogus input
        opts.currSlide = opts.startingSlide || 0;
        var first = opts.startingSlide;

        // set position and zIndex on all the slides
        $slides.css({ position: 'absolute', top: 0, left: 0 }).hide().each(function (i) {
            var z;
            if (opts.backwards)
                z = first ? i <= first ? els.length + (i - first) : first - i : els.length - i;
            else
                z = first ? i >= first ? els.length - (i - first) : first - i : els.length - i;
            $(this).css('z-index', z);
        });

        // make sure first slide is visible
        $(els[first]).css('opacity', 1).show(); // opacity bit needed to handle restart use case
        removeFilter(els[first], opts);

        // stretch slides
        if (opts.fit) {
            if (!opts.aspect) {
                if (opts.width)
                    $slides.width(opts.width);
                if (opts.height && opts.height != 'auto')
                    $slides.height(opts.height);
            } else {
                $slides.each(function () {
                    var $slide = $(this);
                    var ratio = (opts.aspect === true) ? $slide.width() / $slide.height() : opts.aspect;
                    if (opts.width && $slide.width() != opts.width) {
                        $slide.width(opts.width);
                        $slide.height(opts.width / ratio);
                    }

                    if (opts.height && $slide.height() < opts.height) {
                        $slide.height(opts.height);
                        $slide.width(opts.height * ratio);
                    }
                });
            }
        }

        if (opts.center && ((!opts.fit) || opts.aspect)) {
            $slides.each(function () {
                var $slide = $(this);
                $slide.css({
                    "margin-left": opts.width ?
                        ((opts.width - $slide.width()) / 2) + "px" :
                        0,
                    "margin-top": opts.height ?
                        ((opts.height - $slide.height()) / 2) + "px" :
                        0
                });
            });
        }

        if (opts.center && !opts.fit && !opts.slideResize) {
            $slides.each(function () {
                var $slide = $(this);
                $slide.css({
                    "margin-left": opts.width ? ((opts.width - $slide.width()) / 2) + "px" : 0,
                    "margin-top": opts.height ? ((opts.height - $slide.height()) / 2) + "px" : 0
                });
            });
        }

        // stretch container
        var reshape = opts.containerResize && !$cont.innerHeight();
        if (reshape) { // do this only if container has no size http://tinyurl.com/da2oa9
            var maxw = 0, maxh = 0;
            for (var j = 0; j < els.length; j++) {
                var $e = $(els[j]), e = $e[0], w = $e.outerWidth(), h = $e.outerHeight();
                if (!w) w = e.offsetWidth || e.width || $e.attr('width');
                if (!h) h = e.offsetHeight || e.height || $e.attr('height');
                maxw = w > maxw ? w : maxw;
                maxh = h > maxh ? h : maxh;
            }
            if (maxw > 0 && maxh > 0)
                $cont.css({ width: maxw + 'px', height: maxh + 'px' });
        }

        var pauseFlag = false;  // https://github.com/malsup/cycle/issues/44
        if (opts.pause)
            $cont.bind('mouseenter.cycle', function () {
                pauseFlag = true;
                this.cyclePause++;
                triggerPause(cont, true);
            }).bind('mouseleave.cycle', function () {
                pauseFlag && this.cyclePause--;
                triggerPause(cont, true);
            });

        if (supportMultiTransitions(opts) === false)
            return false;

        // apparently a lot of people use image slideshows without height/width attributes on the images.
        // Cycle 2.50+ requires the sizing info for every slide; this block tries to deal with that.
        var requeue = false;
        options.requeueAttempts = options.requeueAttempts || 0;
        $slides.each(function () {
            // try to get height/width of each slide
            var $el = $(this);
            this.cycleH = (opts.fit && opts.height) ? opts.height : ($el.height() || this.offsetHeight || this.height || $el.attr('height') || 0);
            this.cycleW = (opts.fit && opts.width) ? opts.width : ($el.width() || this.offsetWidth || this.width || $el.attr('width') || 0);

            if ($el.is('img')) {
                // sigh..  sniffing, hacking, shrugging...  this crappy hack tries to account for what browsers do when
                // an image is being downloaded and the markup did not include sizing info (height/width attributes);
                // there seems to be some "default" sizes used in this situation
                var loadingIE = ($.browser.msie && this.cycleW == 28 && this.cycleH == 30 && !this.complete);
                var loadingFF = ($.browser.mozilla && this.cycleW == 34 && this.cycleH == 19 && !this.complete);
                var loadingOp = ($.browser.opera && ((this.cycleW == 42 && this.cycleH == 19) || (this.cycleW == 37 && this.cycleH == 17)) && !this.complete);
                var loadingOther = (this.cycleH == 0 && this.cycleW == 0 && !this.complete);
                // don't requeue for images that are still loading but have a valid size
                if (loadingIE || loadingFF || loadingOp || loadingOther) {
                    if (o.s && opts.requeueOnImageNotLoaded && ++options.requeueAttempts < 100) { // track retry count so we don't loop forever
                        log(options.requeueAttempts, ' - img slide not loaded, requeuing slideshow: ', this.src, this.cycleW, this.cycleH);
                        setTimeout(function () { $(o.s, o.c).cycle(options) }, opts.requeueTimeout);
                        requeue = true;
                        return false; // break each loop
                    }
                    else {
                        log('could not determine size of image: ' + this.src, this.cycleW, this.cycleH);
                    }
                }
            }
            return true;
        });

        if (requeue)
            return false;

        opts.cssBefore = opts.cssBefore || {};
        opts.cssAfter = opts.cssAfter || {};
        opts.cssFirst = opts.cssFirst || {};
        opts.animIn = opts.animIn || {};
        opts.animOut = opts.animOut || {};

        $slides.not(':eq(' + first + ')').css(opts.cssBefore);
        $($slides[first]).css(opts.cssFirst);

        if (opts.timeout) {
            opts.timeout = parseInt(opts.timeout, 10);
            // ensure that timeout and speed settings are sane
            if (opts.speed.constructor == String)
                opts.speed = $.fx.speeds[opts.speed] || parseInt(opts.speed, 10);
            if (!opts.sync)
                opts.speed = opts.speed / 2;

            var buffer = opts.fx == 'none' ? 0 : opts.fx == 'shuffle' ? 500 : 250;
            while ((opts.timeout - opts.speed) < buffer) // sanitize timeout
                opts.timeout += opts.speed;
        }
        if (opts.easing)
            opts.easeIn = opts.easeOut = opts.easing;
        if (!opts.speedIn)
            opts.speedIn = opts.speed;
        if (!opts.speedOut)
            opts.speedOut = opts.speed;

        opts.slideCount = els.length;
        opts.currSlide = opts.lastSlide = first;
        if (opts.random) {
            if (++opts.randomIndex == els.length)
                opts.randomIndex = 0;
            opts.nextSlide = opts.randomMap[opts.randomIndex];
        }
        else if (opts.backwards)
            opts.nextSlide = opts.startingSlide == 0 ? (els.length - 1) : opts.startingSlide - 1;
        else
            opts.nextSlide = opts.startingSlide >= (els.length - 1) ? 0 : opts.startingSlide + 1;

        // run transition init fn
        if (!opts.multiFx) {
            var init = $.fn.cycle.transitions[opts.fx];
            if ($.isFunction(init))
                init($cont, $slides, opts);
            else if (opts.fx != 'custom' && !opts.multiFx) {
                log('unknown transition: ' + opts.fx, '; slideshow terminating');
                return false;
            }
        }

        // fire artificial events
        var e0 = $slides[first];
        if (!opts.skipInitializationCallbacks) {
            if (opts.before.length)
                opts.before[0].apply(e0, [e0, e0, opts, true]);
            if (opts.after.length)
                opts.after[0].apply(e0, [e0, e0, opts, true]);
        }
        if (opts.next)
            $(opts.next).bind(opts.prevNextEvent, function () { return advance(opts, 1) });
        if (opts.prev)
            $(opts.prev).bind(opts.prevNextEvent, function () { return advance(opts, 0) });
        if (opts.pager || opts.pagerAnchorBuilder)
            buildPager(els, opts);

        exposeAddSlide(opts, els);

        return opts;
    };

    // save off original opts so we can restore after clearing state
    function saveOriginalOpts(opts) {
        opts.original = { before: [], after: [] };
        opts.original.cssBefore = $.extend({}, opts.cssBefore);
        opts.original.cssAfter = $.extend({}, opts.cssAfter);
        opts.original.animIn = $.extend({}, opts.animIn);
        opts.original.animOut = $.extend({}, opts.animOut);
        $.each(opts.before, function () { opts.original.before.push(this); });
        $.each(opts.after, function () { opts.original.after.push(this); });
    };

    function supportMultiTransitions(opts) {
        var i, tx, txs = $.fn.cycle.transitions;
        // look for multiple effects
        if (opts.fx.indexOf(',') > 0) {
            opts.multiFx = true;
            opts.fxs = opts.fx.replace(/\s*/g, '').split(',');
            // discard any bogus effect names
            for (i = 0; i < opts.fxs.length; i++) {
                var fx = opts.fxs[i];
                tx = txs[fx];
                if (!tx || !txs.hasOwnProperty(fx) || !$.isFunction(tx)) {
                    log('discarding unknown transition: ', fx);
                    opts.fxs.splice(i, 1);
                    i--;
                }
            }
            // if we have an empty list then we threw everything away!
            if (!opts.fxs.length) {
                log('No valid transitions named; slideshow terminating.');
                return false;
            }
        }
        else if (opts.fx == 'all') {  // auto-gen the list of transitions
            opts.multiFx = true;
            opts.fxs = [];
            for (p in txs) {
                tx = txs[p];
                if (txs.hasOwnProperty(p) && $.isFunction(tx))
                    opts.fxs.push(p);
            }
        }
        if (opts.multiFx && opts.randomizeEffects) {
            // munge the fxs array to make effect selection random
            var r1 = Math.floor(Math.random() * 20) + 30;
            for (i = 0; i < r1; i++) {
                var r2 = Math.floor(Math.random() * opts.fxs.length);
                opts.fxs.push(opts.fxs.splice(r2, 1)[0]);
            }
            debug('randomized fx sequence: ', opts.fxs);
        }
        return true;
    };

    // provide a mechanism for adding slides after the slideshow has started
    function exposeAddSlide(opts, els) {
        opts.addSlide = function (newSlide, prepend) {
            var $s = $(newSlide), s = $s[0];
            if (!opts.autostopCount)
                opts.countdown++;
            els[prepend ? 'unshift' : 'push'](s);
            if (opts.els)
                opts.els[prepend ? 'unshift' : 'push'](s); // shuffle needs this
            opts.slideCount = els.length;

            // add the slide to the random map and resort
            if (opts.random) {
                opts.randomMap.push(opts.slideCount - 1);
                opts.randomMap.sort(function (a, b) { return Math.random() - 0.5; });
            }

            $s.css('position', 'absolute');
            $s[prepend ? 'prependTo' : 'appendTo'](opts.$cont);

            if (prepend) {
                opts.currSlide++;
                opts.nextSlide++;
            }

            if (!$.support.opacity && opts.cleartype && !opts.cleartypeNoBg)
                clearTypeFix($s);

            if (opts.fit && opts.width)
                $s.width(opts.width);
            if (opts.fit && opts.height && opts.height != 'auto')
                $s.height(opts.height);
            s.cycleH = (opts.fit && opts.height) ? opts.height : $s.height();
            s.cycleW = (opts.fit && opts.width) ? opts.width : $s.width();

            $s.css(opts.cssBefore);

            if (opts.pager || opts.pagerAnchorBuilder)
                $.fn.cycle.createPagerAnchor(els.length - 1, s, $(opts.pager), els, opts);

            if ($.isFunction(opts.onAddSlide))
                opts.onAddSlide($s);
            else
                $s.hide(); // default behavior
        };
    }

    // reset internal state; we do this on every pass in order to support multiple effects
    $.fn.cycle.resetState = function (opts, fx) {
        fx = fx || opts.fx;
        opts.before = []; opts.after = [];
        opts.cssBefore = $.extend({}, opts.original.cssBefore);
        opts.cssAfter = $.extend({}, opts.original.cssAfter);
        opts.animIn = $.extend({}, opts.original.animIn);
        opts.animOut = $.extend({}, opts.original.animOut);
        opts.fxFn = null;
        $.each(opts.original.before, function () { opts.before.push(this); });
        $.each(opts.original.after, function () { opts.after.push(this); });

        // re-init
        var init = $.fn.cycle.transitions[fx];
        if ($.isFunction(init))
            init(opts.$cont, $(opts.elements), opts);
    };

    // this is the main engine fn, it handles the timeouts, callbacks and slide index mgmt
    function go(els, opts, manual, fwd) {
        var p = opts.$cont[0], curr = els[opts.currSlide], next = els[opts.nextSlide];

        // opts.busy is true if we're in the middle of an animation
        if (manual && opts.busy && opts.manualTrump) {
            // let manual transitions requests trump active ones
            debug('manualTrump in go(), stopping active transition');
            $(els).stop(true, true);
            opts.busy = 0;
            clearTimeout(p.cycleTimeout);
        }

        // don't begin another timeout-based transition if there is one active
        if (opts.busy) {
            debug('transition active, ignoring new tx request');
            return;
        }


        // stop cycling if we have an outstanding stop request
        if (p.cycleStop != opts.stopCount || p.cycleTimeout === 0 && !manual)
            return;

        // check to see if we should stop cycling based on autostop options
        if (!manual && !p.cyclePause && !opts.bounce &&
            ((opts.autostop && (--opts.countdown <= 0)) ||
                (opts.nowrap && !opts.random && opts.nextSlide < opts.currSlide))) {
            if (opts.end)
                opts.end(opts);
            return;
        }

        // if slideshow is paused, only transition on a manual trigger
        var changed = false;
        if ((manual || !p.cyclePause) && (opts.nextSlide != opts.currSlide)) {
            changed = true;
            var fx = opts.fx;
            // keep trying to get the slide size if we don't have it yet
            curr.cycleH = curr.cycleH || $(curr).height();
            curr.cycleW = curr.cycleW || $(curr).width();
            next.cycleH = next.cycleH || $(next).height();
            next.cycleW = next.cycleW || $(next).width();

            // support multiple transition types
            if (opts.multiFx) {
                if (fwd && (opts.lastFx == undefined || ++opts.lastFx >= opts.fxs.length))
                    opts.lastFx = 0;
                else if (!fwd && (opts.lastFx == undefined || --opts.lastFx < 0))
                    opts.lastFx = opts.fxs.length - 1;
                fx = opts.fxs[opts.lastFx];
            }

            // one-time fx overrides apply to:  $('div').cycle(3,'zoom');
            if (opts.oneTimeFx) {
                fx = opts.oneTimeFx;
                opts.oneTimeFx = null;
            }

            $.fn.cycle.resetState(opts, fx);

            // run the before callbacks
            if (opts.before.length)
                $.each(opts.before, function (i, o) {
                    if (p.cycleStop != opts.stopCount) return;
                    o.apply(next, [curr, next, opts, fwd]);
                });

            // stage the after callacks
            var after = function () {
                opts.busy = 0;
                $.each(opts.after, function (i, o) {
                    if (p.cycleStop != opts.stopCount) return;
                    o.apply(next, [curr, next, opts, fwd]);
                });
                if (!p.cycleStop) {
                    // queue next transition
                    queueNext();
                }
            };

            debug('tx firing(' + fx + '); currSlide: ' + opts.currSlide + '; nextSlide: ' + opts.nextSlide);

            // get ready to perform the transition
            opts.busy = 1;
            if (opts.fxFn) // fx function provided?
                opts.fxFn(curr, next, opts, after, fwd, manual && opts.fastOnEvent);
            else if ($.isFunction($.fn.cycle[opts.fx])) // fx plugin ?
                $.fn.cycle[opts.fx](curr, next, opts, after, fwd, manual && opts.fastOnEvent);
            else
                $.fn.cycle.custom(curr, next, opts, after, fwd, manual && opts.fastOnEvent);
        }
        else {
            queueNext();
        }

        if (changed || opts.nextSlide == opts.currSlide) {
            // calculate the next slide
            opts.lastSlide = opts.currSlide;
            if (opts.random) {
                opts.currSlide = opts.nextSlide;
                if (++opts.randomIndex == els.length) {
                    opts.randomIndex = 0;
                    opts.randomMap.sort(function (a, b) { return Math.random() - 0.5; });
                }
                opts.nextSlide = opts.randomMap[opts.randomIndex];
                if (opts.nextSlide == opts.currSlide)
                    opts.nextSlide = (opts.currSlide == opts.slideCount - 1) ? 0 : opts.currSlide + 1;
            }
            else if (opts.backwards) {
                var roll = (opts.nextSlide - 1) < 0;
                if (roll && opts.bounce) {
                    opts.backwards = !opts.backwards;
                    opts.nextSlide = 1;
                    opts.currSlide = 0;
                }
                else {
                    opts.nextSlide = roll ? (els.length - 1) : opts.nextSlide - 1;
                    opts.currSlide = roll ? 0 : opts.nextSlide + 1;
                }
            }
            else { // sequence
                var roll = (opts.nextSlide + 1) == els.length;
                if (roll && opts.bounce) {
                    opts.backwards = !opts.backwards;
                    opts.nextSlide = els.length - 2;
                    opts.currSlide = els.length - 1;
                }
                else {
                    opts.nextSlide = roll ? 0 : opts.nextSlide + 1;
                    opts.currSlide = roll ? els.length - 1 : opts.nextSlide - 1;
                }
            }
        }
        if (changed && opts.pager)
            opts.updateActivePagerLink(opts.pager, opts.currSlide, opts.activePagerClass);

        function queueNext() {
            // stage the next transition
            var ms = 0, timeout = opts.timeout;
            if (opts.timeout && !opts.continuous) {
                ms = getTimeout(els[opts.currSlide], els[opts.nextSlide], opts, fwd);
                if (opts.fx == 'shuffle')
                    ms -= opts.speedOut;
            }
            else if (opts.continuous && p.cyclePause) // continuous shows work off an after callback, not this timer logic
                ms = 10;
            if (ms > 0)
                p.cycleTimeout = setTimeout(function () { go(els, opts, 0, !opts.backwards) }, ms);
        }
    };

    // invoked after transition
    $.fn.cycle.updateActivePagerLink = function (pager, currSlide, clsName) {
        $(pager).each(function () {
            $(this).children().removeClass(clsName).eq(currSlide).addClass(clsName);
        });
    };

    // calculate timeout value for current transition
    function getTimeout(curr, next, opts, fwd) {
        if (opts.timeoutFn) {
            // call user provided calc fn
            var t = opts.timeoutFn.call(curr, curr, next, opts, fwd);
            while (opts.fx != 'none' && (t - opts.speed) < 250) // sanitize timeout
                t += opts.speed;
            debug('calculated timeout: ' + t + '; speed: ' + opts.speed);
            if (t !== false)
                return t;
        }
        return opts.timeout;
    };

    // expose next/prev function, caller must pass in state
    $.fn.cycle.next = function (opts) { advance(opts, 1); };
    $.fn.cycle.prev = function (opts) { advance(opts, 0); };

    // advance slide forward or back
    function advance(opts, moveForward) {
        var val = moveForward ? 1 : -1;
        var els = opts.elements;
        var p = opts.$cont[0], timeout = p.cycleTimeout;
        if (timeout) {
            clearTimeout(timeout);
            p.cycleTimeout = 0;
        }
        if (opts.random && val < 0) {
            // move back to the previously display slide
            opts.randomIndex--;
            if (--opts.randomIndex == -2)
                opts.randomIndex = els.length - 2;
            else if (opts.randomIndex == -1)
                opts.randomIndex = els.length - 1;
            opts.nextSlide = opts.randomMap[opts.randomIndex];
        }
        else if (opts.random) {
            opts.nextSlide = opts.randomMap[opts.randomIndex];
        }
        else {
            opts.nextSlide = opts.currSlide + val;
            if (opts.nextSlide < 0) {
                if (opts.nowrap) return false;
                opts.nextSlide = els.length - 1;
            }
            else if (opts.nextSlide >= els.length) {
                if (opts.nowrap) return false;
                opts.nextSlide = 0;
            }
        }

        var cb = opts.onPrevNextEvent || opts.prevNextClick; // prevNextClick is deprecated
        if ($.isFunction(cb))
            cb(val > 0, opts.nextSlide, els[opts.nextSlide]);
        go(els, opts, 1, moveForward);
        return false;
    };

    function buildPager(els, opts) {
        var $p = $(opts.pager);
        $.each(els, function (i, o) {
            $.fn.cycle.createPagerAnchor(i, o, $p, els, opts);
        });
        opts.updateActivePagerLink(opts.pager, opts.startingSlide, opts.activePagerClass);
    };

    $.fn.cycle.createPagerAnchor = function (i, el, $p, els, opts) {
        var a;
        if ($.isFunction(opts.pagerAnchorBuilder)) {
            a = opts.pagerAnchorBuilder(i, el);
            debug('pagerAnchorBuilder(' + i + ', el) returned: ' + a);
        }
        else
            a = '<a href="#">' + (i + 1) + '</a>';

        if (!a)
            return;
        var $a = $(a);
        // don't reparent if anchor is in the dom
        if ($a.parents('body').length === 0) {
            var arr = [];
            if ($p.length > 1) {
                $p.each(function () {
                    var $clone = $a.clone(true);
                    $(this).append($clone);
                    arr.push($clone[0]);
                });
                $a = $(arr);
            }
            else {
                $a.appendTo($p);
            }
        }

        opts.pagerAnchors = opts.pagerAnchors || [];
        opts.pagerAnchors.push($a);

        var pagerFn = function (e) {
            e.preventDefault();
            opts.nextSlide = i;
            var p = opts.$cont[0], timeout = p.cycleTimeout;
            if (timeout) {
                clearTimeout(timeout);
                p.cycleTimeout = 0;
            }
            var cb = opts.onPagerEvent || opts.pagerClick; // pagerClick is deprecated
            if ($.isFunction(cb))
                cb(opts.nextSlide, els[opts.nextSlide]);
            go(els, opts, 1, opts.currSlide < i); // trigger the trans
            //		return false; // <== allow bubble
        };

        if (/mouseenter|mouseover/i.test(opts.pagerEvent)) {
            $a.hover(pagerFn, function () {/* no-op */ });
        }
        else {
            $a.bind(opts.pagerEvent, pagerFn);
        }

        if (! /^click/.test(opts.pagerEvent) && !opts.allowPagerClickBubble)
            $a.bind('click.cycle', function () { return false; }); // suppress click

        var cont = opts.$cont[0];
        var pauseFlag = false; // https://github.com/malsup/cycle/issues/44
        if (opts.pauseOnPagerHover) {
            $a.hover(
                function () {
                    pauseFlag = true;
                    cont.cyclePause++;
                    triggerPause(cont, true, true);
                }, function () {
                    pauseFlag && cont.cyclePause--;
                    triggerPause(cont, true, true);
                }
            );
        }
    };

    // helper fn to calculate the number of slides between the current and the next
    $.fn.cycle.hopsFromLast = function (opts, fwd) {
        var hops, l = opts.lastSlide, c = opts.currSlide;
        if (fwd)
            hops = c > l ? c - l : opts.slideCount - l;
        else
            hops = c < l ? l - c : l + opts.slideCount - c;
        return hops;
    };

    // fix clearType problems in ie6 by setting an explicit bg color
    // (otherwise text slides look horrible during a fade transition)
    function clearTypeFix($slides) {
        debug('applying clearType background-color hack');
        function hex(s) {
            s = parseInt(s, 10).toString(16);
            return s.length < 2 ? '0' + s : s;
        };
        function getBg(e) {
            for (; e && e.nodeName.toLowerCase() != 'html'; e = e.parentNode) {
                var v = $.css(e, 'background-color');
                if (v && v.indexOf('rgb') >= 0) {
                    var rgb = v.match(/\d+/g);
                    return '#' + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
                }
                if (v && v != 'transparent')
                    return v;
            }
            return '#ffffff';
        };
        $slides.each(function () { $(this).css('background-color', getBg(this)); });
    };

    // reset common props before the next transition
    $.fn.cycle.commonReset = function (curr, next, opts, w, h, rev) {
        $(opts.elements).not(curr).hide();
        if (typeof opts.cssBefore.opacity == 'undefined')
            opts.cssBefore.opacity = 1;
        opts.cssBefore.display = 'block';
        if (opts.slideResize && w !== false && next.cycleW > 0)
            opts.cssBefore.width = next.cycleW;
        if (opts.slideResize && h !== false && next.cycleH > 0)
            opts.cssBefore.height = next.cycleH;
        opts.cssAfter = opts.cssAfter || {};
        opts.cssAfter.display = 'none';
        $(curr).css('zIndex', opts.slideCount + (rev === true ? 1 : 0));
        $(next).css('zIndex', opts.slideCount + (rev === true ? 0 : 1));
    };

    // the actual fn for effecting a transition
    $.fn.cycle.custom = function (curr, next, opts, cb, fwd, speedOverride) {
        var $l = $(curr), $n = $(next);
        var speedIn = opts.speedIn, speedOut = opts.speedOut, easeIn = opts.easeIn, easeOut = opts.easeOut;
        $n.css(opts.cssBefore);
        if (speedOverride) {
            if (typeof speedOverride == 'number')
                speedIn = speedOut = speedOverride;
            else
                speedIn = speedOut = 1;
            easeIn = easeOut = null;
        }
        var fn = function () {
            $n.animate(opts.animIn, speedIn, easeIn, function () {
                cb();
            });
        };
        $l.animate(opts.animOut, speedOut, easeOut, function () {
            $l.css(opts.cssAfter);
            if (!opts.sync)
                fn();
        });
        if (opts.sync) fn();
    };

    // transition definitions - only fade is defined here, transition pack defines the rest
    $.fn.cycle.transitions = {
        fade: function ($cont, $slides, opts) {
            $slides.not(':eq(' + opts.currSlide + ')').css('opacity', 0);
            opts.before.push(function (curr, next, opts) {
                $.fn.cycle.commonReset(curr, next, opts);
                opts.cssBefore.opacity = 0;
            });
            opts.animIn = { opacity: 1 };
            opts.animOut = { opacity: 0 };
            opts.cssBefore = { top: 0, left: 0 };
        }
    };

    $.fn.cycle.ver = function () { return ver; };

    // override these globally if you like (they are all optional)
    $.fn.cycle.defaults = {
        activePagerClass: 'activeSlide', // class name used for the active pager link
        after: null,  // transition callback (scope set to element that was shown):  function(currSlideElement, nextSlideElement, options, forwardFlag)
        allowPagerClickBubble: false, // allows or prevents click event on pager anchors from bubbling
        animIn: null,  // properties that define how the slide animates in
        animOut: null,  // properties that define how the slide animates out
        aspect: false,  // preserve aspect ratio during fit resizing, cropping if necessary (must be used with fit option)
        autostop: 0,	  // true to end slideshow after X transitions (where X == slide count)
        autostopCount: 0,	  // number of transitions (optionally used with autostop to define X)
        backwards: false, // true to start slideshow at last slide and move backwards through the stack
        before: null,  // transition callback (scope set to element to be shown):	 function(currSlideElement, nextSlideElement, options, forwardFlag)
        center: null,  // set to true to have cycle add top/left margin to each slide (use with width and height options)
        cleartype: !$.support.opacity,  // true if clearType corrections should be applied (for IE)
        cleartypeNoBg: false, // set to true to disable extra cleartype fixing (leave false to force background color setting on slides)
        containerResize: 1,	  // resize container to fit largest slide
        continuous: 0,	  // true to start next transition immediately after current one completes
        cssAfter: null,  // properties that defined the state of the slide after transitioning out
        cssBefore: null,  // properties that define the initial state of the slide before transitioning in
        delay: 0,	  // additional delay (in ms) for first transition (hint: can be negative)
        easeIn: null,  // easing for "in" transition
        easeOut: null,  // easing for "out" transition
        easing: null,  // easing method for both in and out transitions
        end: null,  // callback invoked when the slideshow terminates (use with autostop or nowrap options): function(options)
        fastOnEvent: 0,	  // force fast transitions when triggered manually (via pager or prev/next); value == time in ms
        fit: 0,	  // force slides to fit container
        fx: 'fade', // name of transition effect (or comma separated names, ex: 'fade,scrollUp,shuffle')
        fxFn: null,  // function used to control the transition: function(currSlideElement, nextSlideElement, options, afterCalback, forwardFlag)
        height: 'auto', // container height (if the 'fit' option is true, the slides will be set to this height as well)
        manualTrump: true,  // causes manual transition to stop an active transition instead of being ignored
        metaAttr: 'cycle',// data- attribute that holds the option data for the slideshow
        next: null,  // element, jQuery object, or jQuery selector string for the element to use as event trigger for next slide
        nowrap: 0,	  // true to prevent slideshow from wrapping
        onPagerEvent: null,  // callback fn for pager events: function(zeroBasedSlideIndex, slideElement)
        onPrevNextEvent: null,// callback fn for prev/next events: function(isNext, zeroBasedSlideIndex, slideElement)
        pager: null,  // element, jQuery object, or jQuery selector string for the element to use as pager container
        pagerAnchorBuilder: null, // callback fn for building anchor links:  function(index, DOMelement)
        pagerEvent: 'click.cycle', // name of event which drives the pager navigation
        pause: 0,	  // true to enable "pause on hover"
        pauseOnPagerHover: 0, // true to pause when hovering over pager link
        prev: null,  // element, jQuery object, or jQuery selector string for the element to use as event trigger for previous slide
        prevNextEvent: 'click.cycle',// event which drives the manual transition to the previous or next slide
        random: 0,	  // true for random, false for sequence (not applicable to shuffle fx)
        randomizeEffects: 1,  // valid when multiple effects are used; true to make the effect sequence random
        requeueOnImageNotLoaded: true, // requeue the slideshow if any image slides are not yet loaded
        requeueTimeout: 250,  // ms delay for requeue
        rev: 0,	  // causes animations to transition in reverse (for effects that support it such as scrollHorz/scrollVert/shuffle)
        shuffle: null,  // coords for shuffle animation, ex: { top:15, left: 200 }
        skipInitializationCallbacks: false, // set to true to disable the first before/after callback that occurs prior to any transition
        slideExpr: null,  // expression for selecting slides (if something other than all children is required)
        slideResize: 1,     // force slide width/height to fixed size before every transition
        speed: 1000,  // speed of the transition (any valid fx speed value)
        speedIn: null,  // speed of the 'in' transition
        speedOut: null,  // speed of the 'out' transition
        startingSlide: undefined,	  // zero-based index of the first slide to be displayed
        sync: 1,	  // true if in/out transitions should occur simultaneously
        timeout: 4000,  // milliseconds between slide transitions (0 to disable auto advance)
        timeoutFn: null,  // callback for determining per-slide timeout value:  function(currSlideElement, nextSlideElement, options, forwardFlag)
        updateActivePagerLink: null, // callback fn invoked to update the active pager link (adds/removes activePagerClass style)
        width: null   // container width (if the 'fit' option is true, the slides will be set to this width as well)
    };

})(jQuery);


/*!
 * jQuery Cycle Plugin Transition Definitions
 * This script is a plugin for the jQuery Cycle Plugin
 * Examples and documentation at: http://malsup.com/jquery/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version:	 2.73
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */
(function ($) {

    //
    // These functions define slide initialization and properties for the named
    // transitions. To save file size feel free to remove any of these that you
    // don't need.
    //
    $.fn.cycle.transitions.none = function ($cont, $slides, opts) {
        opts.fxFn = function (curr, next, opts, after) {
            $(next).show();
            $(curr).hide();
            after();
        };
    };

    // not a cross-fade, fadeout only fades out the top slide
    $.fn.cycle.transitions.fadeout = function ($cont, $slides, opts) {
        $slides.not(':eq(' + opts.currSlide + ')').css({ display: 'block', 'opacity': 1 });
        opts.before.push(function (curr, next, opts, w, h, rev) {
            $(curr).css('zIndex', opts.slideCount + (!rev === true ? 1 : 0));
            $(next).css('zIndex', opts.slideCount + (!rev === true ? 0 : 1));
        });
        opts.animIn.opacity = 1;
        opts.animOut.opacity = 0;
        opts.cssBefore.opacity = 1;
        opts.cssBefore.display = 'block';
        opts.cssAfter.zIndex = 0;
    };

    // scrollUp/Down/Left/Right
    $.fn.cycle.transitions.scrollUp = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push($.fn.cycle.commonReset);
        var h = $cont.height();
        opts.cssBefore.top = h;
        opts.cssBefore.left = 0;
        opts.cssFirst.top = 0;
        opts.animIn.top = 0;
        opts.animOut.top = -h;
    };
    $.fn.cycle.transitions.scrollDown = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push($.fn.cycle.commonReset);
        var h = $cont.height();
        opts.cssFirst.top = 0;
        opts.cssBefore.top = -h;
        opts.cssBefore.left = 0;
        opts.animIn.top = 0;
        opts.animOut.top = h;
    };
    $.fn.cycle.transitions.scrollLeft = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push($.fn.cycle.commonReset);
        var w = $cont.width();
        opts.cssFirst.left = 0;
        opts.cssBefore.left = w;
        opts.cssBefore.top = 0;
        opts.animIn.left = 0;
        opts.animOut.left = 0 - w;
    };
    $.fn.cycle.transitions.scrollRight = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push($.fn.cycle.commonReset);
        var w = $cont.width();
        opts.cssFirst.left = 0;
        opts.cssBefore.left = -w;
        opts.cssBefore.top = 0;
        opts.animIn.left = 0;
        opts.animOut.left = w;
    };
    $.fn.cycle.transitions.scrollHorz = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden').width();
        opts.before.push(function (curr, next, opts, fwd) {
            if (opts.rev)
                fwd = !fwd;
            $.fn.cycle.commonReset(curr, next, opts);
            opts.cssBefore.left = fwd ? (next.cycleW - 1) : (1 - next.cycleW);
            opts.animOut.left = fwd ? -curr.cycleW : curr.cycleW;
        });
        opts.cssFirst.left = 0;
        opts.cssBefore.top = 0;
        opts.animIn.left = 0;
        opts.animOut.top = 0;
    };
    $.fn.cycle.transitions.scrollVert = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push(function (curr, next, opts, fwd) {
            if (opts.rev)
                fwd = !fwd;
            $.fn.cycle.commonReset(curr, next, opts);
            opts.cssBefore.top = fwd ? (1 - next.cycleH) : (next.cycleH - 1);
            opts.animOut.top = fwd ? curr.cycleH : -curr.cycleH;
        });
        opts.cssFirst.top = 0;
        opts.cssBefore.left = 0;
        opts.animIn.top = 0;
        opts.animOut.left = 0;
    };

    // slideX/slideY
    $.fn.cycle.transitions.slideX = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $(opts.elements).not(curr).hide();
            $.fn.cycle.commonReset(curr, next, opts, false, true);
            opts.animIn.width = next.cycleW;
        });
        opts.cssBefore.left = 0;
        opts.cssBefore.top = 0;
        opts.cssBefore.width = 0;
        opts.animIn.width = 'show';
        opts.animOut.width = 0;
    };
    $.fn.cycle.transitions.slideY = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $(opts.elements).not(curr).hide();
            $.fn.cycle.commonReset(curr, next, opts, true, false);
            opts.animIn.height = next.cycleH;
        });
        opts.cssBefore.left = 0;
        opts.cssBefore.top = 0;
        opts.cssBefore.height = 0;
        opts.animIn.height = 'show';
        opts.animOut.height = 0;
    };

    // shuffle
    $.fn.cycle.transitions.shuffle = function ($cont, $slides, opts) {
        var i, w = $cont.css('overflow', 'visible').width();
        $slides.css({ left: 0, top: 0 });
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, true, true, true);
        });
        // only adjust speed once!
        if (!opts.speedAdjusted) {
            opts.speed = opts.speed / 2; // shuffle has 2 transitions
            opts.speedAdjusted = true;
        }
        opts.random = 0;
        opts.shuffle = opts.shuffle || { left: -w, top: 15 };
        opts.els = [];
        for (i = 0; i < $slides.length; i++)
            opts.els.push($slides[i]);

        for (i = 0; i < opts.currSlide; i++)
            opts.els.push(opts.els.shift());

        // custom transition fn (hat tip to Benjamin Sterling for this bit of sweetness!)
        opts.fxFn = function (curr, next, opts, cb, fwd) {
            if (opts.rev)
                fwd = !fwd;
            var $el = fwd ? $(curr) : $(next);
            $(next).css(opts.cssBefore);
            var count = opts.slideCount;
            $el.animate(opts.shuffle, opts.speedIn, opts.easeIn, function () {
                var hops = $.fn.cycle.hopsFromLast(opts, fwd);
                for (var k = 0; k < hops; k++)
                    fwd ? opts.els.push(opts.els.shift()) : opts.els.unshift(opts.els.pop());
                if (fwd) {
                    for (var i = 0, len = opts.els.length; i < len; i++)
                        $(opts.els[i]).css('z-index', len - i + count);
                }
                else {
                    var z = $(curr).css('z-index');
                    $el.css('z-index', parseInt(z, 10) + 1 + count);
                }
                $el.animate({ left: 0, top: 0 }, opts.speedOut, opts.easeOut, function () {
                    $(fwd ? this : curr).hide();
                    if (cb) cb();
                });
            });
        };
        $.extend(opts.cssBefore, { display: 'block', opacity: 1, top: 0, left: 0 });
    };

    // turnUp/Down/Left/Right
    $.fn.cycle.transitions.turnUp = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, true, false);
            opts.cssBefore.top = next.cycleH;
            opts.animIn.height = next.cycleH;
            opts.animOut.width = next.cycleW;
        });
        opts.cssFirst.top = 0;
        opts.cssBefore.left = 0;
        opts.cssBefore.height = 0;
        opts.animIn.top = 0;
        opts.animOut.height = 0;
    };
    $.fn.cycle.transitions.turnDown = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, true, false);
            opts.animIn.height = next.cycleH;
            opts.animOut.top = curr.cycleH;
        });
        opts.cssFirst.top = 0;
        opts.cssBefore.left = 0;
        opts.cssBefore.top = 0;
        opts.cssBefore.height = 0;
        opts.animOut.height = 0;
    };
    $.fn.cycle.transitions.turnLeft = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, false, true);
            opts.cssBefore.left = next.cycleW;
            opts.animIn.width = next.cycleW;
        });
        opts.cssBefore.top = 0;
        opts.cssBefore.width = 0;
        opts.animIn.left = 0;
        opts.animOut.width = 0;
    };
    $.fn.cycle.transitions.turnRight = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, false, true);
            opts.animIn.width = next.cycleW;
            opts.animOut.left = curr.cycleW;
        });
        $.extend(opts.cssBefore, { top: 0, left: 0, width: 0 });
        opts.animIn.left = 0;
        opts.animOut.width = 0;
    };

    // zoom
    $.fn.cycle.transitions.zoom = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, false, false, true);
            opts.cssBefore.top = next.cycleH / 2;
            opts.cssBefore.left = next.cycleW / 2;
            $.extend(opts.animIn, { top: 0, left: 0, width: next.cycleW, height: next.cycleH });
            $.extend(opts.animOut, { width: 0, height: 0, top: curr.cycleH / 2, left: curr.cycleW / 2 });
        });
        opts.cssFirst.top = 0;
        opts.cssFirst.left = 0;
        opts.cssBefore.width = 0;
        opts.cssBefore.height = 0;
    };

    // fadeZoom
    $.fn.cycle.transitions.fadeZoom = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, false, false);
            opts.cssBefore.left = next.cycleW / 2;
            opts.cssBefore.top = next.cycleH / 2;
            $.extend(opts.animIn, { top: 0, left: 0, width: next.cycleW, height: next.cycleH });
        });
        opts.cssBefore.width = 0;
        opts.cssBefore.height = 0;
        opts.animOut.opacity = 0;
    };

    // blindX
    $.fn.cycle.transitions.blindX = function ($cont, $slides, opts) {
        var w = $cont.css('overflow', 'hidden').width();
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts);
            opts.animIn.width = next.cycleW;
            opts.animOut.left = curr.cycleW;
        });
        opts.cssBefore.left = w;
        opts.cssBefore.top = 0;
        opts.animIn.left = 0;
        opts.animOut.left = w;
    };
    // blindY
    $.fn.cycle.transitions.blindY = function ($cont, $slides, opts) {
        var h = $cont.css('overflow', 'hidden').height();
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts);
            opts.animIn.height = next.cycleH;
            opts.animOut.top = curr.cycleH;
        });
        opts.cssBefore.top = h;
        opts.cssBefore.left = 0;
        opts.animIn.top = 0;
        opts.animOut.top = h;
    };
    // blindZ
    $.fn.cycle.transitions.blindZ = function ($cont, $slides, opts) {
        var h = $cont.css('overflow', 'hidden').height();
        var w = $cont.width();
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts);
            opts.animIn.height = next.cycleH;
            opts.animOut.top = curr.cycleH;
        });
        opts.cssBefore.top = h;
        opts.cssBefore.left = w;
        opts.animIn.top = 0;
        opts.animIn.left = 0;
        opts.animOut.top = h;
        opts.animOut.left = w;
    };

    // growX - grow horizontally from centered 0 width
    $.fn.cycle.transitions.growX = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, false, true);
            opts.cssBefore.left = this.cycleW / 2;
            opts.animIn.left = 0;
            opts.animIn.width = this.cycleW;
            opts.animOut.left = 0;
        });
        opts.cssBefore.top = 0;
        opts.cssBefore.width = 0;
    };
    // growY - grow vertically from centered 0 height
    $.fn.cycle.transitions.growY = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, true, false);
            opts.cssBefore.top = this.cycleH / 2;
            opts.animIn.top = 0;
            opts.animIn.height = this.cycleH;
            opts.animOut.top = 0;
        });
        opts.cssBefore.height = 0;
        opts.cssBefore.left = 0;
    };

    // curtainX - squeeze in both edges horizontally
    $.fn.cycle.transitions.curtainX = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, false, true, true);
            opts.cssBefore.left = next.cycleW / 2;
            opts.animIn.left = 0;
            opts.animIn.width = this.cycleW;
            opts.animOut.left = curr.cycleW / 2;
            opts.animOut.width = 0;
        });
        opts.cssBefore.top = 0;
        opts.cssBefore.width = 0;
    };
    // curtainY - squeeze in both edges vertically
    $.fn.cycle.transitions.curtainY = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, true, false, true);
            opts.cssBefore.top = next.cycleH / 2;
            opts.animIn.top = 0;
            opts.animIn.height = next.cycleH;
            opts.animOut.top = curr.cycleH / 2;
            opts.animOut.height = 0;
        });
        opts.cssBefore.height = 0;
        opts.cssBefore.left = 0;
    };

    // cover - curr slide covered by next slide
    $.fn.cycle.transitions.cover = function ($cont, $slides, opts) {
        var d = opts.direction || 'left';
        var w = $cont.css('overflow', 'hidden').width();
        var h = $cont.height();
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts);
            if (d == 'right')
                opts.cssBefore.left = -w;
            else if (d == 'up')
                opts.cssBefore.top = h;
            else if (d == 'down')
                opts.cssBefore.top = -h;
            else
                opts.cssBefore.left = w;
        });
        opts.animIn.left = 0;
        opts.animIn.top = 0;
        opts.cssBefore.top = 0;
        opts.cssBefore.left = 0;
    };

    // uncover - curr slide moves off next slide
    $.fn.cycle.transitions.uncover = function ($cont, $slides, opts) {
        var d = opts.direction || 'left';
        var w = $cont.css('overflow', 'hidden').width();
        var h = $cont.height();
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, true, true, true);
            if (d == 'right')
                opts.animOut.left = w;
            else if (d == 'up')
                opts.animOut.top = -h;
            else if (d == 'down')
                opts.animOut.top = h;
            else
                opts.animOut.left = -w;
        });
        opts.animIn.left = 0;
        opts.animIn.top = 0;
        opts.cssBefore.top = 0;
        opts.cssBefore.left = 0;
    };

    // toss - move top slide and fade away
    $.fn.cycle.transitions.toss = function ($cont, $slides, opts) {
        var w = $cont.css('overflow', 'visible').width();
        var h = $cont.height();
        opts.before.push(function (curr, next, opts) {
            $.fn.cycle.commonReset(curr, next, opts, true, true, true);
            // provide default toss settings if animOut not provided
            if (!opts.animOut.left && !opts.animOut.top)
                $.extend(opts.animOut, { left: w * 2, top: -h / 2, opacity: 0 });
            else
                opts.animOut.opacity = 0;
        });
        opts.cssBefore.left = 0;
        opts.cssBefore.top = 0;
        opts.animIn.left = 0;
    };

    // wipe - clip animation
    $.fn.cycle.transitions.wipe = function ($cont, $slides, opts) {
        var w = $cont.css('overflow', 'hidden').width();
        var h = $cont.height();
        opts.cssBefore = opts.cssBefore || {};
        var clip;
        if (opts.clip) {
            if (/l2r/.test(opts.clip))
                clip = 'rect(0px 0px ' + h + 'px 0px)';
            else if (/r2l/.test(opts.clip))
                clip = 'rect(0px ' + w + 'px ' + h + 'px ' + w + 'px)';
            else if (/t2b/.test(opts.clip))
                clip = 'rect(0px ' + w + 'px 0px 0px)';
            else if (/b2t/.test(opts.clip))
                clip = 'rect(' + h + 'px ' + w + 'px ' + h + 'px 0px)';
            else if (/zoom/.test(opts.clip)) {
                var top = parseInt(h / 2, 10);
                var left = parseInt(w / 2, 10);
                clip = 'rect(' + top + 'px ' + left + 'px ' + top + 'px ' + left + 'px)';
            }
        }

        opts.cssBefore.clip = opts.cssBefore.clip || clip || 'rect(0px 0px 0px 0px)';

        var d = opts.cssBefore.clip.match(/(\d+)/g);
        var t = parseInt(d[0], 10), r = parseInt(d[1], 10), b = parseInt(d[2], 10), l = parseInt(d[3], 10);

        opts.before.push(function (curr, next, opts) {
            if (curr == next) return;
            var $curr = $(curr), $next = $(next);
            $.fn.cycle.commonReset(curr, next, opts, true, true, false);
            opts.cssAfter.display = 'block';

            var step = 1, count = parseInt((opts.speedIn / 13), 10) - 1;
            (function f() {
                var tt = t ? t - parseInt(step * (t / count), 10) : 0;
                var ll = l ? l - parseInt(step * (l / count), 10) : 0;
                var bb = b < h ? b + parseInt(step * ((h - b) / count || 1), 10) : h;
                var rr = r < w ? r + parseInt(step * ((w - r) / count || 1), 10) : w;
                $next.css({ clip: 'rect(' + tt + 'px ' + rr + 'px ' + bb + 'px ' + ll + 'px)' });
                (step++ <= count) ? setTimeout(f, 13) : $curr.css('display', 'none');
            })();
        });
        $.extend(opts.cssBefore, { display: 'block', opacity: 1, top: 0, left: 0 });
        opts.animIn = { left: 0 };
        opts.animOut = { left: 0 };
    };
})(jQuery);






//______________custom-form-elements.js____________

/*
CUSTOM FORM ELEMENTS

Created by Ryan Fait
www.ryanfait.com

The only things you may need to change in this file are the following
variables: checkboxHeight, radioHeight and selectWidth (lines 24, 25, 26)

The numbers you set for checkboxHeight and radioHeight should be one quarter
of the total height of the image want to use for checkboxes and radio
buttons. Both images should contain the four stages of both inputs stacked
on top of each other in this order: unchecked, unchecked-clicked, checked,
checked-clicked.

You may need to adjust your images a bit if there is a slight vertical
movement during the different stages of the button activation.

The value of selectWidth should be the width of your select list image.

Visit http://ryanfait.com/ for more information.

*/

var checkboxHeight = "25";
var radioHeight = "25";
var selectWidth = "249";


/* No need to change anything after this */


document.write('<style type="text/css">input.styled { display: none; } select.styled { position: relative; width: ' + selectWidth + 'px; opacity: 0; filter: alpha(opacity=0); z-index: 5; } .disabled { opacity: 0.5; filter: alpha(opacity=50); }</style>');

var Custom = {
    init: function () {
        var inputs = document.getElementsByTagName("input"), span = Array(), textnode, option, active;
        for (a = 0; a < inputs.length; a++) {
            if ((inputs[a].type == "checkbox" || inputs[a].type == "radio") && inputs[a].className == "styled") {
                span[a] = document.createElement("span");
                span[a].className = inputs[a].type;

                if (inputs[a].checked == true) {
                    if (inputs[a].type == "checkbox") {
                        position = "0 -" + (checkboxHeight * 2) + "px";
                        span[a].style.backgroundPosition = position;
                    } else {
                        position = "0 -" + (radioHeight * 2) + "px";
                        span[a].style.backgroundPosition = position;
                    }
                }
                inputs[a].parentNode.insertBefore(span[a], inputs[a]);
                inputs[a].onchange = Custom.clear;
                if (!inputs[a].getAttribute("disabled")) {
                    span[a].onmousedown = Custom.pushed;
                    span[a].onmouseup = Custom.check;
                } else {
                    span[a].className = span[a].className += " disabled";
                }
            }
        }
        inputs = document.getElementsByTagName("select");
        for (a = 0; a < inputs.length; a++) {
            if (inputs[a].className == "styled") {
                option = inputs[a].getElementsByTagName("option");
                active = option[0].childNodes[0].nodeValue;
                textnode = document.createTextNode(active);
                for (b = 0; b < option.length; b++) {
                    if (option[b].selected == true) {
                        textnode = document.createTextNode(option[b].childNodes[0].nodeValue);
                    }
                }
                span[a] = document.createElement("span");
                span[a].className = "select";
                span[a].id = "select" + inputs[a].name;
                span[a].appendChild(textnode);
                inputs[a].parentNode.insertBefore(span[a], inputs[a]);
                if (!inputs[a].getAttribute("disabled")) {
                    inputs[a].onchange = Custom.choose;
                } else {
                    inputs[a].previousSibling.className = inputs[a].previousSibling.className += " disabled";
                }
            }
        }
        document.onmouseup = Custom.clear;
    },
    pushed: function () {
        element = this.nextSibling;
        if (element.checked == true && element.type == "checkbox") {
            this.style.backgroundPosition = "0 -" + checkboxHeight * 3 + "px";
        } else if (element.checked == true && element.type == "radio") {
            this.style.backgroundPosition = "0 -" + radioHeight * 3 + "px";
        } else if (element.checked != true && element.type == "checkbox") {
            this.style.backgroundPosition = "0 -" + checkboxHeight + "px";
        } else {
            this.style.backgroundPosition = "0 -" + radioHeight + "px";
        }
    },
    check: function () {
        element = this.nextSibling;
        if (element.checked == true && element.type == "checkbox") {
            this.style.backgroundPosition = "0 0";
            element.checked = false;
        } else {
            if (element.type == "checkbox") {
                this.style.backgroundPosition = "0 -" + checkboxHeight * 2 + "px";
            } else {
                this.style.backgroundPosition = "0 -" + radioHeight * 2 + "px";
                group = this.nextSibling.name;
                inputs = document.getElementsByTagName("input");
                for (a = 0; a < inputs.length; a++) {
                    if (inputs[a].name == group && inputs[a] != this.nextSibling) {
                        inputs[a].previousSibling.style.backgroundPosition = "0 0";
                    }
                }
            }
            element.checked = true;
        }
    },
    clear: function () {
        inputs = document.getElementsByTagName("input");
        for (var b = 0; b < inputs.length; b++) {
            if (inputs[b].type == "checkbox" && inputs[b].checked == true && inputs[b].className == "styled") {
                inputs[b].previousSibling.style.backgroundPosition = "0 -" + checkboxHeight * 2 + "px";
            } else if (inputs[b].type == "checkbox" && inputs[b].className == "styled") {
                inputs[b].previousSibling.style.backgroundPosition = "0 0";
            } else if (inputs[b].type == "radio" && inputs[b].checked == true && inputs[b].className == "styled") {
                inputs[b].previousSibling.style.backgroundPosition = "0 -" + radioHeight * 2 + "px";
            } else if (inputs[b].type == "radio" && inputs[b].className == "styled") {
                inputs[b].previousSibling.style.backgroundPosition = "0 0";
            }
        }
    },
    choose: function () {
        option = this.getElementsByTagName("option");
        for (d = 0; d < option.length; d++) {
            if (option[d].selected == true) {
                document.getElementById("select" + this.name).childNodes[0].nodeValue = option[d].childNodes[0].nodeValue;
            }
        }
    }
}
window.onload = Custom.init;




//______________jquery.jscrollpane.min.js____________
/*
 * jScrollPane - v2.0.0beta12 - 2012-06-21
 * http://jscrollpane.kelvinluck.com/
 *
 * Copyright (c) 2010 Kelvin Luck
 * Dual licensed under the MIT and GPL licenses.
 */
(function (b, a, c) {
    b.fn.jScrollPane = function (e) {
        function d(D, O) {
            var ay, Q = this, Y, aj, v, al, T, Z, y, q, az, aE, au, i, I, h, j, aa, U, ap, X, t, A, aq, af, am, G, l, at, ax, x, av, aH, f, L, ai = true, P = true, aG = false, k = false, ao = D.clone(false, false).empty(), ac = b.fn.mwheelIntent ? "mwheelIntent.jsp" : "mousewheel.jsp"; aH = D.css("paddingTop") + " " + D.css("paddingRight") + " " + D.css("paddingBottom") + " " + D.css("paddingLeft"); f = (parseInt(D.css("paddingLeft"), 10) || 0) + (parseInt(D.css("paddingRight"), 10) || 0); function ar(aQ) { var aL, aN, aM, aJ, aI, aP, aO = false, aK = false; ay = aQ; if (Y === c) { aI = D.scrollTop(); aP = D.scrollLeft(); D.css({ overflow: "hidden", padding: 0 }); aj = D.innerWidth() + f; v = D.innerHeight(); D.width(aj); Y = b('<div class="jspPane" />').css("padding", aH).append(D.children()); al = b('<div class="jspContainer" />').css({ width: aj + "px", height: v + "px" }).append(Y).appendTo(D) } else { D.css("width", ""); aO = ay.stickToBottom && K(); aK = ay.stickToRight && B(); aJ = D.innerWidth() + f != aj || D.outerHeight() != v; if (aJ) { aj = D.innerWidth() + f; v = D.innerHeight(); al.css({ width: aj + "px", height: v + "px" }) } if (!aJ && L == T && Y.outerHeight() == Z) { D.width(aj); return } L = T; Y.css("width", ""); D.width(aj); al.find(">.jspVerticalBar,>.jspHorizontalBar").remove().end() } Y.css("overflow", "auto"); if (aQ.contentWidth) { T = aQ.contentWidth } else { T = Y[0].scrollWidth } Z = Y[0].scrollHeight; Y.css("overflow", ""); y = T / aj; q = Z / v; az = q > 1; aE = y > 1; if (!(aE || az)) { D.removeClass("jspScrollable"); Y.css({ top: 0, width: al.width() - f }); n(); E(); R(); w() } else { D.addClass("jspScrollable"); aL = ay.maintainPosition && (I || aa); if (aL) { aN = aC(); aM = aA() } aF(); z(); F(); if (aL) { N(aK ? (T - aj) : aN, false); M(aO ? (Z - v) : aM, false) } J(); ag(); an(); if (ay.enableKeyboardNavigation) { S() } if (ay.clickOnTrack) { p() } C(); if (ay.hijackInternalLinks) { m() } } if (ay.autoReinitialise && !av) { av = setInterval(function () { ar(ay) }, ay.autoReinitialiseDelay) } else { if (!ay.autoReinitialise && av) { clearInterval(av) } } aI && D.scrollTop(0) && M(aI, false); aP && D.scrollLeft(0) && N(aP, false); D.trigger("jsp-initialised", [aE || az]) } function aF() { if (az) { al.append(b('<div class="jspVerticalBar" />').append(b('<div class="jspCap jspCapTop" />'), b('<div class="jspTrack" />').append(b('<div class="jspDrag" />').append(b('<div class="jspDragTop" />'), b('<div class="jspDragBottom" />'))), b('<div class="jspCap jspCapBottom" />'))); U = al.find(">.jspVerticalBar"); ap = U.find(">.jspTrack"); au = ap.find(">.jspDrag"); if (ay.showArrows) { aq = b('<a class="jspArrow jspArrowUp" />').bind("mousedown.jsp", aD(0, -1)).bind("click.jsp", aB); af = b('<a class="jspArrow jspArrowDown" />').bind("mousedown.jsp", aD(0, 1)).bind("click.jsp", aB); if (ay.arrowScrollOnHover) { aq.bind("mouseover.jsp", aD(0, -1, aq)); af.bind("mouseover.jsp", aD(0, 1, af)) } ak(ap, ay.verticalArrowPositions, aq, af) } t = v; al.find(">.jspVerticalBar>.jspCap:visible,>.jspVerticalBar>.jspArrow").each(function () { t -= b(this).outerHeight() }); au.hover(function () { au.addClass("jspHover") }, function () { au.removeClass("jspHover") }).bind("mousedown.jsp", function (aI) { b("html").bind("dragstart.jsp selectstart.jsp", aB); au.addClass("jspActive"); var s = aI.pageY - au.position().top; b("html").bind("mousemove.jsp", function (aJ) { V(aJ.pageY - s, false) }).bind("mouseup.jsp mouseleave.jsp", aw); return false }); o() } } function o() { ap.height(t + "px"); I = 0; X = ay.verticalGutter + ap.outerWidth(); Y.width(aj - X - f); try { if (U.position().left === 0) { Y.css("margin-left", X + "px") } } catch (s) { } } function z() {
                if (aE) {
                    al.append(b('<div class="jspHorizontalBar" />').append(b('<div class="jspCap jspCapLeft" />'), b('<div class="jspTrack" />').append(b('<div class="jspDrag" />').append(b('<div class="jspDragLeft" />'), b('<div class="jspDragRight" />'))), b('<div class="jspCap jspCapRight" />'))); am = al.find(">.jspHorizontalBar"); G = am.find(">.jspTrack"); h = G.find(">.jspDrag"); if (ay.showArrows) {
                        ax = b('<a class="jspArrow jspArrowLeft" />').bind("mousedown.jsp", aD(-1, 0)).bind("click.jsp", aB); x = b('<a class="jspArrow jspArrowRight" />').bind("mousedown.jsp", aD(1, 0)).bind("click.jsp", aB);
                        if (ay.arrowScrollOnHover) { ax.bind("mouseover.jsp", aD(-1, 0, ax)); x.bind("mouseover.jsp", aD(1, 0, x)) } ak(G, ay.horizontalArrowPositions, ax, x)
                    } h.hover(function () { h.addClass("jspHover") }, function () { h.removeClass("jspHover") }).bind("mousedown.jsp", function (aI) { b("html").bind("dragstart.jsp selectstart.jsp", aB); h.addClass("jspActive"); var s = aI.pageX - h.position().left; b("html").bind("mousemove.jsp", function (aJ) { W(aJ.pageX - s, false) }).bind("mouseup.jsp mouseleave.jsp", aw); return false }); l = al.innerWidth(); ah()
                }
            } function ah() { al.find(">.jspHorizontalBar>.jspCap:visible,>.jspHorizontalBar>.jspArrow").each(function () { l -= b(this).outerWidth() }); G.width(l + "px"); aa = 0 } function F() { if (aE && az) { var aI = G.outerHeight(), s = ap.outerWidth(); t -= aI; b(am).find(">.jspCap:visible,>.jspArrow").each(function () { l += b(this).outerWidth() }); l -= s; v -= s; aj -= aI; G.parent().append(b('<div class="jspCorner" />').css("width", aI + "px")); o(); ah() } if (aE) { Y.width((al.outerWidth() - f) + "px") } Z = Y.outerHeight(); q = Z / v; if (aE) { at = Math.ceil(1 / y * l); if (at > ay.horizontalDragMaxWidth) { at = ay.horizontalDragMaxWidth } else { if (at < ay.horizontalDragMinWidth) { at = ay.horizontalDragMinWidth } } h.width(at + "px"); j = l - at; ae(aa) } if (az) { A = Math.ceil(1 / q * t); if (A > ay.verticalDragMaxHeight) { A = ay.verticalDragMaxHeight } else { if (A < ay.verticalDragMinHeight) { A = ay.verticalDragMinHeight } } au.height(A + "px"); i = t - A; ad(I) } } function ak(aJ, aL, aI, s) { var aN = "before", aK = "after", aM; if (aL == "os") { aL = /Mac/.test(navigator.platform) ? "after" : "split" } if (aL == aN) { aK = aL } else { if (aL == aK) { aN = aL; aM = aI; aI = s; s = aM } } aJ[aN](aI)[aK](s) } function aD(aI, s, aJ) { return function () { H(aI, s, this, aJ); this.blur(); return false } } function H(aL, aK, aO, aN) { aO = b(aO).addClass("jspActive"); var aM, aJ, aI = true, s = function () { if (aL !== 0) { Q.scrollByX(aL * ay.arrowButtonSpeed) } if (aK !== 0) { Q.scrollByY(aK * ay.arrowButtonSpeed) } aJ = setTimeout(s, aI ? ay.initialDelay : ay.arrowRepeatFreq); aI = false }; s(); aM = aN ? "mouseout.jsp" : "mouseup.jsp"; aN = aN || b("html"); aN.bind(aM, function () { aO.removeClass("jspActive"); aJ && clearTimeout(aJ); aJ = null; aN.unbind(aM) }) } function p() { w(); if (az) { ap.bind("mousedown.jsp", function (aN) { if (aN.originalTarget === c || aN.originalTarget == aN.currentTarget) { var aL = b(this), aO = aL.offset(), aM = aN.pageY - aO.top - I, aJ, aI = true, s = function () { var aR = aL.offset(), aS = aN.pageY - aR.top - A / 2, aP = v * ay.scrollPagePercent, aQ = i * aP / (Z - v); if (aM < 0) { if (I - aQ > aS) { Q.scrollByY(-aP) } else { V(aS) } } else { if (aM > 0) { if (I + aQ < aS) { Q.scrollByY(aP) } else { V(aS) } } else { aK(); return } } aJ = setTimeout(s, aI ? ay.initialDelay : ay.trackClickRepeatFreq); aI = false }, aK = function () { aJ && clearTimeout(aJ); aJ = null; b(document).unbind("mouseup.jsp", aK) }; s(); b(document).bind("mouseup.jsp", aK); return false } }) } if (aE) { G.bind("mousedown.jsp", function (aN) { if (aN.originalTarget === c || aN.originalTarget == aN.currentTarget) { var aL = b(this), aO = aL.offset(), aM = aN.pageX - aO.left - aa, aJ, aI = true, s = function () { var aR = aL.offset(), aS = aN.pageX - aR.left - at / 2, aP = aj * ay.scrollPagePercent, aQ = j * aP / (T - aj); if (aM < 0) { if (aa - aQ > aS) { Q.scrollByX(-aP) } else { W(aS) } } else { if (aM > 0) { if (aa + aQ < aS) { Q.scrollByX(aP) } else { W(aS) } } else { aK(); return } } aJ = setTimeout(s, aI ? ay.initialDelay : ay.trackClickRepeatFreq); aI = false }, aK = function () { aJ && clearTimeout(aJ); aJ = null; b(document).unbind("mouseup.jsp", aK) }; s(); b(document).bind("mouseup.jsp", aK); return false } }) } } function w() { if (G) { G.unbind("mousedown.jsp") } if (ap) { ap.unbind("mousedown.jsp") } } function aw() { b("html").unbind("dragstart.jsp selectstart.jsp mousemove.jsp mouseup.jsp mouseleave.jsp"); if (au) { au.removeClass("jspActive") } if (h) { h.removeClass("jspActive") } } function V(s, aI) { if (!az) { return } if (s < 0) { s = 0 } else { if (s > i) { s = i } } if (aI === c) { aI = ay.animateScroll } if (aI) { Q.animate(au, "top", s, ad) } else { au.css("top", s); ad(s) } } function ad(aI) { if (aI === c) { aI = au.position().top } al.scrollTop(0); I = aI; var aL = I === 0, aJ = I == i, aK = aI / i, s = -aK * (Z - v); if (ai != aL || aG != aJ) { ai = aL; aG = aJ; D.trigger("jsp-arrow-change", [ai, aG, P, k]) } u(aL, aJ); Y.css("top", s); D.trigger("jsp-scroll-y", [-s, aL, aJ]).trigger("scroll") } function W(aI, s) {
                if (!aE) { return } if (aI < 0) { aI = 0 } else { if (aI > j) { aI = j } } if (s === c) { s = ay.animateScroll } if (s) {
                    Q.animate(h, "left", aI, ae)
                } else { h.css("left", aI); ae(aI) }
            } function ae(aI) { if (aI === c) { aI = h.position().left } al.scrollTop(0); aa = aI; var aL = aa === 0, aK = aa == j, aJ = aI / j, s = -aJ * (T - aj); if (P != aL || k != aK) { P = aL; k = aK; D.trigger("jsp-arrow-change", [ai, aG, P, k]) } r(aL, aK); Y.css("left", s); D.trigger("jsp-scroll-x", [-s, aL, aK]).trigger("scroll") } function u(aI, s) { if (ay.showArrows) { aq[aI ? "addClass" : "removeClass"]("jspDisabled"); af[s ? "addClass" : "removeClass"]("jspDisabled") } } function r(aI, s) { if (ay.showArrows) { ax[aI ? "addClass" : "removeClass"]("jspDisabled"); x[s ? "addClass" : "removeClass"]("jspDisabled") } } function M(s, aI) { var aJ = s / (Z - v); V(aJ * i, aI) } function N(aI, s) { var aJ = aI / (T - aj); W(aJ * j, s) } function ab(aV, aQ, aJ) { var aN, aK, aL, s = 0, aU = 0, aI, aP, aO, aS, aR, aT; try { aN = b(aV) } catch (aM) { return } aK = aN.outerHeight(); aL = aN.outerWidth(); al.scrollTop(0); al.scrollLeft(0); while (!aN.is(".jspPane")) { s += aN.position().top; aU += aN.position().left; aN = aN.offsetParent(); if (/^body|html$/i.test(aN[0].nodeName)) { return } } aI = aA(); aO = aI + v; if (s < aI || aQ) { aR = s - ay.verticalGutter } else { if (s + aK > aO) { aR = s - v + aK + ay.verticalGutter } } if (aR) { M(aR, aJ) } aP = aC(); aS = aP + aj; if (aU < aP || aQ) { aT = aU - ay.horizontalGutter } else { if (aU + aL > aS) { aT = aU - aj + aL + ay.horizontalGutter } } if (aT) { N(aT, aJ) } } function aC() { return -Y.position().left } function aA() { return -Y.position().top } function K() { var s = Z - v; return (s > 20) && (s - aA() < 10) } function B() { var s = T - aj; return (s > 20) && (s - aC() < 10) } function ag() { al.unbind(ac).bind(ac, function (aL, aM, aK, aI) { var aJ = aa, s = I; Q.scrollBy(aK * ay.mouseWheelSpeed, -aI * ay.mouseWheelSpeed, false); return aJ == aa && s == I }) } function n() { al.unbind(ac) } function aB() { return false } function J() { Y.find(":input,a").unbind("focus.jsp").bind("focus.jsp", function (s) { ab(s.target, false) }) } function E() { Y.find(":input,a").unbind("focus.jsp") } function S() { var s, aI, aK = []; aE && aK.push(am[0]); az && aK.push(U[0]); Y.focus(function () { D.focus() }); D.attr("tabindex", 0).unbind("keydown.jsp keypress.jsp").bind("keydown.jsp", function (aN) { if (aN.target !== this && !(aK.length && b(aN.target).closest(aK).length)) { return } var aM = aa, aL = I; switch (aN.keyCode) { case 40: case 38: case 34: case 32: case 33: case 39: case 37: s = aN.keyCode; aJ(); break; case 35: M(Z - v); s = null; break; case 36: M(0); s = null; break }aI = aN.keyCode == s && aM != aa || aL != I; return !aI }).bind("keypress.jsp", function (aL) { if (aL.keyCode == s) { aJ() } return !aI }); if (ay.hideFocus) { D.css("outline", "none"); if ("hideFocus" in al[0]) { D.attr("hideFocus", true) } } else { D.css("outline", ""); if ("hideFocus" in al[0]) { D.attr("hideFocus", false) } } function aJ() { var aM = aa, aL = I; switch (s) { case 40: Q.scrollByY(ay.keyboardSpeed, false); break; case 38: Q.scrollByY(-ay.keyboardSpeed, false); break; case 34: case 32: Q.scrollByY(v * ay.scrollPagePercent, false); break; case 33: Q.scrollByY(-v * ay.scrollPagePercent, false); break; case 39: Q.scrollByX(ay.keyboardSpeed, false); break; case 37: Q.scrollByX(-ay.keyboardSpeed, false); break }aI = aM != aa || aL != I; return aI } } function R() { D.attr("tabindex", "-1").removeAttr("tabindex").unbind("keydown.jsp keypress.jsp") } function C() { if (location.hash && location.hash.length > 1) { var aK, aI, aJ = escape(location.hash.substr(1)); try { aK = b("#" + aJ + ', a[name="' + aJ + '"]') } catch (s) { return } if (aK.length && Y.find(aJ)) { if (al.scrollTop() === 0) { aI = setInterval(function () { if (al.scrollTop() > 0) { ab(aK, true); b(document).scrollTop(al.position().top); clearInterval(aI) } }, 50) } else { ab(aK, true); b(document).scrollTop(al.position().top) } } } } function m() {
                if (b(document.body).data("jspHijack")) { return } b(document.body).data("jspHijack", true); b(document.body).delegate("a[href*=#]", "click", function (s) {
                    var aI = this.href.substr(0, this.href.indexOf("#")), aK = location.href, aO, aP, aJ, aM, aL, aN; if (location.href.indexOf("#") !== -1) { aK = location.href.substr(0, location.href.indexOf("#")) } if (aI !== aK) { return } aO = escape(this.href.substr(this.href.indexOf("#") + 1)); aP; try { aP = b("#" + aO + ', a[name="' + aO + '"]') } catch (aQ) { return } if (!aP.length) { return } aJ = aP.closest(".jspScrollable"); aM = aJ.data("jsp"); aM.scrollToElement(aP, true); if (aJ[0].scrollIntoView) { aL = b(a).scrollTop(); aN = aP.offset().top; if (aN < aL || aN > aL + b(a).height()) { aJ[0].scrollIntoView() } } s.preventDefault()
                })
            } function an() { var aJ, aI, aL, aK, aM, s = false; al.unbind("touchstart.jsp touchmove.jsp touchend.jsp click.jsp-touchclick").bind("touchstart.jsp", function (aN) { var aO = aN.originalEvent.touches[0]; aJ = aC(); aI = aA(); aL = aO.pageX; aK = aO.pageY; aM = false; s = true }).bind("touchmove.jsp", function (aQ) { if (!s) { return } var aP = aQ.originalEvent.touches[0], aO = aa, aN = I; Q.scrollTo(aJ + aL - aP.pageX, aI + aK - aP.pageY); aM = aM || Math.abs(aL - aP.pageX) > 5 || Math.abs(aK - aP.pageY) > 5; return aO == aa && aN == I }).bind("touchend.jsp", function (aN) { s = false }).bind("click.jsp-touchclick", function (aN) { if (aM) { aM = false; return false } }) } function g() { var s = aA(), aI = aC(); D.removeClass("jspScrollable").unbind(".jsp"); D.replaceWith(ao.append(Y.children())); ao.scrollTop(s); ao.scrollLeft(aI); if (av) { clearInterval(av) } } b.extend(Q, { reinitialise: function (aI) { aI = b.extend({}, ay, aI); ar(aI) }, scrollToElement: function (aJ, aI, s) { ab(aJ, aI, s) }, scrollTo: function (aJ, s, aI) { N(aJ, aI); M(s, aI) }, scrollToX: function (aI, s) { N(aI, s) }, scrollToY: function (s, aI) { M(s, aI) }, scrollToPercentX: function (aI, s) { N(aI * (T - aj), s) }, scrollToPercentY: function (aI, s) { M(aI * (Z - v), s) }, scrollBy: function (aI, s, aJ) { Q.scrollByX(aI, aJ); Q.scrollByY(s, aJ) }, scrollByX: function (s, aJ) { var aI = aC() + Math[s < 0 ? "floor" : "ceil"](s), aK = aI / (T - aj); W(aK * j, aJ) }, scrollByY: function (s, aJ) { var aI = aA() + Math[s < 0 ? "floor" : "ceil"](s), aK = aI / (Z - v); V(aK * i, aJ) }, positionDragX: function (s, aI) { W(s, aI) }, positionDragY: function (aI, s) { V(aI, s) }, animate: function (aI, aL, s, aK) { var aJ = {}; aJ[aL] = s; aI.animate(aJ, { duration: ay.animateDuration, easing: ay.animateEase, queue: false, step: aK }) }, getContentPositionX: function () { return aC() }, getContentPositionY: function () { return aA() }, getContentWidth: function () { return T }, getContentHeight: function () { return Z }, getPercentScrolledX: function () { return aC() / (T - aj) }, getPercentScrolledY: function () { return aA() / (Z - v) }, getIsScrollableH: function () { return aE }, getIsScrollableV: function () { return az }, getContentPane: function () { return Y }, scrollToBottom: function (s) { V(i, s) }, hijackInternalLinks: b.noop, destroy: function () { g() } }); ar(O)
        } e = b.extend({}, b.fn.jScrollPane.defaults, e); b.each(["mouseWheelSpeed", "arrowButtonSpeed", "trackClickSpeed", "keyboardSpeed"], function () { e[this] = e[this] || e.speed }); return this.each(function () { var f = b(this), g = f.data("jsp"); if (g) { g.reinitialise(e) } else { b("script", f).filter("[type=text/javascript],not([type])").remove(); g = new d(f, e); f.data("jsp", g) } })
    }; b.fn.jScrollPane.defaults = { showArrows: false, maintainPosition: true, stickToBottom: false, stickToRight: false, clickOnTrack: true, autoReinitialise: false, autoReinitialiseDelay: 500, verticalDragMinHeight: 0, verticalDragMaxHeight: 99999, horizontalDragMinWidth: 0, horizontalDragMaxWidth: 99999, contentWidth: c, animateScroll: false, animateDuration: 300, animateEase: "linear", hijackInternalLinks: false, verticalGutter: 4, horizontalGutter: 4, mouseWheelSpeed: 0, arrowButtonSpeed: 0, arrowRepeatFreq: 50, arrowScrollOnHover: false, trackClickSpeed: 0, trackClickRepeatFreq: 70, verticalArrowPositions: "split", horizontalArrowPositions: "split", enableKeyboardNavigation: true, hideFocus: false, keyboardSpeed: 0, initialDelay: 300, speed: 30, scrollPagePercent: 0.8 }
})(jQuery, this);






//______________jquery.mousewheel.js____________

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */

(function ($) {

    var types = ['DOMMouseScroll', 'mousewheel'];

    if ($.event.fixHooks) {
        for (var i = types.length; i;) {
            $.event.fixHooks[types[--i]] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function () {
            if (this.addEventListener) {
                for (var i = types.length; i;) {
                    this.addEventListener(types[--i], handler, false);
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function () {
            if (this.removeEventListener) {
                for (var i = types.length; i;) {
                    this.removeEventListener(types[--i], handler, false);
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function (fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function (fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event, args = [].slice.call(arguments, 1), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if (orgEvent.wheelDelta) { delta = orgEvent.wheelDelta / 120; }
        if (orgEvent.detail) { delta = -orgEvent.detail / 3; }

        // New school multidimensional scroll (touchpads) deltas
        deltaY = delta;

        // Gecko
        if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
            deltaY = 0;
            deltaX = -1 * delta;
        }

        // Webkit
        if (orgEvent.wheelDeltaY !== undefined) { deltaY = orgEvent.wheelDeltaY / 120; }
        if (orgEvent.wheelDeltaX !== undefined) { deltaX = -1 * orgEvent.wheelDeltaX / 120; }

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

})(jQuery);









//______________jquery.md5.js____________
/*
 * jQuery MD5 Plugin 1.2.1
 * https://github.com/blueimp/jQuery-MD5
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://creativecommons.org/licenses/MIT/
 * 
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*jslint bitwise: true */
/*global unescape, jQuery */

(function ($) {
    'use strict';

    /*
    * Add integers, wrapping at 2^32. This uses 16-bit operations internally
    * to work around bugs in some JS interpreters.
    */
    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF),
            msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
    * Bitwise rotate a 32-bit number to the left.
    */
    function bit_rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    /*
    * These functions implement the four basic operations the algorithm uses.
    */
    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }
    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    /*
    * Calculate the MD5 of an array of little-endian words, and a bit length.
    */
    function binl_md5(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var i, olda, oldb, oldc, oldd,
            a = 1732584193,
            b = -271733879,
            c = -1732584194,
            d = 271733878;

        for (i = 0; i < x.length; i += 16) {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;

            a = md5_ff(a, b, c, d, x[i], 7, -680876936);
            d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

            a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5_gg(b, c, d, a, x[i], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5_hh(d, a, b, c, x[i], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i], 6, -198630844);
            d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return [a, b, c, d];
    }

    /*
    * Convert an array of little-endian words to a string
    */
    function binl2rstr(input) {
        var i,
            output = '';
        for (i = 0; i < input.length * 32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        }
        return output;
    }

    /*
    * Convert a raw string to an array of little-endian words
    * Characters >255 have their high-byte silently ignored.
    */
    function rstr2binl(input) {
        var i,
            output = [];
        output[(input.length >> 2) - 1] = undefined;
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0;
        }
        for (i = 0; i < input.length * 8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        }
        return output;
    }

    /*
    * Calculate the MD5 of a raw string
    */
    function rstr_md5(s) {
        return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
    }

    /*
    * Calculate the HMAC-MD5, of a key and some data (raw strings)
    */
    function rstr_hmac_md5(key, data) {
        var i,
            bkey = rstr2binl(key),
            ipad = [],
            opad = [],
            hash;
        ipad[15] = opad[15] = undefined;
        if (bkey.length > 16) {
            bkey = binl_md5(bkey, key.length * 8);
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
    }

    /*
    * Convert a raw string to a hex string
    */
    function rstr2hex(input) {
        var hex_tab = '0123456789abcdef',
            output = '',
            x,
            i;
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F) +
                hex_tab.charAt(x & 0x0F);
        }
        return output;
    }

    /*
    * Encode a string as utf-8
    */
    function str2rstr_utf8(input) {
        return unescape(encodeURIComponent(input));
    }

    /*
    * Take string arguments and return either raw or hex encoded strings
    */
    function raw_md5(s) {
        return rstr_md5(str2rstr_utf8(s));
    }
    function hex_md5(s) {
        return rstr2hex(raw_md5(s));
    }
    function raw_hmac_md5(k, d) {
        return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
    }
    function hex_hmac_md5(k, d) {
        return rstr2hex(raw_hmac_md5(k, d));
    }

    $.md5 = function (string, key, raw) {
        if (!key) {
            if (!raw) {
                return hex_md5(string);
            } else {
                return raw_md5(string);
            }
        }
        if (!raw) {
            return hex_hmac_md5(key, string);
        } else {
            return raw_hmac_md5(key, string);
        }
    };

}(typeof jQuery === 'function' ? jQuery : this));















//______________jquery.cookie.js____________
/*!
 * jQuery Cookie Plugin v1.3
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
(function ($, document, undefined) {

    var pluses = /\+/g;

    function raw(s) {
        return s;
    }

    function decoded(s) {
        return decodeURIComponent(s.replace(pluses, ' '));
    }

    var config = $.cookie = function (key, value, options) {

        // write
        if (value !== undefined) {
            options = $.extend({}, config.defaults, options);

            if (value === null) {
                options.expires = -1;
            }

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }

            value = config.json ? JSON.stringify(value) : String(value);

            return (document.cookie = [
                encodeURIComponent(key), '=', config.raw ? value : encodeURIComponent(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path ? '; path=' + options.path : '',
                options.domain ? '; domain=' + options.domain : '',
                options.secure ? '; secure' : ''
            ].join(''));
        }

        // read
        var decode = config.raw ? raw : decoded;
        var cookies = document.cookie.split('; ');
        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            if (decode(parts.shift()) === key) {
                var cookie = decode(parts.join('='));
                return config.json ? JSON.parse(cookie) : cookie;
            }
        }

        return null;
    };

    config.defaults = {};

    $.removeCookie = function (key, options) {
        if ($.cookie(key) !== null) {
            $.cookie(key, null, options);
            return true;
        }
        return false;
    };

})(jQuery, document);













//______________scripts.js____________
jQuery(document).ready(function ($) {
    // cycle for home page main images
    if ($('#mast-images').length > 0) {
        $("#mast-images").cycle({
            fx: "fade",
            pause: true,
            timeout: 7000
        });
    }

    // cycle for footer testimonials
    if ($('#testimonials > .testimony').length > 0) {
        $("#testimonials").cycle({
            fx: "fade",
            pause: true
        });
    }

    // cycle for programs
    if ($('#programssp').length > 0) {
        $("#programssp").cycle({
            fx: "fade",
            pause: true,
            slideExpr: 'img'
        });
    }

    // addClass
    $("#subnavigation li:last").addClass("last");

    // Custom Scrollbars jScrollPane
    $('.scroll-pane').jScrollPane(
        {
            autoReinitialise: true
        }
    );

    // FAQ hide/expand
    if ($('.expand').length > 0) {
        $(".description").hide();
        //toggle the componenet with class msg_body
        $(".expand").click(function () {
            $(this).next(".description").slideToggle(500);
        });
    }

    $('#member_login').submit(function () {
        if ($("#member_login #username").val() == "username" || $("#member_login #username").val() == "") {
            $("#login_message").html('<span style="color:#c00">please enter a username</span>');
        }
        else if ($("#member_login #password").val() == "password" || $("#member_login #password").val() == "") {
            $("#login_message").html('<span style="color:#c00">please enter a password</span>');
        }
        else {
            $("#login_message").html('logging in...');
            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: "http://fmservices.uams.edu/VendorService.svc/GetUserRoles",
                data: { "email": $('input#username').val(), "password": $.md5($('input#password').val()) },
                dataType: "jsonp",
                crossDomain: true,
                success: function (response) {
                    if (response.length > 0) {
                        $("#login_message").html('logged in!');
                        $.cookie('member_login', 'true', { expires: 1, path: '/' });
                        if ($('#member_nav').length == 0) {
                            $('body').append("<nav id='member_nav'>" +
                                "	<ul>" +
                                "		<li><a href='/member-forms'>Forms</a></li>" +
                                "		<li><a href='/member-training'>Training</a></li>" +
                                "		<li><a href='/member-resources'>Resources</a></li>" +
                                "		<li><a href='/member-order-form'>Order Form</a></li>" +
                                "		<li><a id='member_nav_logout' href='#'>Log Out</a></li>" +
                                "	</ul>" +
                                "</nav>");
                            if ($('html').css('margin-top') != '0px') {
                                $('nav#member_nav').css('top', $('html').css('margin-top'));
                                $('html').attr('style', 'margin-top:56px !important');
                            }
                            else
                                $('html').attr('style', 'margin-top:28px !important');
                        }

                    }
                    else
                        $("#login_message").html('<span style="color:#c00">invalid login</span>');
                },
                error: function (message) {
                    $("#login_message").html('error');
                }
            });
        }
        return false;
    });
    $('#forgot_password').click(function () {
        if ($("#member_login #username").val() == "username" || $("#member_login #username").val() == "") {
            $("#login_message").html('<span style="color:#c00">please enter a username</span>');
        }
        else {
            $("#login_message").html('sending new password...');
            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: "http://fmservices.uams.edu/VendorService.svc/ResetPassword",
                data: { "email": $('input#username').val() },
                dataType: "jsonp",
                crossDomain: true,
                success: function (response) {
                    //alert('.'+response+'.');
                    if (response === true) {
                        $("#login_message").html('new password sent to ' + $('input#username').val());
                    }
                    else
                        $("#login_message").html('<span style="color:#c00">unable to reset password</span>');
                },
                error: function (message) {
                    $("#login_message").html('error');
                }
            });
        }
        return false;
    });
    $("#member_login #username").focus(function () {
        if ($(this).val() == "username")
            $(this).val("");
    }).blur(function () {
        if ($(this).val() == "")
            $(this).val("username")
    });
    $("#member_login #password").focus(function () {
        if ($(this).val() == "password")
            $(this).val("");
    }).blur(function () {
        if ($(this).val() == "")
            $(this).val("password");
    });
    $("#member_nav_logout").live('click', function (e) {
        e.preventDefault();
        $.removeCookie('member_login', { path: '/' });
        $('html').attr('style', 'margin-top:28px !important');
        $('nav#member_nav').animate({ top: '-=28' }, 300, function () { $(this).remove(); });
    });
});
