//	........................................................................................................
//
//  data structure, v0.0
//
//  by xiangchen@acm.org, 06/2017
//
//	........................................................................................................

var XAC = XAC || {};

XAC.Sortable = function (algorithm) {
    this._algorithm = algorithm;
    switch (this._algorithm) {
        case XAC.Sortable.BST:
            this._root = {
                value: undefined,
                left: undefined,
                right: undefined
            };
            break;
        case XAC.Sortable.INSERTION:
            this._elms = [];
            break;
    }

};

XAC.Sortable.INSERTION = 0;
XAC.Sortable.BST = 1;

XAC.Sortable.prototype = {
    constructor: XAC.Sortable
};

//
//
//
XAC.Sortable.prototype.insert = function (value) {
    // value = parseFloat((value * 100 | 0).toString()) / 100.0;
    switch (this._algorithm) {
        case XAC.Sortable.BST:
            var node = this._traverse(value, this._root);
            if (node.value == undefined) node.value = value;
            else {
                if (value <= node.value) node.left = {
                    value: value
                };
                else node.right = {
                    value: value
                };
            }
            break;
        case XAC.Sortable.INSERTION:
            var idx = -1;
            for (var i = 0; i < this._elms.length; i++) {
                if (this._elms[i] > value) {
                    this._elms.insert(value, i);
                    idx = i;
                    break;
                }
            }
            if (idx < 0) this._elms.push(value);
            return idx < 0 ? this._elms.length - 1 : idx;
    }
}

XAC.Sortable.prototype.getSortedList = function() {
    switch (this._algorithm) {
        case XAC.Sortable.BST:
            return [];
        case XAC.Sortable.INSERTION:
            return this._elms;
    }
}

//
//
//
XAC.Sortable.prototype.print = function () {
    switch (this._algorithm) {
        case XAC.Sortable.BST:
            var __printBST = function (node, str) {
                var str = str || '';
                if (node == undefined) return str;
                str = __printBST(node.left, str);
                str += node.value + ' ';
                str = __printBST(node.right, str);
                return str;
            };
            console.log(__printBST(this._root));

            break;
        case XAC.Sortable.INSERTION:
            console.log(this._elms);
            break;
    }
}

//
//
//
XAC.Sortable.prototype.getNode = function (value) {
    return this._traverse(value, this._root);
}

//
//  BST traverse
//
XAC.Sortable.prototype._traverse = function (value, node) {
    if (node.value == undefined) return node;
    var nodeNext = value <= node.value ? node.left : node.right;
    if (nodeNext == undefined) return node;
    return this._traverse(value, nodeNext);
}