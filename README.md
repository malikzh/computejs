# Compute.js

An expression calculator for JavaScript


## Features

- Basic math operators:
    - `+` - addition
    - `-` - subtraction
    - `*` - multltiplication
    - `/` - divide
    - `^` - power (right associative)
- Brackets support
- Operators precedence support
- Custom functions support
- Function recursion support
- Variables support
- Unary operators support

## Demo

You can try it [on JSFiddle](https://jsfiddle.net/malikzh/bLgsv3uz/)

## How it use

Just call a function:

```js
Compute(expression, functions, variables);
```

### Simple usage

```js
let result = Compute('5 * (3 + 4) + 3');
console.log(result); // displays 38
```

### Functions call

```js
let result = Compute('10 + dist(5, dist(3, 4))', {
	dist: function (args) {
  	return (args[0] ** 2) + (args[1] ** 2);
  }
 });
 
console.log(result); // displays 660
```

### Variables support

```
let result = Compute('myvar ^ 2', {}, {
	myvar: 32
});
 
console.log(result); // displays 1024
```

## License

This project licensed with [MIT](LICENSE) license
