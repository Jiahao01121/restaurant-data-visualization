// https://github.com/quantmind/d3-canvas-transition Version 0.3.6. Copyright 2017 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-selection'), require('d3-collection'), require('d3-color'), require('d3-timer')) :
	typeof define === 'function' && define.amd ? define('d3-canvas-transition', ['exports', 'd3-selection', 'd3-collection', 'd3-color', 'd3-timer'], factory) :
	(factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Selection,d3Collection,d3Color,d3Timer) { 'use strict';

var getSize = function (value, dim) {
    if (typeof value == 'string') {
        if (value.substring(value.length - 2) === 'px') return +value.substring(0, value.length - 2);else if (value.substring(value.length - 1) === '%') return 0.01 * value.substring(0, value.length - 1) * (dim || 1);else if (value.substring(value.length - 2) === 'em') return value.substring(0, value.length - 2) * (dim || 1);
    } else if (typeof value == 'number') return value;
};

var sizeTags = {};

function nodeDim(node) {
    var tag = sizeTags[node.tagName];
    return tag ? tag(node) : { x: 0, y: 0, width: node.context.canvas.width, height: node.context.canvas.height };
}

var gradients = {
    linearGradient: function linearGradient(node, gradNode, opacity) {
        var ctx = gradNode.context,
            dim = nodeDim(node),
            x1 = getSize(gradNode.attrs.get('x1') || '0%', dim.width),
            x2 = getSize(gradNode.attrs.get('x2') || '100%', dim.width),
            y1 = getSize(gradNode.attrs.get('y1') || '0%', dim.height),
            y2 = getSize(gradNode.attrs.get('y2') || '0%', dim.height),
            col;

        var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradNode.each(function (child) {
            col = d3Color.color(child.attrs.get('stop-color'));
            if (opacity || opacity === 0) col.opacity = opacity;
            gradient.addColorStop(getSize(child.attrs.get('offset')), '' + col);
        });
        return gradient;
    },
    radialGradient: function radialGradient(node, gradNode, opacity) {
        var ctx = gradNode.context,
            dim = nodeDim(node),
            cx = getSize(gradNode.attrs.get('cx') || '50%', dim.width),
            cy = getSize(gradNode.attrs.get('cy') || '50%', dim.height),
            fx = getSize(gradNode.attrs.get('fx') || cx, dim.width),
            fy = getSize(gradNode.attrs.get('fy') || cy, dim.height),
            r = getSize(gradNode.attrs.get('r') || '50%', Math.max(dim.height, dim.width)),
            col;

        var gradient = ctx.createRadialGradient(dim.x + fx, dim.y + fy, 0, dim.x + cx, dim.y + cy, r);
        gradNode.each(function (child) {
            col = d3Color.color(child.attrs.get('stop-color'));
            if (opacity || opacity === 0) col.opacity = opacity;
            gradient.addColorStop(getSize(child.attrs.get('offset')), '' + col);
        });
        return gradient;
    }
};

function getColor(node, value, opacity) {
    if (value === 'none') return false;
    if (value) {
        if (typeof value === 'string' && value.substring(0, 4) === 'url(') {
            var selector = value.substring(4, value.length - 1),
                gradNode = selectCanvas(node.rootNode).select(selector).node();
            return gradNode ? gradient(node, gradNode, opacity) : null;
        }
        if (opacity || opacity === 0) {
            var col = d3Color.color(value);
            if (col) {
                col.opacity = opacity;
                return '' + col;
            }
        } else return value;
    }
}

function StyleNode(node) {
    this.node = node;
}

StyleNode.prototype = {
    getPropertyValue: function getPropertyValue(name) {
        var value = this.node.getValue(name);
        if (value === undefined) value = window.getComputedStyle(this.node.context.canvas).getPropertyValue(name);
        return value;
    }
};

function gradient(node, gradNode, opacity) {
    var g = gradients[gradNode.tagName];
    if (g) return g(node, gradNode, opacity);
}

var _setAttribute = function (node, attr, value) {
    var current = node.attrs.get(attr);
    if (current === value) return false;
    node.attrs.set(attr, value);
    return true;
};

function deque() {
    return new Deque();
}

function Deque() {
    this._head = null;
    this._tail = null;
    this._length = 0;

    Object.defineProperty(this, 'length', {
        get: function get() {
            return this._length;
        }
    });
}

Deque.prototype = deque.prototype = {
    prepend: function prepend(child, refChild) {
        if (!this._length) {
            child._prev = null;
            child._next = null;
        } else if (refChild) {
            child._prev = refChild._prev;
            child._next = refChild;

            if (refChild._prev) refChild._prev._next = child;

            refChild._prev = child;
        } else {
            child._prev = this._tail;
            child._next = null;
            this._tail._next = child;
        }
        if (!child._prev) this._head = child;
        if (!child._next) this._tail = child;
        this._length++;
    },
    remove: function remove(child) {
        if (child._prev) child._prev._next = child._next;

        if (child._next) child._next._prev = child._prev;

        if (this._head === child) this._head = child._next;

        if (this._tail === child) this._tail = child._prev;

        delete child._prev;
        delete child._next;

        this._length--;
    },
    list: function list() {
        var child = this._head,
            list = [];
        while (child) {
            list.push(child);
            child = child._next;
        }
        return list;
    },
    each: function each(f) {
        var child = this._head;
        while (child) {
            f(child);
            child = child._next;
        }
    }
};

var conv = Math.PI / 180;

var transform = function (node) {
    var x = +(node.attrs.get('x') || 0),
        y = +(node.attrs.get('y') || 0),
        trans = node.attrs.get('transform'),
        ctx = node.context,
        sx,
        sy,
        angle;

    if (typeof trans === 'string') {
        var index1 = trans.indexOf('translate('),
            index2,
            s,
            bits;
        if (index1 > -1) {
            s = trans.substring(index1 + 10);
            index2 = s.indexOf(')');
            bits = s.substring(0, index2).split(',');
            x += +bits[0];
            if (bits.length === 2) y += +bits[1];
        }

        index1 = trans.indexOf('rotate(');
        if (index1 > -1) {
            s = trans.substring(index1 + 7);
            angle = +s.substring(0, s.indexOf(')'));
        }

        index1 = trans.indexOf('scale(');
        if (index1 > -1) {
            s = trans.substring(index1 + 6);
            index2 = s.indexOf(')');
            bits = s.substring(0, index2).split(',');
            sx = +bits[0];
            if (bits.length === 2) sy = +bits[1];
        }
    } else if (trans) {
        x += trans.x;
        y += trans.y;
        sx = trans.k;
    }
    if (sx) {
        sy = sy || sx;
        ctx.scale(sx, sy);
    }
    if (x || y) ctx.translate(ctx._factor * x, ctx._factor * y);
    if (angle && angle === angle) ctx.rotate(conv * angle);
};

var tagDraws = d3Collection.map();

function touch(node, v) {
    var root = node.rootNode;
    if (!root._touches) root._touches = 0;
    root._touches += v;
    if (!root._touches || root._scheduled) return;
    root._scheduled = d3Timer.timeout(redraw(root));
}

function draw(node, point) {
    var children = node.countNodes,
        drawer = tagDraws.get(node.tagName),
        factor = node.factor,
        attrs = node.attrs;

    if (drawer === false) return;else if (node.attrs) {
        var ctx = node.context,
            stroke,
            width;

        // save the current context
        ctx.save();
        //
        if (attrs['$opacity'] !== undefined) ctx.globalAlpha = +attrs['$opacity'];
        if (attrs['$stroke-linecap']) ctx.lineCap = attrs['$stroke-linecap'];
        if (attrs['$stroke-linejoin']) ctx.lineJoin = attrs['$stroke-linejoin'];
        if (attrs['$mix-blend-mode']) ctx.globalCompositeOperation = attrs['$mix-blend-mode'];
        transform(node);
        //
        // Stroke
        stroke = node.getValue('stroke');
        if (stroke === 'none') stroke = false;else {
            stroke = getColor(node, node.getValue('stroke'), node.getValue('stroke-opacity'));
            if (stroke) ctx.strokeStyle = stroke;
            if (attrs['$stroke-width'] !== undefined) {
                width = getSize(node.attrs['$stroke-width']);
                if (width) ctx.lineWidth = factor * width;
            }
            stroke = width === 0 ? false : true;
        }
        //
        // Fill
        var fill = getColor(node, node.getValue('fill'), node.getValue('fill-opacity'));
        if (fill) ctx.fillStyle = fill;
        fill === 'none' || !fill ? false : true;
        //
        if (drawer) drawer(node, stroke, fill, point);
        if (children) node.each(function (child) {
            return draw(child, point);
        });
        //
        // restore
        ctx.restore();
    } else if (children) {
        node.each(function (child) {
            return draw(child, point);
        });
    }
}

function redraw(node, point, force) {

    return function () {
        if (!node._scheduled && !force) return;
        var ctx = node.context;
        node._touches = 0;
        ctx.beginPath();
        ctx.closePath();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (point) point.nodes = [];
        draw(node, point);
        node._scheduled = false;
        touch(node, 0);
        return point ? point.nodes : null;
    };
}

function NodeIterator(node) {
    this.node = node;
    this.context = node.context;
    this.current = node;
}

NodeIterator.prototype = {
    next: function next() {
        var current = this.current;
        if (!current) return null;
        if (current.firstChild) current = current.firstChild;else {
            while (current) {
                if (current.nextSibling) {
                    current = current.nextSibling;
                    break;
                }
                current = current.parentNode;
                if (current === this.node) current = null;
            }
        }
        this.current = current;
        return current;
    }
};

var mouseEvents = {
    mouseenter: 'mousemove',
    mouseleave: 'mousemove'
};

function canvasListener(event) {
    var context = this.getContext('2d'),
        root = context._rootElement;
    if (!root) return;
    trigger(root, event);
}

function canvasNodeListener(event) {
    var context = this.getContext('2d'),
        root = context._rootElement;
    if (!root) return;

    event.canvasPoint = {
        x: root.factor * event.offsetX,
        y: root.factor * event.offsetY
    };

    var nodes = redraw(root, event.canvasPoint, true)(),
        handler = event.type === 'mousemove' ? mousemoveEvent : defaultEvent;

    handler(context, nodes, event);
}

function defaultEvent(context, nodes, event) {
    for (var i = nodes.length - 1; i >= 0; --i) {
        if (trigger(nodes[i], event)) break;
    }
}

function mousemoveEvent(context, nodes, event) {
    var actives = context._activeNodes,
        newActives = [],
        active = nodes.length ? nodes[nodes.length - 1] : null,
        node,
        i;

    // Handle actives
    if (actives) {
        for (i = 0; i < actives.length; ++i) {
            node = actives[i];
            if (active && node !== active && node.parentNode === active.parentNode) trigger(node, event, 'mouseleave');else if (nodes.indexOf(node) > -1) {
                newActives.push(node);
                trigger(node, event, 'mousemove');
            } else trigger(node, event, 'mouseleave');
        }
    }

    context._activeNodes = actives = newActives;

    if (actives.indexOf(active) === -1) {
        actives.push(active);
        trigger(active, event, 'mouseenter');
    }
}

function trigger(node, event, type) {
    var listeners = node.events[type || event.type];
    if (listeners) {
        for (var j = 0; j < listeners.length; ++j) {
            listeners[j].call(node, event);
        }return node;
    }
}

var namespace = 'canvas';
var canvasStyles = ['cursor'];

/**
 * A proxy for a data entry on canvas
 *
 * It partially implements the Node Api (please pull request!)
 * https://developer.mozilla.org/en-US/docs/Web/API/Node
 *
 * It allows the use the d3-select and d3-transition libraries
 * on canvas joins
 */
function CanvasElement(tagName, context) {
    var _deque,
        events = {},
        text = '';

    Object.defineProperties(this, {
        context: {
            get: function get() {
                return context;
            }
        },
        deque: {
            get: function get() {
                if (!_deque) _deque = deque();
                return _deque;
            }
        },
        events: {
            get: function get() {
                return events;
            }
        },
        tagName: {
            get: function get() {
                return tagName;
            }
        },
        childNodes: {
            get: function get() {
                return _deque ? _deque.list() : [];
            }
        },
        firstChild: {
            get: function get() {
                return _deque ? _deque._head : null;
            }
        },
        lastChild: {
            get: function get() {
                return _deque ? _deque._tail : null;
            }
        },
        parentNode: {
            get: function get() {
                return this._parent;
            }
        },
        previousSibling: {
            get: function get() {
                return this._prev;
            }
        },
        nextSibling: {
            get: function get() {
                return this._next;
            }
        },
        namespaceURI: {
            get: function get() {
                return namespace;
            }
        },
        textContent: {
            get: function get() {
                return text;
            },
            set: function set(value) {
                text = '' + value;
                touch(this, 1);
            }
        },
        clientLeft: {
            get: function get() {
                return context.canvas.clientLeft;
            }
        },
        clientTop: {
            get: function get() {
                return context.canvas.clientTop;
            }
        },
        clientWidth: {
            get: function get() {
                return context.canvas.clientWidth;
            }
        },
        clientHeight: {
            get: function get() {
                return context.canvas.clientHeight;
            }
        },
        rootNode: {
            get: function get() {
                return this.context._rootElement;
            }
        },
        //
        // Canvas Element properties
        countNodes: {
            get: function get() {
                return _deque ? _deque._length : 0;
            }
        },
        factor: {
            get: function get() {
                return this.context._factor;
            }
        }
    });
}

CanvasElement.prototype = {
    querySelectorAll: function querySelectorAll(selector) {
        return this.countNodes ? select$1(selector, this, []) : [];
    },
    querySelector: function querySelector(selector) {
        if (this.countNodes) return select$1(selector, this);
    },
    createElementNS: function createElementNS(namespaceURI, qualifiedName) {
        return new CanvasElement(qualifiedName, this.context);
    },
    hasChildNodes: function hasChildNodes() {
        return this.countNodes > 0;
    },
    contains: function contains(child) {
        while (child) {
            if (child._parent == this) return true;
            child = child._parent;
        }
        return false;
    },
    appendChild: function appendChild(child) {
        return this.insertBefore(child);
    },
    insertBefore: function insertBefore(child, refChild) {
        if (child === this) throw Error('inserting self into children');
        if (!(child instanceof CanvasElement)) throw Error('Cannot insert a non canvas element into a canvas element');
        if (child._parent) child._parent.removeChild(child);
        this.deque.prepend(child, refChild);
        child._parent = this;
        touch(this, 1);
        return child;
    },
    removeChild: function removeChild(child) {
        if (child._parent === this) {
            delete child._parent;
            this.deque.remove(child);
            touch(this, 1);
            return child;
        }
    },
    setAttribute: function setAttribute(attr, value) {
        if (attr === 'class') {
            this.class = value;
        } else if (attr === 'id') {
            this.id = value;
        } else {
            if (!this.attrs) this.attrs = d3Collection.map();
            if (_setAttribute(this, attr, value)) touch(this, 1);
        }
    },
    removeAttribute: function removeAttribute(attr) {
        if (this.attrs) {
            this.attrs.remove(attr);
            touch(this, 1);
        }
    },
    getAttribute: function getAttribute(attr) {
        var value = this.attrs ? this.attrs.get(attr) : undefined;
        if (value === undefined && !this._parent) value = this.context.canvas[attr];
        return value;
    },
    addEventListener: function addEventListener(type, listener) {
        var canvas = this.context.canvas;
        if (this.rootNode === this) {
            arguments[1] = canvasListener;
            canvas.addEventListener.apply(canvas, arguments);
        } else {
            arguments[0] = mouseEvents[type] || type;
            arguments[1] = canvasNodeListener;
            canvas.addEventListener.apply(canvas, arguments);
        }
        var listeners = this.events[type];
        if (!listeners) this.events[type] = listeners = [];
        if (listeners.indexOf(listener) === -1) listeners.push(listener);
    },
    removeEventListener: function removeEventListener(type, listener) {
        var listeners = this.events[type];
        if (listeners) {
            var i = listeners.indexOf(listener);
            if (i > -1) listeners.splice(i, 1);
        }
    },
    getBoundingClientRect: function getBoundingClientRect() {
        return this.context.canvas.getBoundingClientRect();
    },


    // Canvas methods
    each: function each(f) {
        if (this.countNodes) this.deque.each(f);
    },
    getValue: function getValue(attr) {
        var value = this.getAttribute(attr);
        if (value === undefined && this._parent) return this._parent.getValue(attr);
        return value;
    },


    // Additional attribute functions
    removeProperty: function removeProperty(name) {
        this.removeAttribute(name);
    },
    setProperty: function setProperty(name, value) {
        if (canvasStyles.indexOf(name) > -1) this.context.canvas.style[name] = value;else this.setAttribute(name, value);
    },
    getProperty: function getProperty(name) {
        return this.getAttribute(name);
    },
    getPropertyValue: function getPropertyValue(name) {
        return this.getAttribute(name);
    },


    // Proxies to this object
    getComputedStyle: function getComputedStyle(node) {
        return new StyleNode(node);
    },


    get ownerDocument() {
        return this;
    },

    get style() {
        return this;
    },

    get defaultView() {
        return this;
    },

    get document() {
        return this.rootNode;
    }
};

function select$1(selector, node, selections) {

    var selectors = selector.split(' '),
        iterator = new NodeIterator(node),
        child = iterator.next(),
        classes,
        bits,
        tag,
        id,
        sel;

    for (var s = 0; s < selectors.length; ++s) {
        selector = selectors[s];
        if (selector === '*') {
            selector = {};
        } else {
            if (selector.indexOf('#') > -1) {
                bits = selector.split('#');
                tag = bits[0];
                id = bits[1];
            } else if (selector.indexOf('.') > -1) {
                bits = selector.split('.');
                tag = bits[0];
                classes = bits.splice(1).join(' ');
            } else tag = selector;
            selector = { tag: tag, id: id, classes: classes };
        }
        selectors[s] = selector;
    }

    while (child) {
        for (var _s = 0; _s < selectors.length; ++_s) {
            sel = selectors[_s];

            if (!sel.tag || child.tagName === sel.tag) {
                if (sel.id && child.id !== sel.id || sel.classes && child.class !== sel.classes) {
                    // nothing to do
                } else if (selections) {
                    selections.push(child);
                    break;
                } else return child;
            }
        }
        child = iterator.next();
    }

    return selections;
}

var resolution = function (factor) {
    return factor || window.devicePixelRatio || 1;
};

var path = function (p) {

    function cp() {
        return canvasPath(p, arguments);
    }

    return cp;
};

function canvasPath(p, parameters) {

    return function () {
        p.apply(this, parameters);
    };
}

var originalAttr = d3Selection.selection.prototype.attr;
var defaultFactor;

d3Selection.selection.prototype.attr = selectionAttr;
d3Selection.selection.prototype.canvas = asCanvas;
d3Selection.selection.prototype.canvasResolution = canvasResolution;
d3Selection.selection.prototype.draw = drawNode;

function selectCanvas(context, factor) {
    var s = d3Selection.selection();
    if (!context) return s;

    if (isCanvas(context) && arguments.length === 1) return s.select(function () {
        return context;
    });

    if (typeof context === 'string') {
        context = d3Selection.select(context).node();
        if (!context) return s;
    }
    if (context.getContext) context = context.getContext('2d');

    if (!context._rootElement) {
        if (!factor) factor = defaultFactor || resolution();
        context._factor = factor;
        context._rootElement = new CanvasElement('canvas', context);
    }
    return s.select(function () {
        return context._rootElement;
    });
}

function selectionAttr(name, value) {
    if (arguments.length > 1) {
        var node = this._parents[0] || this.node(),
            attr;
        if (isCanvas(node) && typeof value.context === 'function') {
            attr = value.pathObject;
            if (!attr) {
                attr = path(value);
                value.pathObject = attr;
            }
            if (!value.context()) value.context(wrapContext(node.context, node.factor));
            arguments[1] = attr;
        }
    }
    return originalAttr.apply(this, arguments);
}

function isCanvas(node) {
    return node instanceof CanvasElement;
}

function asCanvas(reset) {
    var s = this,
        node = s.node();

    if (node.tagName === 'CANVAS' && !isCanvas(node)) {
        s = selectCanvas(node);
        node = s.node();
    }

    if (isCanvas(node) && reset) {
        var ctx = node.context,
            factor = node.factor,
            width = ctx.canvas.width,
            height = ctx.canvas.height;
        ctx.beginPath();
        ctx.closePath();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        if (factor > 1) {
            ctx.canvas.style.width = width + 'px';
            ctx.canvas.style.height = height + 'px';
            ctx.canvas.width = width * factor;
            ctx.canvas.height = height * factor;
            ctx.scale(factor, factor);
        }
    }

    return s;
}

function canvasResolution(value) {
    if (arguments.length === 1) {
        defaultFactor = value;
        return this;
    }
    return this.factor;
}

function drawNode() {
    var node = this.node();
    if (isCanvas(node)) {
        var root = node.rootNode;
        if (root === node) redraw(node)();else {
            if (root._scheduled) {
                root._scheduled = null;
                root._touches = 0;
            }
            draw(node);
        }
    }
    return this;
}

function wrapContext(context, factor) {
    if (factor === 1) return context;
    return new Context(context, factor);
}

function Context(context, factor) {
    this._context = context;
    this._factor = 1;
    this._f = factor;
}

Context.prototype = {
    beginPath: function beginPath() {
        this._context.beginPath();
    },
    closePath: function closePath() {
        this._context.closePath();
    },
    moveTo: function moveTo(x, y) {
        this._context.moveTo(this._f * x, this._f * y);
    },
    lineTo: function lineTo(x, y) {
        this._context.lineTo(this._f * x, this._f * y);
    },
    arc: function arc() {
        arguments[0] = this._f * arguments[0];
        arguments[1] = this._f * arguments[1];
        arguments[2] = this._f * arguments[2];
        this._context.arc.apply(this._context, arguments);
    },
    rect: function rect(x, y, w, h) {
        this._context.rect(this._f * x, this._f * y, this._f * w, this._f * h);
    },
    quadraticCurveTo: function quadraticCurveTo(cpx, cpy, x, y) {
        this._context.quadraticCurveTo(this._f * cpx, this._f * cpy, this._f * x, this._f * y);
    },
    bezierCurveTo: function bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this._context.bezierCurveTo(this._f * cp1x, this._f * cp1y, this._f * cp2x, this._f * cp2y, this._f * x, this._f * y);
    }
};

