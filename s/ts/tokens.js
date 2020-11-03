var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Token = /** @class */ (function () {
    function Token(token) {
        this.raw = token;
    }
    return Token;
}());
// Pure JWTs
var JWT = /** @class */ (function (_super) {
    __extends(JWT, _super);
    function JWT(token) {
        var _this = _super.call(this, token) || this;
        var parts = token.split(".");
        if (parts.length != 3) {
            throw new Error("Invalid token - JWTs have 3 parts separated by '.'");
        }
        _this.header = JSON.parse(atob(parts[0]));
        _this.payload = JSON.parse(atob(parts[1]));
        _this.signature = parts[2];
        return _this;
    }
    return JWT;
}(Token));
//# sourceMappingURL=tokens.js.map