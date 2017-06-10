//	........................................................................................................
//
//  data structure, v0.0
//
//  by xiangchen@acm.org, 06/2017
//
//	........................................................................................................

var XAC = XAC || {};

// 

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

XAC.Sortable.prototype = {
    constructor: XAC.Sortable
};

//
//
//
XAC.Sortable.prototype.insert = function (value) {
    value = parseFloat((value * 100 | 0).toString()) / 100.0;
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
                if(node == undefined) return str;
                str = __printBST(node.left, str);
                str += node.value + ' ';
                str = __printBST(node.right, str);
                return str;
            };
            console.log(__printBST(this._root));

            break;
    }
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