var polygon = function (ctx, pts, radius) {
    if (radius > 0) pts = getRoundedPoints(pts, radius);
    var i,
        pt,
        len = pts.length;
    ctx.beginPath();
    for (i = 0; i < len; i++) {
        pt = pts[i];
        if (i === 0) ctx.moveTo(pt[0], pt[1]);else ctx.lineTo(pt[0], pt[1]);
        if (radius > 0) ctx.quadraticCurveTo(pt[2], pt[3], pt[4], pt[5]);
    }
    ctx.closePath();
};

function getRoundedPoints(pts, radius) {
    var i1,
        i2,
        i3,
        p1,
        p2,
        p3,
        prevPt,
        nextPt,
        len = pts.length,
        res = new Array(len);
    for (i2 = 0; i2 < len; i2++) {
        i1 = i2 - 1;
        i3 = i2 + 1;
        if (i1 < 0) i1 = len - 1;
        if (i3 === len) i3 = 0;
        p1 = pts[i1];
        p2 = pts[i2];
        p3 = pts[i3];
        prevPt = getRoundedPoint(p1[0], p1[1], p2[0], p2[1], radius, false);
        nextPt = getRoundedPoint(p2[0], p2[1], p3[0], p3[1], radius, true);
        res[i2] = [prevPt[0], prevPt[1], p2[0], p2[1], nextPt[0], nextPt[1]];
    }
    return res;
}

function getRoundedPoint(x1, y1, x2, y2, radius, first) {
    var total = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        idx = first ? radius / total : (total - radius) / total;
    return [x1 + idx * (x2 - x1), y1 + idx * (y2 - y1)];
}

var version = "0.3.6";

var tau = 2 * Math.PI;

var circle = function (node, stroke, fill, point) {
    var attrs = node.attrs,
        ctx = node.context,
        f = node.factor;
    ctx.beginPath();
    ctx.arc(f * (attrs['$cx'] || 0), f * (attrs['$cy'] || 0), f * (attrs['$r'] || 0), 0, tau);
    ctx.closePath();
    if (stroke) ctx.stroke();
    if (fill) ctx.fill();
    if (point && ctx.isPointInPath(point.x, point.y)) point.nodes.push(node);
};

sizeTags.circle = function (node) {
    var r = node.factor * (node.attrs.get('r') || 0);
    return {
        x: node.factor * (node.attrs.get('cx') || 0) - r,
        y: node.factor * (node.attrs.get('cy') || 0) - r,
        width: 2 * r,
        height: 2 * r
    };
};

var line = function (node, stroke, fill, point) {
    var attrs = node.attrs,
        factor = node.factor,
        ctx = node.context;
    ctx.beginPath();
    ctx.moveTo(factor * (attrs['$x1'] || 0), factor * (attrs['$y1'] || 0));
    ctx.lineTo(factor * attrs['$x2'], factor * attrs['$y2']);
    if (stroke) ctx.stroke();
    if (point && ctx.isPointInPath(point.x, point.y)) point.nodes.push(node);
};

var re = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;

var path$1 = function (node, stroke, fill, point) {
    var path = node.attrs.get('d'),
        ctx = node.context;
    if (path) {
        if (typeof path === 'function') {
            ctx.beginPath();
            path(node);
            if (stroke) ctx.stroke();
            if (fill) ctx.fill();
            if (point && ctx.isPointInPath(point.x, point.y)) point.nodes.push(node);
        } else if (window.Path2D) {
            var Path2D = window.Path2D,
                p = new Path2D(multiply(path, node.factor));
            if (stroke) ctx.stroke(p);
            if (fill) ctx.fill(p);
            if (point && ctx.isPointInPath(p, point.x, point.y)) point.nodes.push(node);
        }
    }
};

function multiply(path, factor) {
    if (factor === 1) return path;
    var pm,
        index = 0,
        result = '';
    path = path + '';
    while (pm = re.exec(path)) {
        result += path.substring(index, pm.index) + factor * pm[0];
        index = pm.index + pm[0].length;
    }
    return result + path.substring(index);
}

var rect = function (node, stroke, fill, point) {
    var attrs = node.attrs,
        ctx = node.context,
        factor = ctx._factor,
        rx = attrs.get('rx') || 0,

    //ry = attrs.get('ry') || 0,
    height = attrs.get('height') || 0,
        width = attrs.get('width') || 0;
    if (width && height && height !== width) ctx.scale(1.0, height / width);
    if (rx) {
        polygon(ctx, [[0, 0], [factor * width, 0], [factor * width, factor * width], [0, factor * width]], factor * rx);
    } else {
        ctx.beginPath();
        ctx.rect(0, 0, factor * width, factor * width);
        ctx.closePath();
    }
    if (stroke) ctx.stroke();
    if (fill) ctx.fill();
    if (point && ctx.isPointInPath(point.x, point.y)) point.nodes.push(node);
};

sizeTags.rect = function (node) {
    var w = node.factor * (node.attrs.get('width') || 0);
    return {
        x: 0,
        y: 0,
        height: w,
        width: w
    };
};

var fontProperties = ['style', 'variant', 'weight', 'size', 'family'];
var defaultBaseline = 'middle';
var textAlign = {
    start: 'start',
    middle: 'center',
    end: 'end'
};

var text = function (node) {
    var factor = node.factor,
        size = fontString(node) / factor,
        ctx = node.context;
    ctx.textAlign = textAlign[node.getValue('text-anchor')] || textAlign.middle;
    ctx.textBaseline = node.getValue('text-baseline') || defaultBaseline;
    ctx.fillText(node.textContent || '', factor * getSize(node.attrs.get('dx') || 0, size), factor * (getSize(node.attrs.get('dy') || 0, size) - 2));
};

function fontString(node) {
    var bits = [],
        size = 0,
        key = void 0,
        v = void 0,
        family = void 0;
    for (var i = 0; i < fontProperties.length; ++i) {
        key = fontProperties[i];
        v = node.getValue('font-' + key);
        if (v) {
            if (key === 'size') {
                size = node.factor * getSize(v);
                v = size + 'px';
            } else if (key === 'family') {
                family = v;
            }
            bits.push(v);
        }
    }
    //
    if (size) {
        if (!family) bits.push('sans serif');
        node.context.font = bits.join(' ');
    }
    return size;
}

tagDraws.set('circle', circle);
tagDraws.set('line', line);
tagDraws.set('path', path$1);
tagDraws.set('rect', rect);
tagDraws.set('text', text);

tagDraws.set('linearGradient', false);
tagDraws.set('radialGradient', false);

exports.selectCanvas = selectCanvas;
exports.resolution = resolution;
exports.getSize = getSize;
exports.canvasPolygon = polygon;
exports.canvasVersion = version;

Object.defineProperty(exports, '__esModule', { value: true });

})));
